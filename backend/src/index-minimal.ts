import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// Minimal configuration without external dependencies
const config = {
  server: {
    port: 3001,
    host: '0.0.0.0',
    env: 'development',
  },
  jwt: {
    secret: 'your_super_secret_jwt_key_at_least_32_characters_long_for_development',
    expiresIn: '24h',
  },
  cors: {
    origins: ['http://localhost:5173', 'http://localhost:3000'],
  },
  security: {
    rateLimit: {
      max: 100,
      window: 60000,
    },
  },
};

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
  trustProxy: true,
  bodyLimit: 1048576, // 1MB
  requestTimeout: 30000, // 30s
});

// Register plugins
async function registerPlugins() {
  // Security plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  await fastify.register(cors, {
    origin: config.cors.origins,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: config.security.rateLimit.max,
    timeWindow: config.security.rateLimit.window,
  });

  // JWT authentication
  await fastify.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'AML/KYC Advisory API (Minimal)',
        description: 'Minimal version for testing without external dependencies',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${config.server.port}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get('/api/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'aml-kyc-backend-minimal', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  // Chat health check
  fastify.get('/api/chat/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'chat', 
      timestamp: new Date().toISOString() 
    };
  });

  // Admin health check
  fastify.get('/api/admin/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      service: 'admin', 
      timestamp: new Date().toISOString() 
    };
  });

  // Minimal chat endpoint (without authentication for testing)
  fastify.post('/api/chat/chat', {
    schema: {
      description: 'Chat with AML/CFT expert (minimal version)',
      tags: ['Chat'],
      body: {
        type: 'object',
        required: ['threadId', 'content'],
        properties: {
          threadId: { type: 'string', minLength: 1 },
          content: { type: 'string', minLength: 1 },
          expertType: { 
            type: 'string', 
            enum: ['GENERAL', 'AML_CFT', 'SANCTIONS', 'RISK_ASSESSMENT'],
            default: 'AML_CFT' 
          },
          systemInstructions: { type: 'string' },
          temperature: { type: 'number', minimum: 0, maximum: 1 },
          maxTokens: { type: 'number', minimum: 1 },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { threadId, content, expertType = 'AML_CFT' } = request.body as any;

      // Set up Server-Sent Events for HTTP streaming
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');
      reply.raw.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // Simulate streaming response
      const mockResponse = `Based on your query "${content}", here's a comprehensive AML/CFT advisory analysis:

## Executive Summary
This is a mock response from the minimal backend. The system is working but requires full LLM integration.

## Key Recommendations
1. Implement proper customer due diligence (CDD) procedures
2. Conduct enhanced due diligence (EDD) for high-risk customers
3. Monitor transactions for suspicious activity
4. Maintain comprehensive audit trails

## Regulatory Framework
- Bank Secrecy Act (BSA)
- USA PATRIOT Act
- FATCA requirements
- OFAC sanctions screening

## Next Steps
1. Complete backend dependency setup
2. Integrate with real LLM services
3. Implement proper authentication
4. Add compliance controls

This is a test response to verify the frontend-backend integration is working.`;

      // Stream the response in chunks
      const chunks = mockResponse.split(' ');
      let currentChunk = '';
      
      for (let i = 0; i < chunks.length; i++) {
        currentChunk += chunks[i] + ' ';
        
        if (i % 10 === 0 || i === chunks.length - 1) {
          const streamingChunk = {
            type: 'content',
            data: { content: currentChunk },
            timestamp: new Date().toISOString()
          };
          
          reply.raw.write(`data: ${JSON.stringify(streamingChunk)}\n\n`);
          currentChunk = '';
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Send completion signal
      const completeChunk = {
        type: 'complete',
        data: {
          id: `chat-${Date.now()}`,
          threadId,
          content: mockResponse,
          expertType,
          timestamp: new Date().toISOString(),
          metadata: {
            confidence: 'high',
            model: 'minimal-backend-mock'
          }
        },
        timestamp: new Date().toISOString()
      };

      reply.raw.write(`data: ${JSON.stringify(completeChunk)}\n\n`);
      reply.raw.end();

    } catch (error) {
      fastify.log.error('Error in chat endpoint:', error);
      return reply.status(500).send({ error: 'Failed to process chat request' });
    }
  });

  // Legacy advisory endpoint for backward compatibility
  fastify.post('/api/chat/advisory/stream', {
    schema: {
      description: 'Legacy advisory endpoint (redirects to new chat endpoint)',
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
  }, async (request, reply) => {
    try {
      const { query, conversationId, context } = request.body as any;
      
      // Convert legacy request to new format
      const newRequest = {
        threadId: conversationId || `thread-${Date.now()}`,
        content: query,
        expertType: 'AML_CFT',
        temperature: 0.2,
        maxTokens: 1000,
        systemInstructions: context?.systemInstructions
      };

      // Forward to new chat endpoint
      return fastify.inject({
        method: 'POST',
        url: '/api/chat/chat',
        payload: newRequest
      });

    } catch (error) {
      fastify.log.error('Error in legacy advisory endpoint:', error);
      return reply.status(500).send({ error: 'Failed to process advisory request' });
    }
  });
}

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(500).send({ 
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
async function start() {
  try {
    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();

    // Start server
    const address = await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    fastify.log.info(`🚀 Minimal Backend Server running at ${address}`);
    fastify.log.info(`📚 API Documentation: ${address}/api/docs`);
    fastify.log.info(`🔍 Health Check: ${address}/api/health`);
    fastify.log.info(`💬 Chat Endpoint: ${address}/api/chat/chat`);

  } catch (error) {
    fastify.log.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  fastify.log.info('Starting graceful shutdown...');
  try {
    await fastify.close();
    fastify.log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  fastify.log.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Setup graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
start();
