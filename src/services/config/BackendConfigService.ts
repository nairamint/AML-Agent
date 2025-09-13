/**
 * Backend Configuration Service
 * 
 * Centralized configuration management for all backend services
 * Handles environment variables, feature flags, and service configurations
 */

export interface LLMConfig {
  provider: 'openai' | 'ollama' | 'anthropic';
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  baseUrl?: string;
}

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

export interface AuthConfig {
  auth0: {
    domain: string;
    clientId: string;
    clientSecret: string;
    audience: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  session: {
    timeout: number;
    maxSessions: number;
  };
}

export interface APIConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface FeatureFlags {
  enableRealLLM: boolean;
  enableVectorSearch: boolean;
  enableAuditLogging: boolean;
  enableRealTimeStreaming: boolean;
  enableAdvancedAnalytics: boolean;
  enableComplianceReporting: boolean;
}

export interface BackendConfig {
  llm: LLMConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  api: APIConfig;
  features: FeatureFlags;
  environment: 'development' | 'staging' | 'production';
}

export class BackendConfigService {
  private static instance: BackendConfigService;
  private config: BackendConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): BackendConfigService {
    if (!BackendConfigService.instance) {
      BackendConfigService.instance = new BackendConfigService();
    }
    return BackendConfigService.instance;
  }

  private loadConfiguration(): BackendConfig {
    const environment = this.getEnvironment();
    
    return {
      llm: this.getLLMConfig(environment),
      database: this.getDatabaseConfig(environment),
      auth: this.getAuthConfig(environment),
      api: this.getAPIConfig(environment),
      features: this.getFeatureFlags(environment),
      environment
    };
  }

  private getEnvironment(): 'development' | 'staging' | 'production' {
    const env = import.meta.env.MODE || 'development';
    return env as 'development' | 'staging' | 'production';
  }

  private getLLMConfig(environment: string): LLMConfig {
    const baseConfig: LLMConfig = {
      provider: (import.meta.env.VITE_LLM_PROVIDER as 'openai' | 'ollama' | 'anthropic') || 'ollama',
      model: import.meta.env.VITE_LLM_MODEL || 'llama2:7b',
      temperature: parseFloat(import.meta.env.VITE_LLM_TEMPERATURE || '0.7'),
      maxTokens: parseInt(import.meta.env.VITE_LLM_MAX_TOKENS || '2000'),
    };

    if (baseConfig.provider === 'openai') {
      baseConfig.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    } else if (baseConfig.provider === 'ollama') {
      baseConfig.baseUrl = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
    } else if (baseConfig.provider === 'anthropic') {
      baseConfig.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    }

    return baseConfig;
  }

  private getDatabaseConfig(environment: string): DatabaseConfig {
    return {
      postgres: {
        host: import.meta.env.VITE_POSTGRES_HOST || 'localhost',
        port: parseInt(import.meta.env.VITE_POSTGRES_PORT || '5432'),
        database: import.meta.env.VITE_POSTGRES_DB || 'aml_kyc_agent',
        username: import.meta.env.VITE_POSTGRES_USER || 'postgres',
        password: import.meta.env.VITE_POSTGRES_PASSWORD || 'password',
        ssl: environment === 'production',
        max: parseInt(import.meta.env.VITE_POSTGRES_MAX_CONNECTIONS || '20')
      },
      qdrant: {
        url: import.meta.env.VITE_QDRANT_URL || 'http://localhost:6333',
        apiKey: import.meta.env.VITE_QDRANT_API_KEY
      },
      redis: {
        host: import.meta.env.VITE_REDIS_HOST || 'localhost',
        port: parseInt(import.meta.env.VITE_REDIS_PORT || '6379'),
        password: import.meta.env.VITE_REDIS_PASSWORD,
        db: parseInt(import.meta.env.VITE_REDIS_DB || '0')
      }
    };
  }

  private getAuthConfig(environment: string): AuthConfig {
    return {
      auth0: {
        domain: import.meta.env.VITE_AUTH0_DOMAIN || 'dev-aml-kyc.us.auth0.com',
        clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'your-client-id',
        clientSecret: import.meta.env.VITE_AUTH0_CLIENT_SECRET || 'your-client-secret',
        audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.aml-kyc-agent.com'
      },
      jwt: {
        secret: import.meta.env.VITE_JWT_SECRET || 'your-jwt-secret-key',
        expiresIn: import.meta.env.VITE_JWT_EXPIRES_IN || '1h',
        refreshExpiresIn: import.meta.env.VITE_JWT_REFRESH_EXPIRES_IN || '7d'
      },
      session: {
        timeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'), // 1 hour
        maxSessions: parseInt(import.meta.env.VITE_MAX_SESSIONS || '5')
      }
    };
  }

