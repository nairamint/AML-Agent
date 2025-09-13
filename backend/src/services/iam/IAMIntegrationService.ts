/**
 * IAM Integration Service
 * AML-KYC Agent Enterprise Identity & Access Management
 * 
 * This service provides integration between the IAM system and the AML-KYC Agent
 */

import { ProductionEnterpriseIAMService, AuthResult, LoginCredentials, MFAMethod, MFASetup } from './ProductionEnterpriseIAMService';
import { IAMConfigurationService, IAMConfiguration } from './IAMConfiguration';
import { Logger } from 'winston';
import { Request, Reply } from 'fastify';

export interface IAMIntegrationConfig {
  iamService: ProductionEnterpriseIAMService;
  configService: IAMConfigurationService;
  logger: Logger;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    roles: string[];
    groups: string[];
    permissions: string[];
    sessionId: string;
  };
  sessionId?: string;
}

export interface IAMMiddlewareOptions {
  requireAuth: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireMFA?: boolean;
  resource?: string;
  action?: string;
}

export class IAMIntegrationService {
  private iamService: ProductionEnterpriseIAMService;
  private configService: IAMConfigurationService;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(config: IAMIntegrationConfig) {
    this.iamService = config.iamService;
    this.configService = config.configService;
    this.logger = config.logger;
  }

