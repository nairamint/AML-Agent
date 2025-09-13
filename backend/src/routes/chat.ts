import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { llmService } from '../services/llmService';
import { openRouterLLMService } from '../services/openRouterLLMService';
import { auditService } from '../services/auditService';
import { Brief, StreamingChunk } from '../types/advisory';
import { ChatRequestDto, ExpertType, ChatResponse, StreamingChatChunk } from '../types/chat';
import { logger } from '../utils/logger';

// Request/Response schemas
const chatRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  conversationId: z.string().optional(),
  context: z.object({
    jurisdiction: z.string().default('US'),
    role: z.string().default('compliance_officer'),
    organization: z.string().default('financial_institution'),
  }).optional(),
});

// New chat request schema using ChatRequestDto
const newChatRequestSchema = z.object({
  threadId: z.string().min(1, 'Thread ID is required'),
  content: z.string().min(1, 'Content cannot be empty'),
  expertType: z.nativeEnum(ExpertType).optional().default(ExpertType.GENERAL),
  systemInstructions: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(1).optional(),
  attachments: z.array(z.any()).optional(),
});

const streamingRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  conversationId: z.string().optional(),
  context: z.object({
    jurisdiction: z.string().default('US'),
    role: z.string().default('compliance_officer'),
    organization: z.string().default('financial_institution'),
  }).optional(),
});

