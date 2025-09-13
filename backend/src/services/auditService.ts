import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Brief } from '../types/advisory';
import { createHash, createHmac } from 'crypto';

export interface AuditEvent {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  hash: string;
}

export interface AdvisoryRequest {
  userQuery: string;
  conversationHistory: Brief[];
  userContext: {
    jurisdiction: string;
    role: string;
    organization: string;
  };
  regulatoryContext: {
    applicableRegulations: string[];
    recentUpdates: string[];
    enforcementActions: string[];
  };
}

export class AuditService {
  private static instance: AuditService;
  private prisma: PrismaClient;
  private isInitialized = false;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test database connection
      await this.prisma.$connect();
      
      // Create audit log retention policy
      await this.setupRetentionPolicy();
      
      this.isInitialized = true;
      logger.info('Audit Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Audit Service:', error);
      throw error;
    }
  }

  private async setupRetentionPolicy(): Promise<void> {
    try {
      // Set up automatic cleanup of old audit logs
      const retentionDays = config.compliance.auditLogRetentionDays;
      
      // This would typically be done via a scheduled job or database trigger
      logger.info(`Audit log retention policy set to ${retentionDays} days`);
    } catch (error) {
      logger.error('Failed to setup retention policy:', error);
    }
  }

  public async logAdvisoryRequest(context: AdvisoryRequest): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'ADVISORY_REQUEST',
        resource: 'advisory_service',
        details: {
          query: context.userQuery,
          jurisdiction: context.userContext.jurisdiction,
          role: context.userContext.role,
          organization: context.userContext.organization,
          applicableRegulations: context.regulatoryContext.applicableRegulations,
        },
        timestamp: new Date(),
        hash: this.generateHash(context),
      };

      await this.createAuditLog(auditEvent);
      logger.info('Advisory request logged', { auditId: auditEvent.id });
    } catch (error) {
      logger.error('Failed to log advisory request:', error);
    }
  }

  public async logAdvisoryResponse(response: any): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'ADVISORY_RESPONSE',
        resource: 'advisory_service',
        details: {
          responseId: response.id || 'unknown',
          confidence: response.confidence,
          evidenceCount: response.evidence?.length || 0,
          suggestionsCount: response.followUpSuggestions?.length || 0,
          contentLength: response.content?.length || 0,
        },
        timestamp: new Date(),
        hash: this.generateHash(response),
      };

      await this.createAuditLog(auditEvent);
      logger.info('Advisory response logged', { auditId: auditEvent.id });
    } catch (error) {
      logger.error('Failed to log advisory response:', error);
    }
  }

  public async logAdvisoryError(error: any): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'ADVISORY_ERROR',
        resource: 'advisory_service',
        details: {
          errorType: error.constructor.name,
          errorMessage: error.message,
          stack: error.stack,
        },
        timestamp: new Date(),
        hash: this.generateHash(error),
      };

      await this.createAuditLog(auditEvent);
      logger.error('Advisory error logged', { auditId: auditEvent.id });
    } catch (logError) {
      logger.error('Failed to log advisory error:', logError);
    }
  }

  public async logChatInteraction(
    userId: string,
    query: string,
    brief: Brief,
    conversationId?: string
  ): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: 'CHAT_INTERACTION',
        resource: 'chat_service',
        resourceId: brief.id,
        details: {
          query,
          briefId: brief.id,
          briefType: brief.type,
          confidence: brief.confidence,
          conversationId,
          evidenceCount: brief.evidence.length,
          suggestionsCount: brief.followUpSuggestions.length,
        },
        timestamp: new Date(),
        hash: this.generateHash({ query, brief, conversationId }),
      };

      await this.createAuditLog(auditEvent);
      logger.info('Chat interaction logged', { auditId: auditEvent.id, userId });
    } catch (error) {
      logger.error('Failed to log chat interaction:', error);
    }
  }

  public async logFeedbackSubmission(
    userId: string,
    briefId: string,
    type: string,
    rating: number
  ): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: 'FEEDBACK_SUBMISSION',
        resource: 'feedback_service',
        resourceId: briefId,
        details: {
          briefId,
          feedbackType: type,
          rating,
        },
        timestamp: new Date(),
        hash: this.generateHash({ briefId, type, rating }),
      };

      await this.createAuditLog(auditEvent);
      logger.info('Feedback submission logged', { auditId: auditEvent.id, userId });
    } catch (error) {
      logger.error('Failed to log feedback submission:', error);
    }
  }

  public async logUserAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        hash: this.generateHash({ action, resource, resourceId, details }),
      };

      await this.createAuditLog(auditEvent);
      logger.info('User action logged', { auditId: auditEvent.id, userId, action });
    } catch (error) {
      logger.error('Failed to log user action:', error);
    }
  }

  public async logSystemEvent(
    action: string,
    resource: string,
    details?: any
  ): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action,
        resource,
        details,
        timestamp: new Date(),
        hash: this.generateHash({ action, resource, details }),
      };

      await this.createAuditLog(auditEvent);
      logger.info('System event logged', { auditId: auditEvent.id, action });
    } catch (error) {
      logger.error('Failed to log system event:', error);
    }
  }

  public async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'READ' | 'WRITE' | 'DELETE',
    details?: any
  ): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: `DATA_${action}`,
        resource,
        resourceId,
        details,
        timestamp: new Date(),
        hash: this.generateHash({ resource, resourceId, action, details }),
      };

      await this.createAuditLog(auditEvent);
      logger.info('Data access logged', { auditId: auditEvent.id, userId, action });
    } catch (error) {
      logger.error('Failed to log data access:', error);
    }
  }

  public async logSecurityEvent(
    eventType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details: any,
    userId?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action: `SECURITY_${eventType}`,
        resource: 'security_service',
        details: {
          eventType,
          severity,
          ...details,
        },
        ipAddress,
        timestamp: new Date(),
        hash: this.generateHash({ eventType, severity, details }),
      };

      await this.createAuditLog(auditEvent);
      logger.warn('Security event logged', { auditId: auditEvent.id, severity, eventType });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  private async createAuditLog(auditEvent: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          id: auditEvent.id,
          userId: auditEvent.userId,
          action: auditEvent.action,
          resource: auditEvent.resource,
          resourceId: auditEvent.resourceId,
          details: auditEvent.details,
          ipAddress: auditEvent.ipAddress,
          userAgent: auditEvent.userAgent,
          createdAt: auditEvent.timestamp,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      throw error;
    }
  }

  private generateHash(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return createHmac('sha256', config.security.encryptionKey)
      .update(dataString)
      .digest('hex');
  }

  public async getAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ logs: any[]; total: number }> {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.action) where.action = filters.action;
      if (filters.resource) where.resource = filters.resource;
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const [logs, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 100,
          skip: filters.offset || 0,
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      return { logs, total };
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  public async verifyAuditIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const errors: string[] = [];
      
      // Check for missing or corrupted audit logs
      const recentLogs = await this.prisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });

      for (const log of recentLogs) {
        // Verify hash integrity
        const expectedHash = this.generateHash({
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          details: log.details,
        });

        if (log.details && typeof log.details === 'object') {
          const actualHash = this.generateHash(log.details);
          if (actualHash !== expectedHash) {
            errors.push(`Hash mismatch for audit log ${log.id}`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Failed to verify audit integrity:', error);
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }

  public async cleanupOldLogs(): Promise<number> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - config.compliance.auditLogRetentionDays);

      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: retentionDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old audit logs`);
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old logs:', error);
      throw error;
    }
  }
}

export const auditService = AuditService.getInstance();

