/**
 * IAM Routes
 * AML-KYC Agent Enterprise Identity & Access Management
 * 
 * This module provides HTTP endpoints for IAM functionality
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IAMIntegrationService, AuthenticatedRequest, IAMMiddlewareOptions } from '../services/iam/IAMIntegrationService';
import { ProductionEnterpriseIAMService, LoginCredentials, MFAMethod } from '../services/iam/ProductionEnterpriseIAMService';
import { IAMConfigurationService } from '../services/iam/IAMConfiguration';
import { Logger } from 'winston';

// Request/Response Types
interface LoginRequest {
  username: string;
  password: string;
  mfaToken?: string;
  deviceId?: string;
}

interface MFASetupRequest {
  userId: string;
  method: {
    type: 'TOTP' | 'SMS' | 'EMAIL' | 'HARDWARE_TOKEN' | 'BIOMETRIC';
    enabled: boolean;
    priority: number;
  };
}

interface PermissionCheckRequest {
  userId: string;
  resource: string;
  action: string;
}

interface AuditEventsRequest {
  userId?: string;
  eventType?: string;
  limit?: number;
}

export async function iamRoutes(fastify: FastifyInstance) {
  const logger = fastify.log as Logger;
  
  // Initialize IAM services
  const configService = new IAMConfigurationService(logger);
  const iamService = new ProductionEnterpriseIAMService(configService.getConfiguration(), logger);
  const iamIntegration = new IAMIntegrationService({
    iamService,
    configService,
    logger
  });

  // Initialize IAM integration
  await iamIntegration.initialize();

  // Health check endpoint
  fastify.get('/health', {
    schema: {
      description: 'IAM service health check',
      tags: ['IAM'],
      response: {
        200: {
          type: 'object',
          properties: {
            healthy: { type: 'boolean' },
            details: { type: 'object' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const health = await iamIntegration.handleHealthCheck();
      reply.code(health.healthy ? 200 : 503).send(health);
    } catch (error) {
      logger.error('Health check error', { error });
      reply.code(500).send({ error: 'Health check failed' });
    }
  });

  // Login endpoint
  fastify.post('/login', {
    schema: {
      description: 'User authentication',
      tags: ['IAM'],
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          mfaToken: { type: 'string' },
          deviceId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                roles: { type: 'array', items: { type: 'string' } },
                groups: { type: 'array', items: { type: 'string' } },
                permissions: { type: 'array', items: { type: 'string' } },
                mfaEnabled: { type: 'boolean' },
                accountStatus: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING'] }
              }
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                idToken: { type: 'string' },
                expiresIn: { type: 'number' },
                tokenType: { type: 'string' }
              }
            },
            sessionId: { type: 'string' },
            mfaRequired: { type: 'boolean' }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
    try {
      const credentials: LoginCredentials = {
        username: request.body.username,
        password: request.body.password,
        mfaToken: request.body.mfaToken,
        deviceId: request.body.deviceId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent']
      };

      const result = await iamIntegration.handleLogin(credentials);
      
      if (result.success) {
        reply.code(200).send(result);
      } else {
        reply.code(401).send(result);
      }
    } catch (error) {
      logger.error('Login endpoint error', { error });
      reply.code(500).send({ error: 'Login failed' });
    }
  });

  // Logout endpoint
  fastify.post('/logout', {
    preHandler: [iamIntegration.createAuthMiddleware({ requireAuth: true })],
    schema: {
      description: 'User logout',
      tags: ['IAM'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const sessionId = request.sessionId;
      if (!sessionId) {
        reply.code(400).send({ error: 'No active session found' });
        return;
      }

      const result = await iamIntegration.handleLogout(sessionId);
      reply.code(200).send(result);
    } catch (error) {
      logger.error('Logout endpoint error', { error });
      reply.code(500).send({ error: 'Logout failed' });
    }
  });

  // MFA setup endpoint
  fastify.post('/mfa/setup', {
    preHandler: [iamIntegration.createAuthMiddleware({ requireAuth: true })],
    schema: {
      description: 'Setup Multi-Factor Authentication',
      tags: ['IAM'],
      body: {
        type: 'object',
        required: ['method'],
        properties: {
          method: {
            type: 'object',
            required: ['type', 'enabled', 'priority'],
            properties: {
              type: { type: 'string', enum: ['TOTP', 'SMS', 'EMAIL', 'HARDWARE_TOKEN', 'BIOMETRIC'] },
              enabled: { type: 'boolean' },
              priority: { type: 'number' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            setupUrl: { type: 'string' },
            backupCodes: { type: 'array', items: { type: 'string' } },
            qrCode: { type: 'string' },
            secret: { type: 'string' },
            phoneNumber: { type: 'string' },
            email: { type: 'string' }
          }
        }
      }
    }
  }, async (request: AuthenticatedRequest<{ Body: MFASetupRequest }>, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        reply.code(400).send({ error: 'User ID not found' });
        return;
      }

      const method: MFAMethod = request.body.method;
      const result = await iamIntegration.handleMFASetup(userId, method);
      reply.code(200).send(result);
    } catch (error) {
      logger.error('MFA setup endpoint error', { error });
      reply.code(500).send({ error: 'MFA setup failed' });
    }
  });

  // Permission check endpoint
  fastify.post('/permissions/check', {
    preHandler: [iamIntegration.createAuthMiddleware({ requireAuth: true })],
    schema: {
      description: 'Check user permissions for resource and action',
      tags: ['IAM'],
      body: {
        type: 'object',
        required: ['resource', 'action'],
        properties: {
          resource: { type: 'string', minLength: 1 },
          action: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            allowed: { type: 'boolean' },
            reason: { type: 'string' }
          }
        }
      }
    }
  }, async (request: AuthenticatedRequest<{ Body: PermissionCheckRequest }>, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        reply.code(400).send({ error: 'User ID not found' });
        return;
      }

      const { resource, action } = request.body;
      const result = await iamIntegration.handlePermissionCheck(userId, resource, action);
      reply.code(200).send(result);
    } catch (error) {
      logger.error('Permission check endpoint error', { error });
      reply.code(500).send({ error: 'Permission check failed' });
    }
  });

  // Get user sessions endpoint
  fastify.get('/sessions', {
    preHandler: [iamIntegration.createAuthMiddleware({ requireAuth: true })],
    schema: {
      description: 'Get user active sessions',
      tags: ['IAM'],
      response: {
        200: {
          type: 'object',
          properties: {
            sessions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' },
                  userId: { type: 'string' },
                  ipAddress: { type: 'string' },
                  userAgent: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  lastActivity: { type: 'string', format: 'date-time' },
                  expiresAt: { type: 'string', format: 'date-time' },
                  mfaVerified: { type: 'boolean' },
                  riskScore: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      const result = await iamIntegration.handleGetUserSessions(userId);
      reply.code(200).send(result);
    } catch (error) {
      logger.error('Get user sessions endpoint error', { error });
      reply.code(500).send({ error: 'Failed to get user sessions' });
    }
  });

  // Get audit events endpoint
  fastify.get('/audit/events', {
    preHandler: [iamIntegration.createAuthMiddleware({ 
      requireAuth: true,
      requiredRoles: ['admin', 'auditor']
    })],
    schema: {
      description: 'Get audit events',
      tags: ['IAM'],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          eventType: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 1000, default: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  eventId: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  userId: { type: 'string' },
                  sessionId: { type: 'string' },
                  eventType: { type: 'string' },
                  resource: { type: 'string' },
                  action: { type: 'string' },
                  result: { type: 'string' },
                  ipAddress: { type: 'string' },
                  userAgent: { type: 'string' },
                  details: { type: 'object' },
                  riskScore: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: AuthenticatedRequest<{ Querystring: AuditEventsRequest }>, reply: FastifyReply) => {
    try {
      const { userId, eventType, limit } = request.query;
      const result = await iamIntegration.handleGetAuditEvents(userId, eventType, limit);
      reply.code(200).send(result);
    } catch (error) {
      logger.error('Get audit events endpoint error', { error });
      reply.code(500).send({ error: 'Failed to get audit events' });
    }
  });

  // Get current user profile endpoint
  fastify.get('/profile', {
    preHandler: [iamIntegration.createAuthMiddleware({ requireAuth: true })],
    schema: {
      description: 'Get current user profile',
      tags: ['IAM'],
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                roles: { type: 'array', items: { type: 'string' } },
                groups: { type: 'array', items: { type: 'string' } },
                permissions: { type: 'array', items: { type: 'string' } },
                lastLogin: { type: 'string', format: 'date-time' },
                mfaEnabled: { type: 'boolean' },
                accountStatus: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const user = request.user;
      if (!user) {
        reply.code(400).send({ error: 'User not found' });
        return;
      }

      reply.code(200).send({ user });
    } catch (error) {
      logger.error('Get profile endpoint error', { error });
      reply.code(500).send({ error: 'Failed to get user profile' });
    }
  });

  // Get IAM configuration endpoint (admin only)
  fastify.get('/config', {
    preHandler: [iamIntegration.createAuthMiddleware({ 
      requireAuth: true,
      requiredRoles: ['admin']
    })],
    schema: {
      description: 'Get IAM configuration',
      tags: ['IAM'],
      response: {
        200: {
          type: 'object',
          properties: {
            config: { type: 'object' }
          }
        }
      }
    }
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const config = iamIntegration.getConfiguration();
      reply.code(200).send({ config });
    } catch (error) {
      logger.error('Get config endpoint error', { error });
      reply.code(500).send({ error: 'Failed to get configuration' });
    }
  });

  // Update IAM configuration endpoint (admin only)
  fastify.put('/config', {
    preHandler: [iamIntegration.createAuthMiddleware({ 
      requireAuth: true,
      requiredRoles: ['admin']
    })],
    schema: {
      description: 'Update IAM configuration',
      tags: ['IAM'],
      body: {
        type: 'object',
        properties: {
          session: {
            type: 'object',
            properties: {
              timeout: { type: 'number' },
              maxConcurrentSessions: { type: 'number' },
              requireMfa: { type: 'boolean' }
            }
          },
          security: {
            type: 'object',
            properties: {
              maxLoginAttempts: { type: 'number' },
              lockoutDuration: { type: 'number' }
            }
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const updates = request.body;
      iamIntegration.updateConfiguration(updates);
      reply.code(200).send({ success: true });
    } catch (error) {
      logger.error('Update config endpoint error', { error });
      reply.code(500).send({ error: 'Failed to update configuration' });
    }
  });

  logger.info('IAM routes registered successfully');
}