export async function chatRoutes(fastify: FastifyInstance) {
  // Health check for chat service
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return { status: 'healthy', service: 'chat', timestamp: new Date().toISOString() };
  });

  // New chat endpoint using ChatRequestDto with HTTP streaming
  fastify.post('/chat', {
    preHandler: [fastify.authenticate],
    schema: {
      description: 'Chat with AML/CFT expert using HTTP streaming',
      tags: ['Chat'],
      body: {
        type: 'object',
        required: ['threadId', 'content'],
        properties: {
          threadId: { type: 'string', minLength: 1 },
          content: { type: 'string', minLength: 1 },
          expertType: { 
            type: 'string', 
            enum: Object.values(ExpertType),
            default: ExpertType.GENERAL 
          },
          systemInstructions: { type: 'string' },
          temperature: { type: 'number', minimum: 0, maximum: 1 },
          maxTokens: { type: 'number', minimum: 1 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const chatRequest = newChatRequestSchema.parse(request.body) as ChatRequestDto;

      // Set up Server-Sent Events for HTTP streaming
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');
      reply.raw.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Create SFDR context for the expert system
      const sfdrContext = {
        query: chatRequest.content,
        jurisdiction: 'US', // Default, could be extracted from user context
        entityType: 'INDIVIDUAL' as const,
        riskLevel: 'MEDIUM' as const,
        regulatoryFramework: ['BSA', 'FATCA', 'AML Act'],
        userRole: 'compliance_officer',
        organization: 'financial_institution'
      };

      // Stream the response using OpenRouter LLM service
      await openRouterLLMService.streamSFDRAdvisory(
        sfdrContext,
        (chunk: string) => {
          // Send content chunk
          const streamingChunk: StreamingChatChunk = {
            type: 'content',
            data: { content: chunk },
            timestamp: new Date().toISOString()
          };
          reply.raw.write(`data: ${JSON.stringify(streamingChunk)}\n\n`);
        },
        async (response) => {
          // Send completion with full response
          const chatResponse: ChatResponse = {
            id: `chat-${Date.now()}`,
            threadId: chatRequest.threadId,
            content: response.content,
            expertType: chatRequest.expertType || ExpertType.GENERAL,
            timestamp: new Date().toISOString(),
            metadata: {
              confidence: response.confidence,
              model: 'openrouter-aml-cft-preset'
            }
          };

          const completeChunk: StreamingChatChunk = {
            type: 'complete',
            data: chatResponse,
            timestamp: new Date().toISOString()
          };

          // Log the interaction
          await auditService.logChatInteraction(userId, chatRequest.content, {
            id: chatResponse.id,
            type: 'recommendation',
            title: 'AML/CFT Chat Response',
            content: response.content,
            reasoning: response.reasoning,
            confidence: response.confidence,
            evidence: [],
            followUpSuggestions: [],
            assumptions: [],
            timestamp: chatResponse.timestamp,
            status: 'completed',
            version: '1.0'
          }, chatRequest.threadId);

          reply.raw.write(`data: ${JSON.stringify(completeChunk)}\n\n`);
          reply.raw.end();
        },
        (error) => {
          logger.error('Error streaming chat response:', error);
          const errorChunk: StreamingChatChunk = {
            type: 'error',
            data: { error: error.message },
            timestamp: new Date().toISOString()
          };
          reply.raw.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
          reply.raw.end();
        }
      );
    } catch (error) {
      logger.error('Error setting up chat streaming:', error);
      return reply.status(500).send({ error: 'Failed to setup chat streaming' });
    }
  });

  // Generate advisory response
  fastify.post('/advisory', {
    schema: {
      description: 'Generate AML/CFT advisory response',
      tags: ['Chat'],
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1 },
          conversationId: { type: 'string' },
          context: {
            type: 'object',
            properties: {
              jurisdiction: { type: 'string', default: 'US' },
              role: { type: 'string', default: 'compliance_officer' },
              organization: { type: 'string', default: 'financial_institution' },
            },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            reasoning: { type: 'string' },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
            evidence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  source: { type: 'string' },
                  snippet: { type: 'string' },
                  jurisdiction: { type: 'string' },
                  trustScore: { type: 'number' },
                  relevanceScore: { type: 'number' },
                  url: { type: 'string' },
                },
              },
            },
            followUpSuggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  text: { type: 'string' },
                  type: { type: 'string' },
                  confidence: { type: 'string' },
                },
              },
            },
            assumptions: { type: 'array', items: { type: 'string' } },
            timestamp: { type: 'string' },
            status: { type: 'string' },
            version: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { query, conversationId, context } = chatRequestSchema.parse(request.body);

      // Create multi-agent context
      const multiAgentContext = {
        userQuery: query,
        conversationHistory: [], // TODO: Load from database
        userContext: {
          jurisdiction: context?.jurisdiction || 'US',
          role: context?.role || 'compliance_officer',
          organization: context?.organization || 'financial_institution',
        },
        regulatoryContext: {
          applicableRegulations: ['BSA', 'FATCA', 'AML Act'],
          recentUpdates: [],
          enforcementActions: [],
        },
      };

      // Generate advisory response
      const response = await llmService.generateAdvisory(multiAgentContext);

      // Create brief object
      const brief: Brief = {
        id: `brief-${Date.now()}`,
        type: 'recommendation',
        title: 'AML/CFT Advisory Analysis',
        content: response.content,
        reasoning: response.reasoning,
        confidence: response.confidence,
        evidence: response.evidence,
        followUpSuggestions: response.followUpSuggestions,
        assumptions: response.assumptions,
        timestamp: new Date().toISOString(),
        status: 'completed',
        version: '1.0',
      };

      // Log the interaction
      await auditService.logChatInteraction(userId, query, brief, conversationId);

      return reply.send(brief);
    } catch (error) {
      logger.error('Error generating advisory:', error);
      return reply.status(500).send({ error: 'Failed to generate advisory' });
    }
  });

  // Stream advisory response
  fastify.post('/advisory/stream', {
    schema: {
      description: 'Stream AML/CFT advisory response',
      tags: ['Chat'],
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1 },
          conversationId: { type: 'string' },
          context: {
            type: 'object',
            properties: {
              jurisdiction: { type: 'string', default: 'US' },
              role: { type: 'string', default: 'compliance_officer' },
              organization: { type: 'string', default: 'financial_institution' },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { query, conversationId, context } = streamingRequestSchema.parse(request.body);

      // Set up Server-Sent Events
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');
      reply.raw.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Create multi-agent context
      const multiAgentContext = {
        userQuery: query,
        conversationHistory: [], // TODO: Load from database
        userContext: {
          jurisdiction: context?.jurisdiction || 'US',
          role: context?.role || 'compliance_officer',
          organization: context?.organization || 'financial_institution',
        },
        regulatoryContext: {
          applicableRegulations: ['BSA', 'FATCA', 'AML Act'],
          recentUpdates: [],
          enforcementActions: [],
        },
      };

      // Stream the response
      await llmService.streamAdvisory(
        multiAgentContext,
        (chunk: StreamingChunk) => {
          // Send chunk to client
          reply.raw.write(`data: ${JSON.stringify(chunk)}\n\n`);
        },
        async (response) => {
          // Create final brief
          const brief: Brief = {
            id: `brief-${Date.now()}`,
            type: 'recommendation',
            title: 'AML/CFT Advisory Analysis',
            content: response.content,
            reasoning: response.reasoning,
            confidence: response.confidence,
            evidence: response.evidence,
            followUpSuggestions: response.followUpSuggestions,
            assumptions: response.assumptions,
            timestamp: new Date().toISOString(),
            status: 'completed',
            version: '1.0',
          };

          // Log the interaction
          await auditService.logChatInteraction(userId, query, brief, conversationId);

          // Send completion signal
          reply.raw.write(`data: ${JSON.stringify({ type: 'complete', data: brief })}\n\n`);
          reply.raw.end();
        },
        (error) => {
          logger.error('Error streaming advisory:', error);
          reply.raw.write(`data: ${JSON.stringify({ type: 'error', data: error.message })}\n\n`);
          reply.raw.end();
        }
      );
    } catch (error) {
      logger.error('Error setting up streaming:', error);
      return reply.status(500).send({ error: 'Failed to setup streaming' });
    }
  });

  // Get conversation history
  fastify.get('/conversations/:conversationId', {
    schema: {
      description: 'Get conversation history',
      tags: ['Chat'],
      params: {
        type: 'object',
        properties: {
          conversationId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { conversationId } = request.params as { conversationId: string };

      // TODO: Load conversation from database
      const conversation = {
        id: conversationId,
        messages: [],
        briefs: [],
      };

      return reply.send(conversation);
    } catch (error) {
      logger.error('Error getting conversation:', error);
      return reply.status(500).send({ error: 'Failed to get conversation' });
    }
  });

  // Create new conversation
  fastify.post('/conversations', {
    schema: {
      description: 'Create new conversation',
      tags: ['Chat'],
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          context: {
            type: 'object',
            properties: {
              jurisdiction: { type: 'string', default: 'US' },
              role: { type: 'string', default: 'compliance_officer' },
              organization: { type: 'string', default: 'financial_institution' },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { title, context } = request.body as { title?: string; context?: any };

      // TODO: Create conversation in database
      const conversation = {
        id: `conv-${Date.now()}`,
        title: title || 'New Conversation',
        context,
        createdAt: new Date().toISOString(),
      };

      return reply.send(conversation);
    } catch (error) {
      logger.error('Error creating conversation:', error);
      return reply.status(500).send({ error: 'Failed to create conversation' });
    }
  });

  // Submit feedback
  fastify.post('/feedback', {
    schema: {
      description: 'Submit feedback for advisory response',
      tags: ['Chat'],
      body: {
        type: 'object',
        required: ['briefId', 'type', 'rating'],
        properties: {
          briefId: { type: 'string' },
          type: { type: 'string', enum: ['advisory_quality', 'system_usability', 'feature_request', 'bug_report'] },
          rating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { briefId, type, rating, comment } = request.body as {
        briefId: string;
        type: string;
        rating: number;
        comment?: string;
      };

      // TODO: Save feedback to database
      const feedback = {
        id: `feedback-${Date.now()}`,
        briefId,
        type,
        rating,
        comment,
        userId,
        createdAt: new Date().toISOString(),
      };

      // Log feedback submission
      await auditService.logFeedbackSubmission(userId, briefId, type, rating);

      return reply.send(feedback);
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      return reply.status(500).send({ error: 'Failed to submit feedback' });
    }
  });
}

