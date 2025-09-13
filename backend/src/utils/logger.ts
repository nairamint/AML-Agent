import pino from 'pino';
import { config } from '../config';

// Create logger instance
export const logger = pino({
  level: config.monitoring.logLevel,
  transport: config.server.env === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'aml-kyc-advisory-backend',
    version: '1.0.0',
  },
});

// Structured logging helpers
export const logStructured = {
  info: (message: string, data?: any) => {
    logger.info(data, message);
  },
  
  warn: (message: string, data?: any) => {
    logger.warn(data, message);
  },
  
  error: (message: string, error?: Error | any, data?: any) => {
    if (error instanceof Error) {
      logger.error({
        ...data,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }, message);
    } else {
      logger.error({ ...data, error }, message);
    }
  },
  
  debug: (message: string, data?: any) => {
    logger.debug(data, message);
  },
  
  // Audit logging
  audit: (action: string, userId?: string, details?: any) => {
    logger.info({
      type: 'audit',
      action,
      userId,
      ...details,
    }, `Audit: ${action}`);
  },
  
  // Security logging
  security: (event: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', details?: any) => {
    logger.warn({
      type: 'security',
      event,
      severity,
      ...details,
    }, `Security: ${event}`);
  },
  
  // Performance logging
  performance: (operation: string, duration: number, details?: any) => {
    logger.info({
      type: 'performance',
      operation,
      duration,
      ...details,
    }, `Performance: ${operation} took ${duration}ms`);
  },
  
  // Business logic logging
  business: (event: string, details?: any) => {
    logger.info({
      type: 'business',
      event,
      ...details,
    }, `Business: ${event}`);
  },
};

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logStructured.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  });
  
  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req?: any) => {
  logStructured.error('Unhandled Error', error, {
    method: req?.method,
    url: req?.url,
    userAgent: req?.get('User-Agent'),
    ip: req?.ip,
  });
};

export default logger;

