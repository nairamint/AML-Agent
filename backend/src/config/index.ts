import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenvConfig();

// Environment validation schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Database configuration
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  QDRANT_URL: z.string().url().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional(),
  
  // Redis configuration
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // Kafka configuration
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().default('aml-kyc-backend'),
  
  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // CORS configuration
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  
  // LLM configuration
  OPENAI_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  LLM_MODEL: z.string().default('llama2:7b'),
  
  // External services
  MOOV_WATCHMAN_API_KEY: z.string().optional(),
  MOOV_WATCHMAN_BASE_URL: z.string().url().default('https://api.moov.io'),
  
  // Security
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().default('60000'),
  
  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_METRICS: z.string().transform(Boolean).default('true'),
  
  // Compliance
  AUDIT_LOG_RETENTION_DAYS: z.string().transform(Number).default('2555'), // 7 years
  DATA_RETENTION_DAYS: z.string().transform(Number).default('2555'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

// Export configuration
export const config = {
  server: {
    port: env.PORT,
    host: env.HOST,
    env: env.NODE_ENV,
  },
  
  database: {
    url: env.DATABASE_URL,
  },
  
  qdrant: {
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
  },
  
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
  },
  
  kafka: {
    brokers: env.KAFKA_BROKERS.split(','),
    clientId: env.KAFKA_CLIENT_ID,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  
  cors: {
    origins: env.CORS_ORIGINS.split(','),
  },
  
  llm: {
    openaiApiKey: env.OPENAI_API_KEY,
    ollamaBaseUrl: env.OLLAMA_BASE_URL,
    model: env.LLM_MODEL,
  },
  
  external: {
    moovWatchman: {
      apiKey: env.MOOV_WATCHMAN_API_KEY,
      baseUrl: env.MOOV_WATCHMAN_BASE_URL,
    },
  },
  
  security: {
    encryptionKey: env.ENCRYPTION_KEY,
    rateLimit: {
      max: env.RATE_LIMIT_MAX,
      window: parseInt(env.RATE_LIMIT_WINDOW),
    },
  },
  
  monitoring: {
    logLevel: env.LOG_LEVEL,
    enableMetrics: env.ENABLE_METRICS,
  },
  
  compliance: {
    auditLogRetentionDays: env.AUDIT_LOG_RETENTION_DAYS,
    dataRetentionDays: env.DATA_RETENTION_DAYS,
  },
} as const;

// Type-safe configuration
export type Config = typeof config;