  /**
   * Initialize the IAM integration service
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing IAM Integration Service');

      // Initialize IAM service
      await this.iamService.initialize();

      // Validate configuration
      const validation = this.configService.validateConfiguration();
      if (!validation.valid) {
        throw new Error(`Invalid IAM configuration: ${validation.errors.join(', ')}`);
      }

      this.isInitialized = true;
      this.logger.info('IAM Integration Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize IAM integration service', { error });
      throw new Error(`IAM integration initialization failed: ${error.message}`);
    }
  }

  /**
   * Authentication middleware for Fastify
   */
  createAuthMiddleware(options: IAMMiddlewareOptions = { requireAuth: true }) {
    return async (request: AuthenticatedRequest, reply: Reply) => {
      if (!this.isInitialized) {
        reply.code(500).send({ error: 'IAM service not initialized' });
        return;
      }

      try {
        // Extract authentication token from request
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          if (options.requireAuth) {
            reply.code(401).send({ error: 'Authentication required' });
            return;
          }
          return;
        }

        const token = authHeader.substring(7);

        // Validate token and get user information
        const userInfo = await this.validateToken(token);
        if (!userInfo) {
          if (options.requireAuth) {
            reply.code(401).send({ error: 'Invalid authentication token' });
            return;
          }
          return;
        }

        // Check role requirements
        if (options.requiredRoles && options.requiredRoles.length > 0) {
          const hasRequiredRole = options.requiredRoles.some(role => 
            userInfo.roles.includes(role)
          );
          if (!hasRequiredRole) {
            reply.code(403).send({ error: 'Insufficient permissions' });
            return;
          }
        }

        // Check permission requirements
        if (options.requiredPermissions && options.requiredPermissions.length > 0) {
          const hasRequiredPermission = options.requiredPermissions.some(permission => 
            userInfo.permissions.includes(permission)
          );
          if (!hasRequiredPermission) {
            reply.code(403).send({ error: 'Insufficient permissions' });
            return;
          }
        }

        // Check MFA requirements
        if (options.requireMFA && !userInfo.mfaVerified) {
          reply.code(403).send({ error: 'Multi-factor authentication required' });
          return;
        }

        // Check resource-specific permissions
        if (options.resource && options.action) {
          const hasResourcePermission = await this.iamService.enforceRBAC(
            userInfo.id,
            options.resource,
            options.action
          );
          if (!hasResourcePermission) {
            reply.code(403).send({ error: 'Access denied to resource' });
            return;
          }
        }

        // Add user information to request
        request.user = userInfo;
        request.sessionId = userInfo.sessionId;

        this.logger.debug('User authenticated successfully', {
          userId: userInfo.id,
          username: userInfo.username,
          roles: userInfo.roles,
          sessionId: userInfo.sessionId
        });

      } catch (error) {
        this.logger.error('Authentication middleware error', { error });
        if (options.requireAuth) {
          reply.code(500).send({ error: 'Authentication service error' });
          return;
        }
      }
    };
  }

  /**
   * Login endpoint handler
   */
  async handleLogin(credentials: LoginCredentials): Promise<AuthResult> {
    if (!this.isInitialized) {
      throw new Error('IAM service not initialized');
    }

    try {
      this.logger.info('Login attempt', { username: credentials.username });

      const result = await this.iamService.authenticateUser(credentials);

      if (result.success) {
        this.logger.info('Login successful', {
          userId: result.user?.id,
          username: result.user?.username,
          sessionId: result.sessionId
        });
      } else {
        this.logger.warn('Login failed', {
          username: credentials.username,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      this.logger.error('Login handler error', { error });
      return {
        success: false,
        error: 'Login service error'
      };
    }
  }

  /**
   * Logout endpoint handler
   */
  async handleLogout(sessionId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      throw new Error('IAM service not initialized');
    }

    try {
      this.logger.info('Logout request', { sessionId });

      const success = await this.iamService.logoutUser(sessionId);

      if (success) {
        this.logger.info('Logout successful', { sessionId });
        return { success: true };
      } else {
        this.logger.warn('Logout failed', { sessionId });
        return { success: false, error: 'Logout failed' };
      }
    } catch (error) {
      this.logger.error('Logout handler error', { error });
      return {
        success: false,
        error: 'Logout service error'
      };
    }
  }

  /**
   * MFA setup endpoint handler
   */
  async handleMFASetup(userId: string, method: MFAMethod): Promise<MFASetup> {
    if (!this.isInitialized) {
      throw new Error('IAM service not initialized');
    }

    try {
      this.logger.info('MFA setup request', { userId, method: method.type });

      const result = await this.iamService.enableMFA(userId, method);

      if (result.success) {
        this.logger.info('MFA setup successful', { userId, method: method.type });
      } else {
        this.logger.warn('MFA setup failed', { userId, method: method.type, error: result.error });
      }

      return result;
    } catch (error) {
      this.logger.error('MFA setup handler error', { error });
      return {
        success: false,
        error: 'MFA setup service error'
      };
    }
  }

  /**
   * Permission check endpoint handler
   */
  async handlePermissionCheck(
    userId: string,
    resource: string,
    action: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!this.isInitialized) {
      throw new Error('IAM service not initialized');
    }

    try {
      this.logger.debug('Permission check request', { userId, resource, action });

      const allowed = await this.iamService.enforceRBAC(userId, resource, action);

      this.logger.debug('Permission check result', { userId, resource, action, allowed });

      return { allowed };
    } catch (error) {
      this.logger.error('Permission check handler error', { error });
      return {
        allowed: false,
        reason: 'Permission check service error'
      };
    }
  }

  /**
   * Get user sessions endpoint handler
   */
  async handleGetUserSessions(userId?: string): Promise<{ sessions: any[] }> {
    if (!this.isInitialized) {
      throw new Error('IAM service not initialized');
    }

    try {
      const sessions = this.iamService.getActiveSessions(userId);

      this.logger.debug('User sessions retrieved', { userId, sessionCount: sessions.length });

      return { sessions };
    } catch (error) {
      this.logger.error('Get user sessions handler error', { error });
      return { sessions: [] };
    }
  }

  /**
   * Get audit events endpoint handler
   */
  async handleGetAuditEvents(
    userId?: string,
    eventType?: string,
    limit: number = 100
  ): Promise<{ events: any[] }> {
    if (!this.isInitialized) {
      throw new Error('IAM service not initialized');
    }

    try {
      const events = this.iamService.getAuditEvents(userId, eventType, limit);

      this.logger.debug('Audit events retrieved', { userId, eventType, eventCount: events.length });

      return { events };
    } catch (error) {
      this.logger.error('Get audit events handler error', { error });
      return { events: [] };
    }
  }

  /**
   * Health check endpoint handler
   */
  async handleHealthCheck(): Promise<{ healthy: boolean; details: any }> {
    if (!this.isInitialized) {
      return {
        healthy: false,
        details: { error: 'IAM service not initialized' }
      };
    }

    try {
      const health = await this.iamService.healthCheck();

      this.logger.debug('Health check completed', { healthy: health.healthy });

      return health;
    } catch (error) {
      this.logger.error('Health check handler error', { error });
      return {
        healthy: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Validate authentication token
   */
  private async validateToken(token: string): Promise<any> {
    try {
      // In a real implementation, this would validate the JWT token
      // and extract user information from it
      // For now, this is a placeholder implementation

      // Decode JWT token (simplified)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Check token expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }

      // Return user information
      return {
        id: payload.sub,
        username: payload.preferred_username,
        email: payload.email,
        roles: payload.realm_access?.roles || [],
        groups: payload.groups || [],
        permissions: payload.permissions || [],
        sessionId: payload.session_state,
        mfaVerified: payload.mfa_verified || false
      };
    } catch (error) {
      this.logger.error('Token validation error', { error });
      return null;
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): IAMConfiguration {
    return this.configService.getConfiguration();
  }

  /**
   * Update configuration
   */
  updateConfiguration(updates: Partial<IAMConfiguration>): void {
    this.configService.updateConfiguration(updates);
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfiguration(environment: 'development' | 'staging' | 'production'): IAMConfiguration {
    return this.configService.getEnvironmentConfiguration(environment);
  }
}
