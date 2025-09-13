import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { regulatoryDataIngestionService } from '../services/regulatoryDataIngestionService';
import { knowledgeService } from '../services/knowledgeService';
import { logger } from '../utils/logger';

interface RegulatoryIngestionParams {
  sourceId: string;
}

interface RegulatorySearchQuery {
  query: string;
  jurisdiction?: string;
  regulation?: string;
  limit?: number;
}

interface RegulatoryStatsQuery {
  jurisdiction?: string;
  since?: string;
  limit?: number;
}

export async function regulatoryRoutes(fastify: FastifyInstance) {
  // Get ingestion statistics
  fastify.get('/regulatory/ingestion/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await regulatoryDataIngestionService.getIngestionStats();
      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get ingestion stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get ingestion statistics',
      });
    }
  });

  // Trigger manual ingestion from a specific source
  fastify.post<{ Params: RegulatoryIngestionParams }>(
    '/regulatory/ingestion/sources/:sourceId/ingest',
    async (request: FastifyRequest<{ Params: RegulatoryIngestionParams }>, reply: FastifyReply) => {
      try {
        const { sourceId } = request.params;
        
        // Start ingestion in background
        regulatoryDataIngestionService.ingestFromSource(sourceId).catch(error => {
          logger.error(`Background ingestion failed for source ${sourceId}:`, error);
        });

        return reply.send({
          success: true,
          message: `Ingestion started for source: ${sourceId}`,
        });
      } catch (error) {
        logger.error('Failed to start ingestion:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to start ingestion',
        });
      }
    }
  );

  // Search regulatory knowledge
  fastify.get<{ Querystring: RegulatorySearchQuery }>(
    '/regulatory/search',
    async (request: FastifyRequest<{ Querystring: RegulatorySearchQuery }>, reply: FastifyReply) => {
      try {
        const { query, jurisdiction, regulation, limit = 10 } = request.query;

        if (!query) {
          return reply.status(400).send({
            success: false,
            error: 'Query parameter is required',
          });
        }

        const results = await knowledgeService.searchRegulatoryKnowledge(
          query,
          jurisdiction,
          regulation,
          limit
        );

        return reply.send({
          success: true,
          data: {
            query,
            results,
            total: results.length,
          },
        });
      } catch (error) {
        logger.error('Failed to search regulatory knowledge:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to search regulatory knowledge',
        });
      }
    }
  );

  // Search enforcement actions
  fastify.get<{ Querystring: RegulatorySearchQuery }>(
    '/regulatory/enforcement/search',
    async (request: FastifyRequest<{ Querystring: RegulatorySearchQuery }>, reply: FastifyReply) => {
      try {
        const { query, jurisdiction, limit = 10 } = request.query;

        if (!query) {
          return reply.status(400).send({
            success: false,
            error: 'Query parameter is required',
          });
        }

        const results = await knowledgeService.searchEnforcementActions(
          query,
          jurisdiction,
          undefined, // regulator
          limit
        );

        return reply.send({
          success: true,
          data: {
            query,
            results,
            total: results.length,
          },
        });
      } catch (error) {
        logger.error('Failed to search enforcement actions:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to search enforcement actions',
        });
      }
    }
  );

  // Get regulatory updates
  fastify.get<{ Querystring: RegulatoryStatsQuery }>(
    '/regulatory/updates',
    async (request: FastifyRequest<{ Querystring: RegulatoryStatsQuery }>, reply: FastifyReply) => {
      try {
        const { jurisdiction, since, limit = 50 } = request.query;

        const sinceDate = since ? new Date(since) : undefined;
        const updates = await knowledgeService.getRegulatoryUpdates(
          jurisdiction,
          sinceDate,
          limit
        );

        return reply.send({
          success: true,
          data: {
            updates,
            total: updates.length,
            jurisdiction,
            since: sinceDate,
          },
        });
      } catch (error) {
        logger.error('Failed to get regulatory updates:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to get regulatory updates',
        });
      }
    }
  );

  // Get enforcement actions
  fastify.get<{ Querystring: RegulatoryStatsQuery }>(
    '/regulatory/enforcement',
    async (request: FastifyRequest<{ Querystring: RegulatoryStatsQuery }>, reply: FastifyReply) => {
      try {
        const { jurisdiction, since, limit = 50 } = request.query;

        const sinceDate = since ? new Date(since) : undefined;
        const actions = await knowledgeService.getEnforcementActions(
          jurisdiction,
          undefined, // regulator
          sinceDate,
          limit
        );

        return reply.send({
          success: true,
          data: {
            actions,
            total: actions.length,
            jurisdiction,
            since: sinceDate,
          },
        });
      } catch (error) {
        logger.error('Failed to get enforcement actions:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to get enforcement actions',
        });
      }
    }
  );

  // Get knowledge base statistics
  fastify.get('/regulatory/knowledge/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await knowledgeService.getKnowledgeStats();
      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get knowledge stats:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get knowledge statistics',
      });
    }
  });

  // Add new regulatory document (admin only)
  fastify.post('/regulatory/documents', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const document = request.body as any;

      // Validate required fields
      if (!document.title || !document.content || !document.jurisdiction || !document.regulation) {
        return reply.status(400).send({
          success: false,
          error: 'Missing required fields: title, content, jurisdiction, regulation',
        });
      }

      await knowledgeService.addRegulatoryDocument({
        id: document.id || `doc-${Date.now()}`,
        title: document.title,
        content: document.content,
        jurisdiction: document.jurisdiction,
        regulation: document.regulation,
        section: document.section,
        version: document.version || '1.0',
        lastUpdated: new Date(),
        metadata: document.metadata,
      });

      return reply.send({
        success: true,
        message: 'Regulatory document added successfully',
      });
    } catch (error) {
      logger.error('Failed to add regulatory document:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to add regulatory document',
      });
    }
  });

  // Update regulatory document (admin only)
  fastify.put<{ Params: { id: string } }>(
    '/regulatory/documents/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const updates = request.body as any;

        await knowledgeService.updateRegulatoryDocument(id, updates);

        return reply.send({
          success: true,
          message: 'Regulatory document updated successfully',
        });
      } catch (error) {
        logger.error('Failed to update regulatory document:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to update regulatory document',
        });
      }
    }
  );

  // Delete regulatory document (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/regulatory/documents/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        await knowledgeService.deleteRegulatoryDocument(id);

        return reply.send({
          success: true,
          message: 'Regulatory document deleted successfully',
        });
      } catch (error) {
        logger.error('Failed to delete regulatory document:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete regulatory document',
        });
      }
    }
  );

  // Get available jurisdictions
  fastify.get('/regulatory/jurisdictions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await knowledgeService.getKnowledgeStats();
      return reply.send({
        success: true,
        data: {
          jurisdictions: stats.jurisdictions,
          regulations: stats.regulations,
        },
      });
    } catch (error) {
      logger.error('Failed to get jurisdictions:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get jurisdictions',
      });
    }
  });

  // Health check for regulatory services
  fastify.get('/regulatory/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const ingestionStats = await regulatoryDataIngestionService.getIngestionStats();
      const knowledgeStats = await knowledgeService.getKnowledgeStats();

      return reply.send({
        success: true,
        data: {
          ingestion: {
            status: 'healthy',
            activeSources: ingestionStats.activeSources,
            totalSources: ingestionStats.totalSources,
            lastIngestion: ingestionStats.lastIngestion,
          },
          knowledge: {
            status: 'healthy',
            totalDocuments: knowledgeStats.totalDocuments,
            totalEnforcementActions: knowledgeStats.totalEnforcementActions,
            jurisdictions: knowledgeStats.jurisdictions.length,
          },
        },
      });
    } catch (error) {
      logger.error('Regulatory health check failed:', error);
      return reply.status(500).send({
        success: false,
        error: 'Regulatory services health check failed',
      });
    }
  });
}
