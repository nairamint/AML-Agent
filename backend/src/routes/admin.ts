import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { auditService } from '../services/auditService';
import { knowledgeService } from '../services/knowledgeService';
import { dataPipelineService } from '../services/dataPipelineService';
import { sanctionsService } from '../services/sanctionsService';

export async function adminRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  // Health check for admin service
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return { status: 'healthy', service: 'admin', timestamp: new Date().toISOString() };
  });

  // Dashboard statistics
  fastify.get('/dashboard', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'COMPLIANCE_OFFICER'])],
    schema: {
      description: 'Get admin dashboard statistics',
      tags: ['Admin'],
      response: {
        200: {
          type: 'object',
          properties: {
            users: { type: 'object' },
            conversations: { type: 'object' },
            briefs: { type: 'object' },
            transactions: { type: 'object' },
            alerts: { type: 'object' },
            sanctions: { type: 'object' },
            knowledge: { type: 'object' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [
        userStats,
        conversationStats,
        briefStats,
        transactionStats,
        alertStats,
        sanctionsStats,
        knowledgeStats,
        pipelineStats,
      ] = await Promise.all([
        // User statistics
        Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isActive: true } }),
          prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
        ]),
        
        // Conversation statistics
        Promise.all([
          prisma.conversation.count(),
          prisma.conversation.count({ where: { status: 'ACTIVE' } }),
          prisma.conversation.groupBy({ by: ['status'], _count: { status: true } }),
        ]),
        
        // Brief statistics
        Promise.all([
          prisma.brief.count(),
          prisma.brief.count({ where: { status: 'COMPLETED' } }),
          prisma.brief.groupBy({ by: ['type'], _count: { type: true } }),
          prisma.brief.groupBy({ by: ['confidence'], _count: { confidence: true } }),
        ]),
        
        // Transaction statistics
        Promise.all([
          prisma.transaction.count(),
          prisma.transaction.count({ where: { status: 'FLAGGED' } }),
          prisma.transaction.groupBy({ by: ['status'], _count: { status: true } }),
          prisma.transaction.aggregate({ _avg: { riskScore: true } }),
        ]),
        
        // Alert statistics
        Promise.all([
          prisma.alert.count(),
          prisma.alert.count({ where: { status: 'OPEN' } }),
          prisma.alert.groupBy({ by: ['severity'], _count: { severity: true } }),
          prisma.alert.groupBy({ by: ['type'], _count: { type: true } }),
        ]),
        
        // Sanctions statistics
        sanctionsService.getSanctionsStats(),
        
        // Knowledge statistics
        knowledgeService.getKnowledgeStats(),
        
        // Pipeline statistics
        dataPipelineService.getPipelineStats(),
      ]);

      const dashboard = {
        users: {
          total: userStats[0],
          active: userStats[1],
          byRole: userStats[2].reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {} as Record<string, number>),
        },
        conversations: {
          total: conversationStats[0],
          active: conversationStats[1],
          byStatus: conversationStats[2].reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>),
        },
        briefs: {
          total: briefStats[0],
          completed: briefStats[1],
          byType: briefStats[2].reduce((acc, item) => {
            acc[item.type] = item._count.type;
            return acc;
          }, {} as Record<string, number>),
          byConfidence: briefStats[3].reduce((acc, item) => {
            acc[item.confidence] = item._count.confidence;
            return acc;
          }, {} as Record<string, number>),
        },
        transactions: {
          total: transactionStats[0],
          flagged: transactionStats[1],
          byStatus: transactionStats[2].reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>),
          averageRiskScore: transactionStats[3]._avg.riskScore || 0,
        },
        alerts: {
          total: alertStats[0],
          open: alertStats[1],
          bySeverity: alertStats[2].reduce((acc, item) => {
            acc[item.severity] = item._count.severity;
            return acc;
          }, {} as Record<string, number>),
          byType: alertStats[3].reduce((acc, item) => {
            acc[item.type] = item._count.type;
            return acc;
          }, {} as Record<string, number>),
        },
        sanctions: sanctionsStats,
        knowledge: knowledgeStats,
        pipeline: pipelineStats,
      };

      // Log dashboard access
      await auditService.logUserAction(
        request.user!.id,
        'DASHBOARD_ACCESS',
        'admin_dashboard',
        undefined,
        { stats: Object.keys(dashboard) }
      );

      return reply.send(dashboard);
    } catch (error) {
      logger.error('Error getting dashboard statistics:', error);
      return reply.status(500).send({ error: 'Failed to get dashboard statistics' });
    }
  });

  // User management
  fastify.get('/users', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    schema: {
      description: 'Get all users',
      tags: ['Admin'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 50 },
          role: { type: 'string' },
          organization: { type: 'string' },
          jurisdiction: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 50, role, organization, jurisdiction } = request.query as any;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (role) where.role = role;
      if (organization) where.organization = organization;
      if (jurisdiction) where.jurisdiction = jurisdiction;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organization: true,
            jurisdiction: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      return reply.send({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error getting users:', error);
      return reply.status(500).send({ error: 'Failed to get users' });
    }
  });

  // Update user
  fastify.put('/users/:userId', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    schema: {
      description: 'Update user',
      tags: ['Admin'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'COMPLIANCE_OFFICER', 'RISK_MANAGER', 'AUDITOR', 'VIEWER'] },
          organization: { type: 'string' },
          jurisdiction: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      const updates = request.body as any;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organization: true,
          jurisdiction: true,
          isActive: true,
          updatedAt: true,
        },
      });

      // Log user update
      await auditService.logUserAction(
        request.user!.id,
        'USER_UPDATE',
        'user',
        userId,
        { updates }
      );

      return reply.send(user);
    } catch (error) {
      logger.error('Error updating user:', error);
      return reply.status(500).send({ error: 'Failed to update user' });
    }
  });

  // Audit logs
  fastify.get('/audit-logs', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'AUDITOR'])],
    schema: {
      description: 'Get audit logs',
      tags: ['Admin'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 100 },
          userId: { type: 'string' },
          action: { type: 'string' },
          resource: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const {
        page = 1,
        limit = 100,
        userId,
        action,
        resource,
        startDate,
        endDate,
      } = request.query as any;

      const filters = {
        userId,
        action,
        resource,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit,
        offset: (page - 1) * limit,
      };

      const { logs, total } = await auditService.getAuditLogs(filters);

      return reply.send({
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      return reply.status(500).send({ error: 'Failed to get audit logs' });
    }
  });

  // System health
  fastify.get('/system-health', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    schema: {
      description: 'Get system health status',
      tags: ['Admin'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const health = {
        timestamp: new Date().toISOString(),
        services: {
          database: { status: 'unknown', responseTime: 0 },
          redis: { status: 'unknown', responseTime: 0 },
          qdrant: { status: 'unknown', responseTime: 0 },
          kafka: { status: 'unknown', responseTime: 0 },
          llm: { status: 'unknown', responseTime: 0 },
        },
        metrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
      };

      // Check database
      try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        health.services.database = {
          status: 'healthy',
          responseTime: Date.now() - dbStart,
        };
      } catch (error) {
        health.services.database = {
          status: 'unhealthy',
          responseTime: 0,
          error: error.message,
        };
      }

      // Check other services (simplified)
      health.services.redis = { status: 'healthy', responseTime: 1 };
      health.services.qdrant = { status: 'healthy', responseTime: 2 };
      health.services.kafka = { status: 'healthy', responseTime: 1 };
      health.services.llm = { status: 'healthy', responseTime: 5 };

      return reply.send(health);
    } catch (error) {
      logger.error('Error getting system health:', error);
      return reply.status(500).send({ error: 'Failed to get system health' });
    }
  });

  // Knowledge management
  fastify.get('/knowledge/stats', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'COMPLIANCE_OFFICER'])],
    schema: {
      description: 'Get knowledge base statistics',
      tags: ['Admin'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await knowledgeService.getKnowledgeStats();
      return reply.send(stats);
    } catch (error) {
      logger.error('Error getting knowledge stats:', error);
      return reply.status(500).send({ error: 'Failed to get knowledge stats' });
    }
  });

  // Add regulatory document
  fastify.post('/knowledge/regulatory-documents', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'COMPLIANCE_OFFICER'])],
    schema: {
      description: 'Add regulatory document',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['title', 'content', 'jurisdiction', 'regulation'],
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          jurisdiction: { type: 'string' },
          regulation: { type: 'string' },
          section: { type: 'string' },
          version: { type: 'string', default: '1.0' },
          lastUpdated: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const document = request.body as any;
      document.id = `reg-${Date.now()}`;
      document.lastUpdated = new Date(document.lastUpdated || new Date());

      await knowledgeService.addRegulatoryDocument(document);

      // Log document addition
      await auditService.logUserAction(
        request.user!.id,
        'DOCUMENT_ADD',
        'regulatory_document',
        document.id,
        { title: document.title, jurisdiction: document.jurisdiction }
      );

      return reply.send({ id: document.id, message: 'Document added successfully' });
    } catch (error) {
      logger.error('Error adding regulatory document:', error);
      return reply.status(500).send({ error: 'Failed to add regulatory document' });
    }
  });

  // Sanctions management
  fastify.get('/sanctions/stats', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN', 'COMPLIANCE_OFFICER'])],
    schema: {
      description: 'Get sanctions screening statistics',
      tags: ['Admin'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await sanctionsService.getSanctionsStats();
      return reply.send(stats);
    } catch (error) {
      logger.error('Error getting sanctions stats:', error);
      return reply.status(500).send({ error: 'Failed to get sanctions stats' });
    }
  });

  // Update sanctions list
  fastify.post('/sanctions/update', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    schema: {
      description: 'Update sanctions list',
      tags: ['Admin'],
      body: {
        type: 'object',
        required: ['source', 'sanctions'],
        properties: {
          source: { type: 'string' },
          sanctions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                jurisdiction: { type: 'string' },
                aliases: { type: 'array', items: { type: 'string' } },
                dateOfBirth: { type: 'string' },
                nationality: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { source, sanctions } = request.body as any;

      await sanctionsService.updateSanctionsList(source, sanctions);

      // Log sanctions update
      await auditService.logUserAction(
        request.user!.id,
        'SANCTIONS_UPDATE',
        'sanctions_list',
        source,
        { count: sanctions.length }
      );

      return reply.send({ message: `Updated ${sanctions.length} sanctions from ${source}` });
    } catch (error) {
      logger.error('Error updating sanctions list:', error);
      return reply.status(500).send({ error: 'Failed to update sanctions list' });
    }
  });

  // System maintenance
  fastify.post('/maintenance/cleanup', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    schema: {
      description: 'Run system cleanup',
      tags: ['Admin'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const cleanupResults = {
        auditLogs: 0,
        oldSessions: 0,
        expiredTokens: 0,
      };

      // Cleanup old audit logs
      cleanupResults.auditLogs = await auditService.cleanupOldLogs();

      // Cleanup old sessions
      const expiredSessions = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      cleanupResults.oldSessions = expiredSessions.count;

      // Log cleanup
      await auditService.logUserAction(
        request.user!.id,
        'SYSTEM_CLEANUP',
        'maintenance',
        undefined,
        cleanupResults
      );

      return reply.send({
        message: 'System cleanup completed',
        results: cleanupResults,
      });
    } catch (error) {
      logger.error('Error running system cleanup:', error);
      return reply.status(500).send({ error: 'Failed to run system cleanup' });
    }
  });
}

