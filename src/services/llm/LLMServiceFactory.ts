/**
 * LLM Service Factory
 * 
 * Factory for creating and initializing production-ready LLM services
 * with proper configuration and error handling
 */

import { RealLLMService, LLMConfig } from './RealLLMService';
import { ProductionAMLAgent, ProductionLLMConfig } from './ProductionLLMService';
import { ProductionMultiAgentSystem } from './ProductionLLMService';
import { RAGSystem, RAGConfig } from './RAGSystem';
import { LLMConfigService } from '../config/LLMConfigService';

export interface LLMServiceOptions {
  useProductionAgent?: boolean;
  useMultiAgentSystem?: boolean;
  useRAGSystem?: boolean;
  customConfig?: Partial<LLMConfig>;
}

export class LLMServiceFactory {
  private static instance: LLMServiceFactory;
  private configService: LLMConfigService;

  private constructor() {
    this.configService = LLMConfigService.getInstance();
  }

  public static getInstance(): LLMServiceFactory {
    if (!LLMServiceFactory.instance) {
      LLMServiceFactory.instance = new LLMServiceFactory();
    }
    return LLMServiceFactory.instance;
  }

  /**
   * Create a production-ready LLM service
   */
  public async createProductionService(options: LLMServiceOptions = {}): Promise<RealLLMService> {
    try {
      // Validate configuration
      const validation = this.configService.validateConfiguration();
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Get configuration
      const config = this.configService.getOpenRouterConfig();
      
      // Create LLM config
      const llmConfig: LLMConfig = {
        provider: 'openrouter',
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        openrouterApiKey: config.openrouterApiKey,
        pineconeApiKey: config.pineconeApiKey,
        pineconeEnvironment: config.pineconeEnvironment,
        pineconeIndexName: config.pineconeIndexName,
        ...options.customConfig
      };

      // Create and initialize service
      const service = new RealLLMService(llmConfig);
      await service.initialize();

      console.log('Production LLM service created successfully');
      return service;
    } catch (error) {
      console.error('Failed to create production LLM service:', error);
      throw error;
    }
  }

  /**
   * Create a standalone production AML agent
   */
  public async createProductionAgent(options: {
    model?: string;
    customConfig?: Partial<ProductionLLMConfig>;
  } = {}): Promise<ProductionAMLAgent> {
    try {
      const config = this.configService.getOpenRouterConfig();
      
      const agentConfig: ProductionLLMConfig = {
        ...config,
        model: options.model || config.model,
        ...options.customConfig
      };

      const agent = new ProductionAMLAgent(agentConfig);
      await agent.initialize();

      console.log('Production AML agent created successfully');
      return agent;
    } catch (error) {
      console.error('Failed to create production AML agent:', error);
      throw error;
    }
  }

  /**
   * Create a multi-agent system
   */
  public async createMultiAgentSystem(options: {
    customConfig?: Partial<ProductionLLMConfig>;
  } = {}): Promise<ProductionMultiAgentSystem> {
    try {
      const config = this.configService.getOpenRouterConfig();
      
      const systemConfig: ProductionLLMConfig = {
        ...config,
        ...options.customConfig
      };

      const system = new ProductionMultiAgentSystem(systemConfig);
      await system.initialize();

      console.log('Production multi-agent system created successfully');
      return system;
    } catch (error) {
      console.error('Failed to create multi-agent system:', error);
      throw error;
    }
  }

  /**
   * Create a standalone RAG system
   */
  public async createRAGSystem(options: {
    customConfig?: Partial<RAGConfig>;
  } = {}): Promise<RAGSystem> {
    try {
      const config = this.configService.getRAGConfig();
      
      const ragConfig: RAGConfig = {
        ...config,
        ...options.customConfig
      };

      const ragSystem = new RAGSystem(ragConfig);
      await ragSystem.initialize();

      console.log('RAG system created successfully');
      return ragSystem;
    } catch (error) {
      console.error('Failed to create RAG system:', error);
      throw error;
    }
  }

  /**
   * Create a service with automatic model selection based on query type
   */
  public async createAdaptiveService(queryType: 'regulatory' | 'risk-assessment' | 'compliance' | 'general' = 'general'): Promise<RealLLMService> {
    try {
      const optimalModel = this.configService.selectOptimalModel(queryType);
      
      return await this.createProductionService({
        customConfig: {
          model: optimalModel
        }
      });
    } catch (error) {
      console.error('Failed to create adaptive service:', error);
      throw error;
    }
  }

  /**
   * Get available models and their capabilities
   */
  public getAvailableModels() {
    return this.configService.getAvailableModels();
  }

  /**
   * Estimate cost for a given model and token usage
   */
  public estimateCost(modelName: string, inputTokens: number, outputTokens: number): number {
    return this.configService.estimateCost(modelName, inputTokens, outputTokens);
  }

  /**
   * Update configuration
   */
  public updateConfiguration(updates: any): void {
    this.configService.updateConfiguration(updates);
  }

  /**
   * Get current configuration
   */
  public getConfiguration() {
    return this.configService.getConfiguration();
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfiguration(): void {
    this.configService.resetToDefaults();
  }

  /**
   * Health check for all services
   */
  public async healthCheck(): Promise<{
    configValid: boolean;
    openrouterAccessible: boolean;
    pineconeAccessible: boolean;
    overall: boolean;
  }> {
    const validation = this.configService.validateConfiguration();
    
    // Test OpenRouter access
    let openrouterAccessible = false;
    try {
      const agent = await this.createProductionAgent();
      openrouterAccessible = await agent.healthCheck();
      await agent.cleanup();
    } catch (error) {
      console.warn('OpenRouter health check failed:', error);
    }

    // Test Pinecone access (if configured)
    let pineconeAccessible = false;
    const config = this.configService.getConfiguration();
    if (config.pineconeApiKey) {
      try {
        const ragSystem = await this.createRAGSystem();
        pineconeAccessible = await ragSystem.healthCheck();
        await ragSystem.cleanup();
      } catch (error) {
        console.warn('Pinecone health check failed:', error);
      }
    } else {
      pineconeAccessible = true; // Not configured, so consider it "healthy"
    }

    return {
      configValid: validation.isValid,
      openrouterAccessible,
      pineconeAccessible,
      overall: validation.isValid && openrouterAccessible && pineconeAccessible
    };
  }
}
