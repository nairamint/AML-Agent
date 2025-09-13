/**
 * LLM Configuration Service
 * 
 * Manages configuration for production LLM services including OpenRouter API keys,
 * model selection, and vector database settings
 */

export interface LLMConfiguration {
  // OpenRouter Configuration
  openrouterApiKey: string;
  defaultModel: string;
  fallbackModel: string;
  
  // Model Settings
  temperature: number;
  maxTokens: number;
  chunkSize: number;
  chunkOverlap: number;
  
  // Vector Database Configuration (Optional - using mock fallback)
  
  // RAG Settings
  topK: number;
  similarityThreshold: number;
  
  // Agent Configuration
  confidenceThreshold: number;
  maxQueryLength: number;
  responseTimeMs: number;
  
  // Supported Models
  availableModels: {
    [key: string]: {
      name: string;
      provider: string;
      maxTokens: number;
      costPerToken: number;
      capabilities: string[];
    };
  };
}

export class LLMConfigService {
  private static instance: LLMConfigService;
  private config: LLMConfiguration;

  private constructor() {
    this.config = this.loadDefaultConfiguration();
  }

  public static getInstance(): LLMConfigService {
    if (!LLMConfigService.instance) {
      LLMConfigService.instance = new LLMConfigService();
    }
    return LLMConfigService.instance;
  }

  private loadDefaultConfiguration(): LLMConfiguration {
    return {
      // OpenRouter Configuration
      openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
      defaultModel: 'openai/gpt-4-turbo-preview',
      fallbackModel: 'anthropic/claude-3-sonnet',
      
      // Model Settings
      temperature: 0.1,
      maxTokens: 2000,
      chunkSize: 1000,
      chunkOverlap: 200,
      
      // Vector Database Configuration (Optional - using mock fallback)
      
      // RAG Settings
      topK: 5,
      similarityThreshold: 0.7,
      
      // Agent Configuration
      confidenceThreshold: 0.75,
      maxQueryLength: 4000,
      responseTimeMs: 5000,
      
      // Supported Models
      availableModels: {
        'openai/gpt-4-turbo-preview': {
          name: 'GPT-4 Turbo Preview',
          provider: 'OpenAI',
          maxTokens: 128000,
          costPerToken: 0.00001,
          capabilities: ['reasoning', 'analysis', 'regulatory', 'compliance']
        },
        'openai/gpt-4': {
          name: 'GPT-4',
          provider: 'OpenAI',
          maxTokens: 8192,
          costPerToken: 0.00003,
          capabilities: ['reasoning', 'analysis', 'regulatory']
        },
        'anthropic/claude-3-sonnet': {
          name: 'Claude 3 Sonnet',
          provider: 'Anthropic',
          maxTokens: 200000,
          costPerToken: 0.000003,
          capabilities: ['reasoning', 'analysis', 'regulatory', 'compliance', 'risk-assessment']
        },
        'anthropic/claude-3-haiku': {
          name: 'Claude 3 Haiku',
          provider: 'Anthropic',
          maxTokens: 200000,
          costPerToken: 0.00000025,
          capabilities: ['reasoning', 'analysis', 'fast-response']
        },
        'google/gemini-pro': {
          name: 'Gemini Pro',
          provider: 'Google',
          maxTokens: 30720,
          costPerToken: 0.0000005,
          capabilities: ['reasoning', 'analysis', 'multimodal']
        },
        'meta-llama/llama-2-70b-chat': {
          name: 'Llama 2 70B Chat',
          provider: 'Meta',
          maxTokens: 4096,
          costPerToken: 0.0000007,
          capabilities: ['reasoning', 'analysis', 'open-source']
        }
      }
    };
  }

  public getConfiguration(): LLMConfiguration {
    return { ...this.config };
  }

  public updateConfiguration(updates: Partial<LLMConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfiguration();
  }

  public getOpenRouterConfig() {
    return {
      openrouterApiKey: this.config.openrouterApiKey,
      model: this.config.defaultModel,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap
    };
  }

  public getRAGConfig() {
    return {
      openrouterApiKey: this.config.openrouterApiKey,
      embeddingModel: 'text-embedding-3-large',
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
      topK: this.config.topK,
      similarityThreshold: this.config.similarityThreshold
    };
  }

  public getAgentCapabilities() {
    return {
      supportedJurisdictions: ['Luxembourg', 'EU', 'US', 'UK', 'Global'],
      supportedFrameworks: ['AMLD6', 'FATF', 'CSSF', 'FCA', 'FinCEN'],
      maxQueryLength: this.config.maxQueryLength,
      responseTimeMs: this.config.responseTimeMs,
      confidenceThreshold: this.config.confidenceThreshold
    };
  }

  public getAvailableModels() {
    return this.config.availableModels;
  }

  public selectOptimalModel(queryType: 'regulatory' | 'risk-assessment' | 'compliance' | 'general'): string {
    const models = this.config.availableModels;
    
    switch (queryType) {
      case 'regulatory':
        // Prefer models with strong regulatory capabilities
        if (models['anthropic/claude-3-sonnet']) return 'anthropic/claude-3-sonnet';
        if (models['openai/gpt-4-turbo-preview']) return 'openai/gpt-4-turbo-preview';
        break;
        
      case 'risk-assessment':
        // Prefer models with risk assessment capabilities
        if (models['anthropic/claude-3-sonnet']) return 'anthropic/claude-3-sonnet';
        if (models['openai/gpt-4']) return 'openai/gpt-4';
        break;
        
      case 'compliance':
        // Prefer models with compliance capabilities
        if (models['openai/gpt-4-turbo-preview']) return 'openai/gpt-4-turbo-preview';
        if (models['anthropic/claude-3-sonnet']) return 'anthropic/claude-3-sonnet';
        break;
        
      case 'general':
      default:
        // Use default model
        return this.config.defaultModel;
    }
    
    return this.config.defaultModel;
  }

  public validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.openrouterApiKey) {
      errors.push('OpenRouter API key is required');
    }
    
    if (!this.config.defaultModel) {
      errors.push('Default model is required');
    }
    
    if (this.config.temperature < 0 || this.config.temperature > 2) {
      errors.push('Temperature must be between 0 and 2');
    }
    
    if (this.config.maxTokens < 100 || this.config.maxTokens > 200000) {
      errors.push('Max tokens must be between 100 and 200000');
    }
    
    if (this.config.chunkSize < 100 || this.config.chunkSize > 2000) {
      errors.push('Chunk size must be between 100 and 2000');
    }
    
    if (this.config.topK < 1 || this.config.topK > 20) {
      errors.push('Top K must be between 1 and 20');
    }
    
    if (this.config.similarityThreshold < 0 || this.config.similarityThreshold > 1) {
      errors.push('Similarity threshold must be between 0 and 1');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private saveConfiguration(): void {
    // In a real application, this would save to a persistent store
    // For now, we'll just log the configuration update
    console.log('LLM Configuration updated:', this.config);
  }

  public resetToDefaults(): void {
    this.config = this.loadDefaultConfiguration();
    this.saveConfiguration();
  }

  public getModelInfo(modelName: string) {
    return this.config.availableModels[modelName] || null;
  }

  public estimateCost(modelName: string, inputTokens: number, outputTokens: number): number {
    const model = this.config.availableModels[modelName];
    if (!model) return 0;
    
    return (inputTokens + outputTokens) * model.costPerToken;
  }
}
