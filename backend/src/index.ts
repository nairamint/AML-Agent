import Fastify from 'fastify';

import cors from '@fastify/cors';

import helmet from '@fastify/helmet';

import jwt from '@fastify/jwt';

import rateLimit from '@fastify/rate-limit';

import swagger from '@fastify/swagger';

import swaggerUi from '@fastify/swagger-ui';

import { PrismaClient } from '@prisma/client';

import { Redis } from 'ioredis';

import { Kafka } from 'kafkajs';

import { config } from './config';

import { logger } from './utils/logger';

import { errorHandler } from './middleware/errorHandler';

import { authPlugin } from './plugins/auth';

import { chatRoutes } from './routes/chat';

import { adminRoutes } from './routes/admin';

import { healthRoutes } from './routes/health';

import { sanctionsRoutes } from './routes/sanctions';

import { sfdrNavigatorRoutes } from './routes/sfdr-navigator';

import { auditService } from './services/auditService';

import { llmService } from './services/llmService';

import { knowledgeService } from './services/knowledgeService';

import { sanctionsService } from './services/sanctionsService';

import { openRouterLLMService } from './services/openRouterLLMService';



// Initialize services

const prisma = new PrismaClient();

const redis = new Redis(config.redis.url);

const kafka = new Kafka({

  clientId: 'aml-kyc-backend',

  brokers: config.kafka.brokers,

});



// Create Fastify instance

const fastify = Fastify({

  logger: logger,

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

    max: 100,

    timeWindow: '1 minute',

    redis: redis,

  });



  // JWT authentication

  await fastify.register(jwt, {

    secret: config.jwt.secret,

    sign: {

      expiresIn: '24h',

    },

  });



  // Swagger documentation

  await fastify.register(swagger, {

    openapi: {

      openapi: '3.0.0',

      info: {

        title: 'AML/KYC Advisory API',

        description: 'Enterprise-grade AML/CFT advisory chat agent backend',

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



  // Custom plugins

  await fastify.register(authPlugin);

}



// Register routes

async function registerRoutes() {

  await fastify.register(healthRoutes, { prefix: '/api/health' });

  await fastify.register(chatRoutes, { prefix: '/api/chat' });

  await fastify.register(adminRoutes, { prefix: '/api/admin' });

  await fastify.register(sanctionsRoutes, { prefix: '/api/sanctions' });

  await fastify.register(sfdrNavigatorRoutes, { prefix: '/api/sfdr-navigator' });

}



// Register error handler

fastify.setErrorHandler(errorHandler);



// Graceful shutdown

async function gracefulShutdown() {

  logger.info('Starting graceful shutdown...');

  

  try {

    await fastify.close();

    await prisma.$disconnect();

    await redis.disconnect();

    await kafka.disconnect();

    logger.info('Graceful shutdown completed');

    process.exit(0);

  } catch (error) {

    logger.error('Error during graceful shutdown:', error);

    process.exit(1);

  }

}



// Start server

async function start() {

  try {

    // Register plugins and routes

    await registerPlugins();

    await registerRoutes();



    // Initialize services

    await knowledgeService.initialize();

    await llmService.initialize();

    await auditService.initialize();

    await sanctionsService.initialize();

    await openRouterLLMService.initialize();



    // Start server

    const address = await fastify.listen({

      port: config.server.port,

      host: config.server.host,

    });



    logger.info(`🚀 Server running at ${address}`);

    logger.info(`📚 API Documentation: ${address}/api/docs`);

    logger.info(`🔍 Health Check: ${address}/api/health`);



    // Setup graceful shutdown

    process.on('SIGTERM', gracefulShutdown);

    process.on('SIGINT', gracefulShutdown);



  } catch (error) {

    logger.error('Failed to start server:', error);

    process.exit(1);

  }

}



// Handle uncaught exceptions

process.on('uncaughtException', (error) => {

  logger.error('Uncaught Exception:', error);

  process.exit(1);

});



process.on('unhandledRejection', (reason, promise) => {

  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);

  process.exit(1);

});



// Start the server

start();




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



  // Custom plugins

  await fastify.register(authPlugin);

}



// Register routes

async function registerRoutes() {

  await fastify.register(healthRoutes, { prefix: '/api/health' });

  await fastify.register(chatRoutes, { prefix: '/api/chat' });

  await fastify.register(adminRoutes, { prefix: '/api/admin' });

  await fastify.register(sanctionsRoutes, { prefix: '/api/sanctions' });

  await fastify.register(sfdrNavigatorRoutes, { prefix: '/api/sfdr-navigator' });

}



// Register error handler

fastify.setErrorHandler(errorHandler);



// Graceful shutdown

async function gracefulShutdown() {

  logger.info('Starting graceful shutdown...');

  

  try {

    await fastify.close();

    await prisma.$disconnect();

    await redis.disconnect();

    await kafka.disconnect();

    logger.info('Graceful shutdown completed');

    process.exit(0);

  } catch (error) {

    logger.error('Error during graceful shutdown:', error);

    process.exit(1);

  }

}



// Start server

async function start() {

  try {

    // Register plugins and routes

    await registerPlugins();

    await registerRoutes();



    // Initialize services

    await knowledgeService.initialize();

    await llmService.initialize();

    await auditService.initialize();

    await sanctionsService.initialize();

    await openRouterLLMService.initialize();



    // Start server

    const address = await fastify.listen({

      port: config.server.port,

      host: config.server.host,

    });



    logger.info(`🚀 Server running at ${address}`);

    logger.info(`📚 API Documentation: ${address}/api/docs`);

    logger.info(`🔍 Health Check: ${address}/api/health`);



    // Setup graceful shutdown

    process.on('SIGTERM', gracefulShutdown);

    process.on('SIGINT', gracefulShutdown);



  } catch (error) {

    logger.error('Failed to start server:', error);

    process.exit(1);

  }

}



// Handle uncaught exceptions

process.on('uncaughtException', (error) => {

  logger.error('Uncaught Exception:', error);

  process.exit(1);

});



process.on('unhandledRejection', (reason, promise) => {

  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);

  process.exit(1);

});



// Start the server

start();




