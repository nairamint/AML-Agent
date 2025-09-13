/**
 * Real LLM Service Implementation
 * 
 * Production-ready LLM integration using LangChain and OpenRouter
 * Replaces mock implementations with actual AI model inference
 * Now uses ProductionAMLAgent for enterprise-grade functionality
 */

import { ProductionAMLAgent, ProductionLLMConfig } from './ProductionLLMService';
import { RAGSystem, RAGConfig } from './RAGSystem';
import { AgentContext, AgentResponse, Evidence } from '../agents/BaseAgent';

export interface LLMConfig {
  provider: 'openrouter' | 'openai' | 'anthropic';
  model: string;
  temperature: number;
  maxTokens: number;
  openrouterApiKey?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface VectorSearchResult {
  document: any;
  score: number;
  metadata: any;
}

export interface RAGContext {
  query: string;
  documents: any[];
  metadata: {
    jurisdiction: string;
    frameworks: string[];
    userRole: string;
  };
}

export class RealLLMService {
  private productionAgent: ProductionAMLAgent;
  private ragSystem: RAGSystem;
  private isInitialized: boolean = false;

  constructor(private config: LLMConfig) {
    // Convert legacy config to production config
    const productionConfig: ProductionLLMConfig = {
      openrouterApiKey: config.openrouterApiKey || config.apiKey || process.env.OPENROUTER_API_KEY || '',
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    };

    const ragConfig: RAGConfig = {
      openrouterApiKey: productionConfig.openrouterApiKey
    };

    this.productionAgent = new ProductionAMLAgent(productionConfig);
    this.ragSystem = new RAGSystem(ragConfig);
  }

  async initialize(): Promise<void> {
    try {
      // Initialize production agent and RAG system
      await Promise.all([
        this.productionAgent.initialize(),
        this.ragSystem.initialize()
      ]);
      
      this.isInitialized = true;
      console.log('RealLLMService initialized successfully with production components');
    } catch (error) {
      console.error('Failed to initialize RealLLMService:', error);
      throw error;
    }
  }

  async processRegulatoryQuery(context: AgentContext): Promise<AgentResponse> {
    if (!this.isInitialized) {
      throw new Error('LLM service not initialized');
    }

    try {
      // Use production agent for processing
      return await this.productionAgent.processQuery(context);
    } catch (error) {
      console.error('Error processing regulatory query:', error);
      throw new Error(`LLM processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchRelevantDocuments(query: string, context: AgentContext): Promise<VectorSearchResult[]> {
    try {
      const results = await this.ragSystem.searchRelevantDocuments(query, context);
      return results.map(result => ({
        document: result.document,
        score: result.score,
        metadata: result.metadata
      }));
    } catch (error) {
      console.error('Document search failed:', error);
      return [];
    }
  }

  // Legacy methods for backward compatibility - now delegate to production components
  async addDocuments(documents: any[]): Promise<void> {
    try {
      await this.ragSystem.addDocuments(documents);
    } catch (error) {
      console.error('Failed to add documents:', error);
      throw error;
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      await this.ragSystem.deleteDocuments(ids);
    } catch (error) {
      console.error('Failed to delete documents:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized) return false;
      
      // Check both production agent and RAG system health
      const [agentHealthy, ragHealthy] = await Promise.all([
        this.productionAgent.healthCheck(),
        this.ragSystem.healthCheck()
      ]);
      
      return agentHealthy && ragHealthy;
    } catch (error) {
      console.error('LLM health check failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    try {
      await Promise.all([
        this.productionAgent.cleanup(),
        this.ragSystem.cleanup()
      ]);
      
      this.isInitialized = false;
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

