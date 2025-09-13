import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

export interface RegulatoryDocument {
  id: string;
  title: string;
  content: string;
  jurisdiction: string;
  regulation: string;
  section?: string;
  version: string;
  lastUpdated: Date;
  metadata?: any;
}

export interface EnforcementAction {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  regulator: string;
  date: Date;
  amount?: number;
  metadata?: any;
}

export class KnowledgeService {
  private static instance: KnowledgeService;
  private qdrant: QdrantClient;
  private prisma: PrismaClient;
  private isInitialized = false;

  private constructor() {
    this.qdrant = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
    this.prisma = new PrismaClient();
  }

  public static getInstance(): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService();
    }
    return KnowledgeService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test Qdrant connection
      await this.qdrant.getCollections();
      
      // Initialize collections
      await this.initializeCollections();
      
      // Load regulatory knowledge
      await this.loadRegulatoryKnowledge();
      
      this.isInitialized = true;
      logger.info('Knowledge Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Knowledge Service:', error);
      throw error;
    }
  }

  private async initializeCollections(): Promise<void> {
    const collections = [
      'regulatory_documents',
      'enforcement_actions',
      'advisory_guidance',
      'case_law',
      'regulatory_updates',
    ];

    for (const collectionName of collections) {
      try {
        const collections = await this.qdrant.getCollections();
        const exists = collections.collections.some(c => c.name === collectionName);

        if (!exists) {
          await this.qdrant.createCollection(collectionName, {
            vectors: {
              size: 1536, // OpenAI embedding size
              distance: 'Cosine',
            },
          });
          logger.info(`Created collection: ${collectionName}`);
        }
      } catch (error) {
        logger.error(`Failed to create collection ${collectionName}:`, error);
      }
    }
  }

  private async loadRegulatoryKnowledge(): Promise<void> {
    try {
      // Load from database
      const documents = await this.prisma.regulatoryDocument.findMany();
      const enforcementActions = await this.prisma.enforcementAction.findMany();

      // Process regulatory documents
      for (const doc of documents) {
        await this.indexDocument('regulatory_documents', doc);
      }

      // Process enforcement actions
      for (const action of enforcementActions) {
        await this.indexDocument('enforcement_actions', action);
      }

      logger.info(`Loaded ${documents.length} regulatory documents and ${enforcementActions.length} enforcement actions`);
    } catch (error) {
      logger.error('Failed to load regulatory knowledge:', error);
    }
  }

  private async indexDocument(collection: string, document: any): Promise<void> {
    try {
      // Generate embedding (simplified - would use actual embedding service)
      const embedding = await this.generateEmbedding(document.content || document.description);
      
      await this.qdrant.upsert(collection, {
        points: [{
          id: document.id,
          vector: embedding,
          payload: document,
        }],
      });
    } catch (error) {
      logger.error(`Failed to index document ${document.id}:`, error);
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simplified embedding generation - would use actual embedding service
    // For now, return a mock embedding
    return Array(1536).fill(0).map(() => Math.random());
  }

  public async searchRegulatoryKnowledge(
    query: string,
    jurisdiction?: string,
    regulation?: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      const searchResults = await this.qdrant.search('regulatory_documents', {
        vector: queryEmbedding,
        limit,
        with_payload: true,
        filter: this.buildFilter(jurisdiction, regulation),
      });

      return searchResults.map(result => ({
        id: result.id,
        score: result.score,
        ...result.payload,
      }));
    } catch (error) {
      logger.error('Failed to search regulatory knowledge:', error);
      return [];
    }
  }

  public async searchEnforcementActions(
    query: string,
    jurisdiction?: string,
    regulator?: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      const searchResults = await this.qdrant.search('enforcement_actions', {
        vector: queryEmbedding,
        limit,
        with_payload: true,
        filter: this.buildEnforcementFilter(jurisdiction, regulator),
      });

      return searchResults.map(result => ({
        id: result.id,
        score: result.score,
        ...result.payload,
      }));
    } catch (error) {
      logger.error('Failed to search enforcement actions:', error);
      return [];
    }
  }

  private buildFilter(jurisdiction?: string, regulation?: string): any {
    const filter: any = {};

    if (jurisdiction || regulation) {
      filter.must = [];
      
      if (jurisdiction) {
        filter.must.push({
          key: 'jurisdiction',
          match: { value: jurisdiction },
        });
      }
      
      if (regulation) {
        filter.must.push({
          key: 'regulation',
          match: { value: regulation },
        });
      }
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  private buildEnforcementFilter(jurisdiction?: string, regulator?: string): any {
    const filter: any = {};

    if (jurisdiction || regulator) {
      filter.must = [];
      
      if (jurisdiction) {
        filter.must.push({
          key: 'jurisdiction',
          match: { value: jurisdiction },
        });
      }
      
      if (regulator) {
        filter.must.push({
          key: 'regulator',
          match: { value: regulator },
        });
      }
    }

    return Object.keys(filter).length > 0 ? filter : undefined;
  }

  public async addRegulatoryDocument(document: RegulatoryDocument): Promise<void> {
    try {
      // Save to database
      await this.prisma.regulatoryDocument.create({
        data: {
          id: document.id,
          title: document.title,
          content: document.content,
          jurisdiction: document.jurisdiction,
          regulation: document.regulation,
          section: document.section,
          version: document.version,
          lastUpdated: document.lastUpdated,
          metadata: document.metadata,
        },
      });

      // Index in vector database
      await this.indexDocument('regulatory_documents', document);
      
      logger.info(`Added regulatory document: ${document.id}`);
    } catch (error) {
      logger.error('Failed to add regulatory document:', error);
      throw error;
    }
  }

  public async addEnforcementAction(action: EnforcementAction): Promise<void> {
    try {
      // Save to database
      await this.prisma.enforcementAction.create({
        data: {
          id: action.id,
          title: action.title,
          description: action.description,
          jurisdiction: action.jurisdiction,
          regulator: action.regulator,
          date: action.date,
          amount: action.amount,
          metadata: action.metadata,
        },
      });

      // Index in vector database
      await this.indexDocument('enforcement_actions', action);
      
      logger.info(`Added enforcement action: ${action.id}`);
    } catch (error) {
      logger.error('Failed to add enforcement action:', error);
      throw error;
    }
  }

  public async updateRegulatoryDocument(id: string, updates: Partial<RegulatoryDocument>): Promise<void> {
    try {
      // Update in database
      const updated = await this.prisma.regulatoryDocument.update({
        where: { id },
        data: updates,
      });

      // Re-index in vector database
      await this.indexDocument('regulatory_documents', updated);
      
      logger.info(`Updated regulatory document: ${id}`);
    } catch (error) {
      logger.error('Failed to update regulatory document:', error);
      throw error;
    }
  }

  public async deleteRegulatoryDocument(id: string): Promise<void> {
    try {
      // Delete from database
      await this.prisma.regulatoryDocument.delete({
        where: { id },
      });

      // Delete from vector database
      await this.qdrant.delete('regulatory_documents', {
        points: [id],
      });
      
      logger.info(`Deleted regulatory document: ${id}`);
    } catch (error) {
      logger.error('Failed to delete regulatory document:', error);
      throw error;
    }
  }

  public async getRegulatoryUpdates(
    jurisdiction?: string,
    since?: Date,
    limit: number = 50
  ): Promise<RegulatoryDocument[]> {
    try {
      const where: any = {};
      
      if (jurisdiction) {
        where.jurisdiction = jurisdiction;
      }
      
      if (since) {
        where.lastUpdated = {
          gte: since,
        };
      }

      const documents = await this.prisma.regulatoryDocument.findMany({
        where,
        orderBy: { lastUpdated: 'desc' },
        take: limit,
      });

      return documents;
    } catch (error) {
      logger.error('Failed to get regulatory updates:', error);
      return [];
    }
  }

  public async getEnforcementActions(
    jurisdiction?: string,
    regulator?: string,
    since?: Date,
    limit: number = 50
  ): Promise<EnforcementAction[]> {
    try {
      const where: any = {};
      
      if (jurisdiction) {
        where.jurisdiction = jurisdiction;
      }
      
      if (regulator) {
        where.regulator = regulator;
      }
      
      if (since) {
        where.date = {
          gte: since,
        };
      }

      const actions = await this.prisma.enforcementAction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
      });

      return actions;
    } catch (error) {
      logger.error('Failed to get enforcement actions:', error);
      return [];
    }
  }

  public async getKnowledgeStats(): Promise<{
    totalDocuments: number;
    totalEnforcementActions: number;
    jurisdictions: string[];
    regulations: string[];
  }> {
    try {
      const [documents, actions, docStats, actionStats] = await Promise.all([
        this.prisma.regulatoryDocument.count(),
        this.prisma.enforcementAction.count(),
        this.prisma.regulatoryDocument.groupBy({
          by: ['jurisdiction', 'regulation'],
        }),
        this.prisma.enforcementAction.groupBy({
          by: ['jurisdiction', 'regulator'],
        }),
      ]);

      const jurisdictions = [
        ...new Set([
          ...docStats.map(s => s.jurisdiction),
          ...actionStats.map(s => s.jurisdiction),
        ]),
      ];

      const regulations = [
        ...new Set(docStats.map(s => s.regulation)),
      ];

      return {
        totalDocuments: documents,
        totalEnforcementActions: actions,
        jurisdictions,
        regulations,
      };
    } catch (error) {
      logger.error('Failed to get knowledge stats:', error);
      return {
        totalDocuments: 0,
        totalEnforcementActions: 0,
        jurisdictions: [],
        regulations: [],
      };
    }
  }
}

export const knowledgeService = KnowledgeService.getInstance();

