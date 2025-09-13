/**
 * Real Database Service Implementation
 * 
 * Production-ready database integration with PostgreSQL, Qdrant, and Redis
 * Replaces in-memory storage with persistent, scalable data layer
 */

import { Pool, PoolClient } from 'pg';
import { QdrantClient } from '@qdrant/js-client-rest';
import Redis from 'ioredis';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from '@langchain/openai';

export interface DatabaseConfig {
  postgres: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    max: number;
  };
  qdrant: {
    url: string;
    apiKey?: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}

export interface RegulatoryDocument {
  id: string;
  title: string;
  content: string;
  jurisdiction: string;
  authority: string;
  type: 'regulation' | 'directive' | 'guidance' | 'case_law';
  effectiveDate: string;
  lastUpdated: string;
  url?: string;
  metadata: Record<string, any>;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  sessionId: string;
  eventType: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'partial';
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  hash: string;
  previousHash?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export class DatabaseService {
  private pgPool: Pool;
  private qdrantClient: QdrantClient;
  private redisClient: Redis;
  private embeddings: OpenAIEmbeddings;
  private isInitialized: boolean = false;

  constructor(private config: DatabaseConfig) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Initialize PostgreSQL connection pool
      await this.initializePostgreSQL();
      
      // Initialize Qdrant vector database
      await this.initializeQdrant();
      
      // Initialize Redis cache
      await this.initializeRedis();
      
      // Create database tables
      await this.createTables();
      
      this.isInitialized = true;
      console.log('DatabaseService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DatabaseService:', error);
      throw error;
    }
  }

  private async initializePostgreSQL(): Promise<void> {
    this.pgPool = new Pool({
      host: this.config.postgres.host,
      port: this.config.postgres.port,
      database: this.config.postgres.database,
      user: this.config.postgres.username,
      password: this.config.postgres.password,
      ssl: this.config.postgres.ssl ? { rejectUnauthorized: false } : false,
      max: this.config.postgres.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await this.pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();
  }

  private async initializeQdrant(): Promise<void> {
    this.qdrantClient = new QdrantClient({
      url: this.config.qdrant.url,
      apiKey: this.config.qdrant.apiKey,
    });

    // Test connection
    await this.qdrantClient.getCollections();
  }

  private async initializeRedis(): Promise<void> {
    this.redisClient = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Test connection
    await this.redisClient.ping();
  }

  private async createTables(): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      // Create regulatory documents table
      await client.query(`
        CREATE TABLE IF NOT EXISTS regulatory_documents (
          id VARCHAR(255) PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          jurisdiction VARCHAR(100) NOT NULL,
          authority VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          effective_date DATE NOT NULL,
          last_updated TIMESTAMP NOT NULL,
          url TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create audit logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(255) PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          session_id VARCHAR(255) NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          category VARCHAR(100) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          description TEXT NOT NULL,
          resource VARCHAR(255) NOT NULL,
          action VARCHAR(100) NOT NULL,
          result VARCHAR(20) NOT NULL,
          metadata JSONB,
          ip_address INET,
          user_agent TEXT,
          hash VARCHAR(255) NOT NULL,
          previous_hash VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create user sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          last_activity TIMESTAMP NOT NULL,
          ip_address INET NOT NULL,
          user_agent TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create conversation history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS conversation_history (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          session_id VARCHAR(255) NOT NULL,
          query TEXT NOT NULL,
          response TEXT NOT NULL,
          confidence DECIMAL(3,2) NOT NULL,
          evidence JSONB,
          processing_time INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
        CREATE INDEX IF NOT EXISTS idx_regulatory_docs_jurisdiction ON regulatory_documents(jurisdiction);
        CREATE INDEX IF NOT EXISTS idx_regulatory_docs_authority ON regulatory_documents(authority);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
        CREATE INDEX IF NOT EXISTS idx_conversation_user_id ON conversation_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_conversation_session_id ON conversation_history(session_id);
      `);

    } finally {
      client.release();
    }
  }

  // Regulatory Documents Operations
  async storeRegulatoryDocument(doc: RegulatoryDocument): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      await client.query(`
        INSERT INTO regulatory_documents (id, title, content, jurisdiction, authority, type, effective_date, last_updated, url, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          jurisdiction = EXCLUDED.jurisdiction,
          authority = EXCLUDED.authority,
          type = EXCLUDED.type,
          effective_date = EXCLUDED.effective_date,
          last_updated = EXCLUDED.last_updated,
          url = EXCLUDED.url,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `, [
        doc.id, doc.title, doc.content, doc.jurisdiction, doc.authority,
        doc.type, doc.effectiveDate, doc.lastUpdated, doc.url, JSON.stringify(doc.metadata)
      ]);

      // Store in Qdrant for vector search
      await this.storeDocumentEmbedding(doc);
      
    } finally {
      client.release();
    }
  }

  async getRegulatoryDocuments(jurisdiction?: string, authority?: string): Promise<RegulatoryDocument[]> {
    const client = await this.pgPool.connect();
    
    try {
      let query = 'SELECT * FROM regulatory_documents WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (jurisdiction) {
        query += ` AND jurisdiction = $${paramIndex}`;
        params.push(jurisdiction);
        paramIndex++;
      }

      if (authority) {
        query += ` AND authority = $${paramIndex}`;
        params.push(authority);
        paramIndex++;
      }

      query += ' ORDER BY last_updated DESC';

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        jurisdiction: row.jurisdiction,
        authority: row.authority,
        type: row.type,
        effectiveDate: row.effective_date,
        lastUpdated: row.last_updated,
        url: row.url,
        metadata: row.metadata || {}
      }));
      
    } finally {
      client.release();
    }
  }

  private async storeDocumentEmbedding(doc: RegulatoryDocument): Promise<void> {
    try {
      // Generate embedding for the document content
      const embedding = await this.embeddings.embedQuery(doc.content);
      
      // Store in Qdrant
      await this.qdrantClient.upsert('regulatory_documents', {
        points: [{
          id: doc.id,
          vector: embedding,
          payload: {
            title: doc.title,
            content: doc.content,
            jurisdiction: doc.jurisdiction,
            authority: doc.authority,
            type: doc.type,
            effective_date: doc.effectiveDate,
            last_updated: doc.lastUpdated,
            url: doc.url,
            ...doc.metadata
          }
        }]
      });
    } catch (error) {
      console.error('Failed to store document embedding:', error);
      // Don't throw - this is not critical for basic functionality
    }
  }

  // Audit Logging Operations
  async logAuditEvent(event: Omit<AuditLog, 'id' | 'hash' | 'previousHash'>): Promise<string> {
    const client = await this.pgPool.connect();
    
    try {
      const eventId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get previous hash for chain verification
      const previousHashResult = await client.query(
        'SELECT hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1'
      );
      const previousHash = previousHashResult.rows[0]?.hash;
      
      // Calculate hash for this event
      const eventData = JSON.stringify({
        id: eventId,
        timestamp: event.timestamp,
        userId: event.userId,
        eventType: event.eventType,
        description: event.description,
        metadata: event.metadata
      });
      const hash = await this.calculateHash(eventData + (previousHash || ''));
      
      // Store audit log
      await client.query(`
        INSERT INTO audit_logs (id, timestamp, user_id, session_id, event_type, category, severity, description, resource, action, result, metadata, ip_address, user_agent, hash, previous_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        eventId, event.timestamp, event.userId, event.sessionId, event.eventType,
        event.category, event.severity, event.description, event.resource, event.action,
        event.result, JSON.stringify(event.metadata), event.ipAddress, event.userAgent,
        hash, previousHash
      ]);
      
      return eventId;
      
    } finally {
      client.release();
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    const client = await this.pgPool.connect();
    
    try {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
      }

      if (filters.eventType) {
        query += ` AND event_type = $${paramIndex}`;
        params.push(filters.eventType);
        paramIndex++;
      }

      if (filters.startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      query += ' ORDER BY timestamp DESC';
      
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
      }

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        userId: row.user_id,
        sessionId: row.session_id,
        eventType: row.event_type,
        category: row.category,
        severity: row.severity,
        description: row.description,
        resource: row.resource,
        action: row.action,
        result: row.result,
        metadata: row.metadata || {},
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        hash: row.hash,
        previousHash: row.previous_hash
      }));
      
    } finally {
      client.release();
    }
  }

  // User Session Operations
  async createUserSession(session: Omit<UserSession, 'id'>): Promise<string> {
    const client = await this.pgPool.connect();
    
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await client.query(`
        INSERT INTO user_sessions (id, user_id, session_token, created_at, expires_at, last_activity, ip_address, user_agent, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        sessionId, session.userId, session.sessionToken, session.createdAt,
        session.expiresAt, session.lastActivity, session.ipAddress, session.userAgent, session.isActive
      ]);
      
      return sessionId;
      
    } finally {
      client.release();
    }
  }

  async validateUserSession(sessionToken: string): Promise<UserSession | null> {
    const client = await this.pgPool.connect();
    
    try {
      const result = await client.query(`
        SELECT * FROM user_sessions 
        WHERE session_token = $1 AND is_active = TRUE AND expires_at > NOW()
      `, [sessionToken]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        sessionToken: row.session_token,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        lastActivity: row.last_activity,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        isActive: row.is_active
      };
      
    } finally {
      client.release();
    }
  }

  // Conversation History Operations
  async storeConversationTurn(turn: {
    userId: string;
    sessionId: string;
    query: string;
    response: string;
    confidence: number;
    evidence: any[];
    processingTime: number;
  }): Promise<string> {
    const client = await this.pgPool.connect();
    
    try {
      const turnId = `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await client.query(`
        INSERT INTO conversation_history (id, user_id, session_id, query, response, confidence, evidence, processing_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        turnId, turn.userId, turn.sessionId, turn.query, turn.response,
        turn.confidence, JSON.stringify(turn.evidence), turn.processingTime
      ]);
      
      return turnId;
      
    } finally {
      client.release();
    }
  }

  async getConversationHistory(userId: string, sessionId?: string, limit: number = 50): Promise<any[]> {
    const client = await this.pgPool.connect();
    
    try {
      let query = 'SELECT * FROM conversation_history WHERE user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (sessionId) {
        query += ` AND session_id = $${paramIndex}`;
        params.push(sessionId);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
      params.push(limit);

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        sessionId: row.session_id,
        query: row.query,
        response: row.response,
        confidence: row.confidence,
        evidence: row.evidence || [],
        processingTime: row.processing_time,
        createdAt: row.created_at
      }));
      
    } finally {
      client.release();
    }
  }

  // Cache Operations
  async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setInCache<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      await this.redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async deleteFromCache(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Utility Methods
  private async calculateHash(data: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test PostgreSQL
      const pgClient = await this.pgPool.connect();
      await pgClient.query('SELECT 1');
      pgClient.release();
      
      // Test Qdrant
      await this.qdrantClient.getCollections();
      
      // Test Redis
      await this.redisClient.ping();
      
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    await this.pgPool.end();
    await this.redisClient.quit();
    this.isInitialized = false;
  }
}

