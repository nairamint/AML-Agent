import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { sanctionsService } from '../services/sanctionsService';
import { productionSanctionsScreening } from '../services/productionSanctionsService';
import { logger } from '../utils/logger';

// Request validation schemas
const SanctionsCheckSchema = z.object({
  entityName: z.string().min(1, 'Entity name is required'),
  entityType: z.enum(['INDIVIDUAL', 'CORPORATE', 'VESSEL', 'AIRCRAFT']),
  jurisdiction: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  additionalInfo: z.any().optional()
});

const ProductionScreeningSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  country: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  entityType: z.enum(['INDIVIDUAL', 'CORPORATE', 'VESSEL', 'AIRCRAFT']).optional(),
  additionalInfo: z.any().optional()
});

export async function sanctionsRoutes(fastify: FastifyInstance) {
  // Standard sanctions check endpoint
  fastify.post('/check', {
    schema: {
      description: 'Perform sanctions screening check',
      tags: ['Sanctions'],
      body: SanctionsCheckSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            entityName: { type: 'string' },
            matchesFound: { type: 'boolean' },
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  jurisdiction: { type: 'string' },
                  matchScore: { type: 'number' },
                  matchDetails: { type: 'array' },
                  source: { type: 'string' },
                  lastUpdated: { type: 'string' }
                }
              }
            },
            riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            recommendations: { type: 'array', items: { type: 'string' } },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const requestData = SanctionsCheckSchema.parse(request.body);
      
      logger.info('Sanctions check request received', {
        entityName: requestData.entityName,
        entityType: requestData.entityType
      });

      const result = await sanctionsService.checkSanctions(requestData);
      
      return reply.code(200).send(result);
    } catch (error) {
      logger.error('Sanctions check failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        });
      }
      
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to perform sanctions check'
      });
    }
  });

  // Production comprehensive screening endpoint
  fastify.post('/comprehensive-screening', {
    schema: {
      description: 'Perform comprehensive production sanctions screening',
      tags: ['Sanctions'],
      body: ProductionScreeningSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            requestId: { type: 'string' },
            entityName: { type: 'string' },
            matchesFound: { type: 'boolean' },
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                  jurisdiction: { type: 'string' },
                  matchScore: { type: 'number' },
                  matchDetails: { type: 'array' },
                  source: { type: 'string' },
                  lastUpdated: { type: 'string' },
                  aliases: { type: 'array', items: { type: 'string' } },
                  dateOfBirth: { type: 'string' },
                  nationality: { type: 'string' }
                }
              }
            },
            riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            recommendations: { type: 'array', items: { type: 'string' } },
            timestamp: { type: 'string' },
            sources: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['success', 'error', 'timeout'] },
                  matches: { type: 'number' },
                  error: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const requestData = ProductionScreeningSchema.parse(request.body);
      
      logger.info('Comprehensive screening request received', {
        name: requestData.name,
        entityType: requestData.entityType
      });

      const result = await productionSanctionsScreening.comprehensiveScreening(requestData);
      
      return reply.code(200).send(result);
    } catch (error) {
      logger.error('Comprehensive screening failed:', error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        });
      }
      
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to perform comprehensive screening'
      });
    }
  });

  // Get sanctions statistics
  fastify.get('/stats', {
    schema: {
      description: 'Get sanctions screening statistics',
      tags: ['Sanctions'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalChecks: { type: 'number' },
            matchesFound: { type: 'number' },
            riskLevelDistribution: { type: 'object' },
            topSources: { type: 'object' },
            screeningType: { type: 'string', enum: ['production', 'mock'] },
            productionStats: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await sanctionsService.getSanctionsStats();
      
      return reply.code(200).send(stats);
    } catch (error) {
      logger.error('Failed to get sanctions stats:', error);
      
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to retrieve sanctions statistics'
      });
    }
  });

  // Health check for sanctions services
  fastify.get('/health', {
    schema: {
      description: 'Check sanctions services health',
      tags: ['Sanctions'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                sanctionsService: { type: 'string' },
                productionScreening: { type: 'string' },
                moovWatchman: { type: 'string' },
                ofacAPI: { type: 'string' },
                euSanctions: { type: 'string' },
                unSanctions: { type: 'string' },
                ukSanctions: { type: 'string' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const health = {
        status: 'healthy',
        services: {
          sanctionsService: 'operational',
          productionScreening: 'operational',
          moovWatchman: 'unknown',
          ofacAPI: 'unknown',
          euSanctions: 'unknown',
          unSanctions: 'unknown',
          ukSanctions: 'unknown'
        },
        timestamp: new Date().toISOString()
      };

      // Check production screening availability
      try {
        await productionSanctionsScreening.initialize();
        health.services.productionScreening = 'operational';
      } catch (error) {
        health.services.productionScreening = 'error';
        health.status = 'degraded';
      }

      // Check individual API endpoints (simplified health checks)
      const apiChecks = [
        { name: 'moovWatchman', endpoint: process.env.MOOV_WATCHMAN_ENDPOINT },
        { name: 'ofacAPI', endpoint: process.env.OFAC_API_ENDPOINT },
        { name: 'euSanctions', endpoint: process.env.EU_SANCTIONS_ENDPOINT },
        { name: 'unSanctions', endpoint: process.env.UN_SANCTIONS_ENDPOINT },
        { name: 'ukSanctions', endpoint: process.env.UK_SANCTIONS_ENDPOINT }
      ];

      for (const api of apiChecks) {
        if (api.endpoint) {
          health.services[api.name] = 'configured';
        } else {
          health.services[api.name] = 'not_configured';
        }
      }

      return reply.code(200).send(health);
    } catch (error) {
      logger.error('Health check failed:', error);
      
      return reply.code(500).send({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Batch screening endpoint
  fastify.post('/batch-screening', {
    schema: {
      description: 'Perform batch sanctions screening for multiple entities',
      tags: ['Sanctions'],
      body: {
        type: 'object',
        properties: {
          entities: {
            type: 'array',
            items: ProductionScreeningSchema,
            maxItems: 100
          }
        },
        required: ['entities']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            batchId: { type: 'string' },
            totalEntities: { type: 'number' },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entityName: { type: 'string' },
                  matchesFound: { type: 'boolean' },
                  riskLevel: { type: 'string' },
                  matches: { type: 'array' }
                }
              }
            },
            summary: {
              type: 'object',
              properties: {
                totalMatches: { type: 'number' },
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
      const { entities } = request.body as { entities: any[] };
      const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();
      
      logger.info('Batch screening request received', {
        batchId,
        entityCount: entities.length
      });

      const results = [];
      let totalMatches = 0;
      const riskLevelDistribution: Record<string, number> = {};

      // Process entities in parallel (with concurrency limit)
      const concurrencyLimit = 5;
      for (let i = 0; i < entities.length; i += concurrencyLimit) {
        const batch = entities.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(async (entity) => {
          try {
            const result = await productionSanctionsScreening.comprehensiveScreening(entity);
            
            totalMatches += result.matches.length;
            riskLevelDistribution[result.riskLevel] = (riskLevelDistribution[result.riskLevel] || 0) + 1;
            
            return {
              entityName: entity.name,
              matchesFound: result.matchesFound,
              riskLevel: result.riskLevel,
              matches: result.matches
            };
          } catch (error) {
            logger.error(`Batch screening failed for entity ${entity.name}:`, error);
            return {
              entityName: entity.name,
              matchesFound: false,
              riskLevel: 'LOW',
              matches: [],
              error: 'Screening failed'
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const processingTime = Date.now() - startTime;

      const response = {
        batchId,
        totalEntities: entities.length,
        results,
        summary: {
          totalMatches,
          riskLevelDistribution,
          processingTime
        },
        timestamp: new Date().toISOString()
      };

      logger.info('Batch screening completed', {
        batchId,
        totalEntities: entities.length,
        totalMatches,
        processingTime
      });

      return reply.code(200).send(response);
    } catch (error) {
      logger.error('Batch screening failed:', error);
      
      return reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to perform batch screening'
      });
    }
  });
}