  private getAPIConfig(environment: string): APIConfig {
    return {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
      rateLimit: {
        windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
        maxRequests: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX || '100')
      }
    };
  }

  private getFeatureFlags(environment: string): FeatureFlags {
    return {
      enableRealLLM: import.meta.env.VITE_ENABLE_REAL_LLM === 'true' || environment === 'production',
      enableVectorSearch: import.meta.env.VITE_ENABLE_VECTOR_SEARCH === 'true' || environment === 'production',
      enableAuditLogging: import.meta.env.VITE_ENABLE_AUDIT_LOGGING === 'true' || environment === 'production',
      enableRealTimeStreaming: import.meta.env.VITE_ENABLE_REAL_TIME_STREAMING === 'true' || environment === 'production',
      enableAdvancedAnalytics: import.meta.env.VITE_ENABLE_ADVANCED_ANALYTICS === 'true' || environment === 'production',
      enableComplianceReporting: import.meta.env.VITE_ENABLE_COMPLIANCE_REPORTING === 'true' || environment === 'production'
    };
  }

  public getConfig(): BackendConfig {
    return { ...this.config };
  }

  public getLLMConfig(): LLMConfig {
    return { ...this.config.llm };
  }

  public getDatabaseConfig(): DatabaseConfig {
    return { ...this.config.database };
  }

  public getAuthConfig(): AuthConfig {
    return { ...this.config.auth };
  }

  public getAPIConfig(): APIConfig {
    return { ...this.config.api };
  }

  public getFeatureFlags(): FeatureFlags {
    return { ...this.config.features };
  }

  public getEnvironment(): string {
    return this.config.environment;
  }

  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }

  public updateConfig(updates: Partial<BackendConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate LLM config
    if (!this.config.llm.provider) {
      errors.push('LLM provider is required');
    }
    if (!this.config.llm.model) {
      errors.push('LLM model is required');
    }
    if (this.config.llm.provider === 'openai' && !this.config.llm.apiKey) {
      errors.push('OpenAI API key is required');
    }

    // Validate database config
    if (!this.config.database.postgres.host) {
      errors.push('PostgreSQL host is required');
    }
    if (!this.config.database.postgres.database) {
      errors.push('PostgreSQL database name is required');
    }
    if (!this.config.database.postgres.username) {
      errors.push('PostgreSQL username is required');
    }

    // Validate auth config
    if (!this.config.auth.auth0.domain) {
      errors.push('Auth0 domain is required');
    }
    if (!this.config.auth.auth0.clientId) {
      errors.push('Auth0 client ID is required');
    }
    if (!this.config.auth.jwt.secret) {
      errors.push('JWT secret is required');
    }

    // Validate API config
    if (!this.config.api.baseUrl) {
      errors.push('API base URL is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public getEnvironmentVariables(): Record<string, string> {
    return {
      // LLM Configuration
      VITE_LLM_PROVIDER: this.config.llm.provider,
      VITE_LLM_MODEL: this.config.llm.model,
      VITE_LLM_TEMPERATURE: this.config.llm.temperature.toString(),
      VITE_LLM_MAX_TOKENS: this.config.llm.maxTokens.toString(),
      VITE_OPENAI_API_KEY: this.config.llm.apiKey || '',
      VITE_OLLAMA_BASE_URL: this.config.llm.baseUrl || '',
      VITE_ANTHROPIC_API_KEY: this.config.llm.apiKey || '',

      // Database Configuration
      VITE_POSTGRES_HOST: this.config.database.postgres.host,
      VITE_POSTGRES_PORT: this.config.database.postgres.port.toString(),
      VITE_POSTGRES_DB: this.config.database.postgres.database,
      VITE_POSTGRES_USER: this.config.database.postgres.username,
      VITE_POSTGRES_PASSWORD: this.config.database.postgres.password,
      VITE_QDRANT_URL: this.config.database.qdrant.url,
      VITE_QDRANT_API_KEY: this.config.database.qdrant.apiKey || '',
      VITE_REDIS_HOST: this.config.database.redis.host,
      VITE_REDIS_PORT: this.config.database.redis.port.toString(),
      VITE_REDIS_PASSWORD: this.config.database.redis.password || '',
      VITE_REDIS_DB: this.config.database.redis.db.toString(),

      // Authentication Configuration
      VITE_AUTH0_DOMAIN: this.config.auth.auth0.domain,
      VITE_AUTH0_CLIENT_ID: this.config.auth.auth0.clientId,
      VITE_AUTH0_CLIENT_SECRET: this.config.auth.auth0.clientSecret,
      VITE_AUTH0_AUDIENCE: this.config.auth.auth0.audience,
      VITE_JWT_SECRET: this.config.auth.jwt.secret,
      VITE_JWT_EXPIRES_IN: this.config.auth.jwt.expiresIn,
      VITE_JWT_REFRESH_EXPIRES_IN: this.config.auth.jwt.refreshExpiresIn,
      VITE_SESSION_TIMEOUT: this.config.auth.session.timeout.toString(),
      VITE_MAX_SESSIONS: this.config.auth.session.maxSessions.toString(),

      // API Configuration
      VITE_API_BASE_URL: this.config.api.baseUrl,
      VITE_API_TIMEOUT: this.config.api.timeout.toString(),
      VITE_API_RETRY_ATTEMPTS: this.config.api.retryAttempts.toString(),
      VITE_RATE_LIMIT_WINDOW: this.config.api.rateLimit.windowMs.toString(),
      VITE_RATE_LIMIT_MAX: this.config.api.rateLimit.maxRequests.toString(),

      // Feature Flags
      VITE_ENABLE_REAL_LLM: this.config.features.enableRealLLM.toString(),
      VITE_ENABLE_VECTOR_SEARCH: this.config.features.enableVectorSearch.toString(),
      VITE_ENABLE_AUDIT_LOGGING: this.config.features.enableAuditLogging.toString(),
      VITE_ENABLE_REAL_TIME_STREAMING: this.config.features.enableRealTimeStreaming.toString(),
      VITE_ENABLE_ADVANCED_ANALYTICS: this.config.features.enableAdvancedAnalytics.toString(),
      VITE_ENABLE_COMPLIANCE_REPORTING: this.config.features.enableComplianceReporting.toString(),

      // Environment
      VITE_ENVIRONMENT: this.config.environment
    };
  }
}
