import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { openRouterLLMService, SFDRNavigatorContext } from '../services/openRouterLLMService';
import { logger } from '../utils/logger';

// Request validation schemas
const SFDRAdvisoryRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  jurisdiction: z.string().min(1, 'Jurisdiction is required'),
  entityType: z.enum(['INDIVIDUAL', 'CORPORATE', 'VESSEL', 'AIRCRAFT']),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  regulatoryFramework: z.array(z.string()).optional().default([]),
  userRole: z.string().optional().default('Compliance Officer'),
  organization: z.string().optional().default('Financial Institution')
});

const SFDRStreamingRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  jurisdiction: z.string().min(1, 'Jurisdiction is required'),
  entityType: z.enum(['INDIVIDUAL', 'CORPORATE', 'VESSEL', 'AIRCRAFT']),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  regulatoryFramework: z.array(z.string()).optional().default([]),
  userRole: z.string().optional().default('Compliance Officer'),
  organization: z.string().optional().default('Financial Institution')
});

export async function sfdrNavigatorRoutes(fastify: FastifyInstance) {
  // SFDR Advisory endpoint using OpenRouter preset
  fastify.post('/advisory', {
    schema: {
      description: 'Generate AML/CFT regulatory advisory using OpenRouter preset',
      tags: ['SFDR Navigator'],
      body: SFDRAdvisoryRequestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            reasoning: { type: 'string' },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
            riskAssessment: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } },
            regulatoryReferences: { type: 'array', items: { type: 'string' } },
            followUpActions: { type: 'array', items: { type: 'string' } },
            preset: { type: 'object' },
            metadata: {
              type: 'object',
              properties: {
                jurisdiction: { type: 'string' },
                entityType: { type: 'string' },
                riskLevel: { type: 'string' },
                timestamp: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const requestData = SFDRAdvisoryRequestSchema.parse(request.body);
      
      logger.info('AML/CFT advisory request received', {
        query: requestData.query.substring(0, 100) + '...',
        jurisdiction: requestData.jurisdiction,
        entityType: requestData.entityType,
        riskLevel: requestData.riskLevel
      });

      const context: SFDRNavigatorContext = {
        query: requestData.query,
        jurisdiction: requestData.jurisdiction,
        entityType: requestData.entityType,
        riskLevel: requestData.riskLevel,
        regulatoryFramework: requestData.regulatoryFramework,
        userRole: requestData.userRole,
        organization: requestData.organization
      };

      const result = await openRouterLLMService.generateSFDRAdvisory(context);
      const presetInfo = openRouterLLMService.getPresetInfo();

      const response = {
        ...result,
        preset: {
          name: presetInfo.name,
          slug: presetInfo.slug,
          providerPreferences: presetInfo.providerPreferences,
          parameters: presetInfo.parameters
        },
        metadata: {
          jurisdiction: requestData.jurisdiction,
          entityType: requestData.entityType,
          riskLevel: requestData.riskLevel,
          timestamp: new Date().toISOString()
        }
      };
      
      return reply.code(200).send(response);
    } catch (error) {
      logger.error('AML/CFT advisory generation failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        });
      }
      
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to generate AML/CFT advisory'
      });
    }
  });

  // Streaming SFDR Advisory endpoint
  fastify.post('/advisory/stream', {
    schema: {
      description: 'Generate streaming AML/CFT regulatory advisory using OpenRouter preset',
      tags: ['SFDR Navigator'],
      body: SFDRStreamingRequestSchema
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const requestData = SFDRStreamingRequestSchema.parse(request.body);
      
      logger.info('AML/CFT streaming advisory request received', {
        query: requestData.query.substring(0, 100) + '...',
        jurisdiction: requestData.jurisdiction,
        entityType: requestData.entityType
      });

      const context: SFDRNavigatorContext = {
        query: requestData.query,
        jurisdiction: requestData.jurisdiction,
        entityType: requestData.entityType,
        riskLevel: requestData.riskLevel,
        regulatoryFramework: requestData.regulatoryFramework,
        userRole: requestData.userRole,
        organization: requestData.organization
      };

      // Set up Server-Sent Events
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');
      reply.raw.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      const sendChunk = (chunk: string) => {
        reply.raw.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      };

      const sendComplete = (response: any) => {
        reply.raw.write(`data: ${JSON.stringify({ type: 'complete', response })}\n\n`);
        reply.raw.end();
      };

      const sendError = (error: Error) => {
        reply.raw.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        reply.raw.end();
      };

      // Generate streaming advisory
      await openRouterLLMService.streamSFDRAdvisory(
        context,
        sendChunk,
        sendComplete,
        sendError
      );

    } catch (error) {
      logger.error('AML/CFT streaming advisory failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        });
      }
      
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to generate streaming AML/CFT advisory'
      });
    }
  });

  // Get preset information
  fastify.get('/preset', {
    schema: {
      description: 'Get AML/CFT Advisory Agent preset configuration',
      tags: ['SFDR Navigator'],
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            providerPreferences: { type: 'object' },
            parameters: { type: 'object' },
            systemPrompt: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const presetInfo = openRouterLLMService.getPresetInfo();
      
      return reply.code(200).send(presetInfo);
    } catch (error) {
      logger.error('Failed to get preset information:', error);
      
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to retrieve preset information'
      });
    }
  });

  // Get available models
  fastify.get('/models', {
    schema: {
      description: 'Get available models from OpenRouter',
      tags: ['SFDR Navigator'],
      response: {
        200: {
          type: 'object',
          properties: {
            models: { type: 'array', items: { type: 'string' } },
            preset: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const models = await openRouterLLMService.getAvailableModels();
      const presetInfo = openRouterLLMService.getPresetInfo();
      
      return reply.code(200).send({
        models,
        preset: `@preset/${presetInfo.slug}`
      });
    } catch (error) {
      logger.error('Failed to get available models:', error);
      
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to retrieve available models'
      });
    }
  });

  // Health check for SFDR Navigator
  fastify.get('/health', {
    schema: {
      description: 'Check AML/CFT Advisory Agent service health',
      tags: ['SFDR Navigator'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            preset: { type: 'string' },
            openrouter: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const health = {
        status: 'healthy',
        preset: 'aml-cft-advisory-agent',
        openrouter: 'operational',
        timestamp: new Date().toISOString()
      };

      // Test OpenRouter connection
      try {
        await openRouterLLMService.initialize();
        health.openrouter = 'operational';
      } catch (error) {
        health.openrouter = 'error';
        health.status = 'degraded';
      }

      return reply.code(200).send(health);
    } catch (error) {
      logger.error('AML/CFT Advisory Agent health check failed:', error);
      
      return reply.code(500).send({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Batch SFDR advisory processing
  fastify.post('/advisory/batch', {
    schema: {
      description: 'Process multiple AML/CFT advisory requests in batch',
      tags: ['SFDR Navigator'],
      body: {
        type: 'object',
        properties: {
          requests: {
            type: 'array',
            items: SFDRAdvisoryRequestSchema,
            maxItems: 10
          }
        },
        required: ['requests']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
            totalRequests: { type: 'number' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  query: { type: 'string' },
                  jurisdiction: { type: 'string' },
                  confidence: { type: 'string' },
                  riskLevel: { type: 'string' },
                  recommendations: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            summary: {
              type: 'object',
              properties: {
                totalProcessed: { type: 'number' },
                averageConfidence: { type: 'string' },
                riskLevelDistribution: { type: 'object' },
                processingTime: { type: 'number' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requests } = request.body as { requests: any[] };
      const batchId = `sfdr-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();
      
      logger.info('AML/CFT batch advisory request received', {
        batchId,
        requestCount: requests.length
      });

      const results = [];
      let totalProcessed = 0;
      const riskLevelDistribution: Record<string, number> = {};
      const confidenceLevels: string[] = [];

      // Process requests in parallel (with concurrency limit)
      const concurrencyLimit = 3;
      for (let i = 0; i < requests.length; i += concurrencyLimit) {
        const batch = requests.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(async (req) => {
          try {
            const context: SFDRNavigatorContext = {
              query: req.query,
              jurisdiction: req.jurisdiction,
              entityType: req.entityType,
              riskLevel: req.riskLevel,
              regulatoryFramework: req.regulatoryFramework,
              userRole: req.userRole,
              organization: req.organization
            };

            const result = await openRouterLLMService.generateSFDRAdvisory(context);
            
            totalProcessed++;
            riskLevelDistribution[req.riskLevel] = (riskLevelDistribution[req.riskLevel] || 0) + 1;
            confidenceLevels.push(result.confidence);
            
            return {
              query: req.query,
              jurisdiction: req.jurisdiction,
              confidence: result.confidence,
              riskLevel: req.riskLevel,
              recommendations: result.recommendations.slice(0, 3) // Limit to top 3
            };
          } catch (error) {
            logger.error(`AML/CFT batch processing failed for query: ${req.query}`, error);
            return {
              query: req.query,
              jurisdiction: req.jurisdiction,
              confidence: 'low',
              riskLevel: req.riskLevel,
              recommendations: ['Error processing request'],
              error: 'Processing failed'
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const processingTime = Date.now() - startTime;
      const averageConfidence = confidenceLevels.length > 0 
        ? confidenceLevels.reduce((acc, conf) => {
            const scores = { low: 1, medium: 2, high: 3 };
            return acc + (scores[conf as keyof typeof scores] || 1);
          }, 0) / confidenceLevels.length
        : 0;

      const response = {
        batchId,
        totalRequests: requests.length,
        results,
        summary: {
          totalProcessed,
          averageConfidence: averageConfidence > 2.5 ? 'high' : averageConfidence > 1.5 ? 'medium' : 'low',
          riskLevelDistribution,
          processingTime
        },
        timestamp: new Date().toISOString()
      };

      logger.info('AML/CFT batch processing completed', {
        batchId,
        totalProcessed,
        processingTime
      });

      return reply.code(200).send(response);
    } catch (error) {
      logger.error('AML/CFT batch processing failed:', error);
      
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to process batch AML/CFT advisory requests'
      });
    }
  });
}
