import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config';
import { logger } from '../utils/logger';

export async function healthRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const redis = new Redis(config.redis.url);
  const qdrant = new QdrantClient({
    url: config.qdrant.url,
    apiKey: config.qdrant.apiKey,
  });

  // Basic health check
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'aml-kyc-advisory-backend',
      version: '1.0.0',
      environment: config.server.env,
    };
  });

  // Detailed health check
  fastify.get('/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'aml-kyc-advisory-backend',
      version: '1.0.0',
      environment: config.server.env,
      checks: {
        database: { status: 'unknown', responseTime: 0 },
        redis: { status: 'unknown', responseTime: 0 },
        qdrant: { status: 'unknown', responseTime: 0 },
        llm: { status: 'unknown', responseTime: 0 },
      },
    };

    let overallStatus = 'healthy';

    // Check database
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbTime = Date.now() - dbStart;
      
      health.checks.database = {
        status: 'healthy',
        responseTime: dbTime,
      };
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
      };
      overallStatus = 'unhealthy';
    }

    // Check Redis
    try {
      const redisStart = Date.now();
      await redis.ping();
      const redisTime = Date.now() - redisStart;
      
      health.checks.redis = {
        status: 'healthy',
        responseTime: redisTime,
      };
    } catch (error) {
      health.checks.redis = {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
      };
      overallStatus = 'unhealthy';
    }

    // Check Qdrant
    try {
      const qdrantStart = Date.now();
      await qdrant.getCollections();
      const qdrantTime = Date.now() - qdrantStart;
      
      health.checks.qdrant = {
        status: 'healthy',
        responseTime: qdrantTime,
      };
    } catch (error) {
      health.checks.qdrant = {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
      };
      overallStatus = 'unhealthy';
    }

    // Check LLM service (Ollama)
    try {
      const llmStart = Date.now();
      const response = await fetch(`${config.llm.ollamaBaseUrl}/api/tags`);
      const llmTime = Date.now() - llmStart;
      
      if (response.ok) {
        health.checks.llm = {
          status: 'healthy',
          responseTime: llmTime,
        };
      } else {
        health.checks.llm = {
          status: 'unhealthy',
          responseTime: llmTime,
          error: `HTTP ${response.status}`,
        };
        overallStatus = 'unhealthy';
      }
    } catch (error) {
      health.checks.llm = {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
      };
      overallStatus = 'unhealthy';
    }

    health.status = overallStatus;

    // Return appropriate status code
    if (overallStatus === 'healthy') {
      return reply.status(200).send(health);
    } else {
      return reply.status(503).send(health);
    }
  });

  // Readiness check
  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if all critical services are available
      await Promise.all([
        prisma.$queryRaw`SELECT 1`,
        redis.ping(),
        qdrant.getCollections(),
      ]);

      return reply.status(200).send({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Readiness check failed', error);
      return reply.status(503).send({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  });

  // Liveness check
  fastify.get('/live', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });

  // Metrics endpoint
  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: config.server.env,
      version: '1.0.0',
    };

    return reply.status(200).send(metrics);
  });
}

