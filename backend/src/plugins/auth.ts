import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthenticationError, AuthorizationError } from '../middleware/errorHandler';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name?: string;
      role: string;
      organization: string;
      jurisdiction: string;
    };
  }
}

export async function authPlugin(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  // JWT verification decorator
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = extractToken(request);
      
      if (!token) {
        throw new AuthenticationError('No token provided');
      }

      // Verify JWT token
      const decoded = fastify.jwt.verify(token) as any;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organization: true,
          jurisdiction: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      // Attach user to request
      request.user = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
        organization: user.organization,
        jurisdiction: user.jurisdiction,
      };

      // Log authentication
      logger.info('User authenticated', {
        userId: user.id,
        email: user.email,
        role: user.role,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });

    } catch (error) {
      logger.warn('Authentication failed', {
        error: error.message,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
      
      throw new AuthenticationError('Invalid or expired token');
    }
  });

  // Role-based authorization decorator
  fastify.decorate('authorize', (roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!roles.includes(request.user.role)) {
        logger.warn('Authorization failed', {
          userId: request.user.id,
          userRole: request.user.role,
          requiredRoles: roles,
          ip: request.ip,
        });
        
        throw new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`);
      }
    };
  });

  // Organization-based authorization decorator
  fastify.decorate('authorizeOrganization', (organizations: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!organizations.includes(request.user.organization)) {
        logger.warn('Organization authorization failed', {
          userId: request.user.id,
          userOrganization: request.user.organization,
          requiredOrganizations: organizations,
          ip: request.ip,
        });
        
        throw new AuthorizationError(`Access denied. Required organizations: ${organizations.join(', ')}`);
      }
    };
  });

  // Jurisdiction-based authorization decorator
  fastify.decorate('authorizeJurisdiction', (jurisdictions: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!jurisdictions.includes(request.user.jurisdiction)) {
        logger.warn('Jurisdiction authorization failed', {
          userId: request.user.id,
          userJurisdiction: request.user.jurisdiction,
          requiredJurisdictions: jurisdictions,
          ip: request.ip,
        });
        
        throw new AuthorizationError(`Access denied. Required jurisdictions: ${jurisdictions.join(', ')}`);
      }
    };
  });

  // Optional authentication decorator
  fastify.decorate('optionalAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = extractToken(request);
      
      if (token) {
        const decoded = fastify.jwt.verify(token) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organization: true,
            jurisdiction: true,
            isActive: true,
          },
        });

        if (user && user.isActive) {
          request.user = {
            id: user.id,
            email: user.email,
            name: user.name || undefined,
            role: user.role,
            organization: user.organization,
            jurisdiction: user.jurisdiction,
          };
        }
      }
    } catch (error) {
      // Optional auth - don't throw error, just don't set user
      logger.debug('Optional authentication failed', { error: error.message });
    }
  });

  // Rate limiting decorator
  fastify.decorate('rateLimit', (maxRequests: number, windowMs: number) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const key = request.user ? `user:${request.user.id}` : `ip:${request.ip}`;
      const redis = fastify.redis;
      
      try {
        const current = await redis.incr(key);
        
        if (current === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }
        
        if (current > maxRequests) {
          logger.warn('Rate limit exceeded', {
            key,
            current,
            maxRequests,
            ip: request.ip,
            userId: request.user?.id,
          });
          
          throw new Error('Rate limit exceeded');
        }
      } catch (error) {
        if (error.message === 'Rate limit exceeded') {
          throw error;
        }
        logger.error('Rate limiting error', error);
      }
    };
  });
}

function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

// Helper function to check if user has permission
export function hasPermission(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Helper function to check if user can access resource
export function canAccessResource(
  user: { organization: string; jurisdiction: string },
  resource: { organization?: string; jurisdiction?: string }
): boolean {
  // Admin users can access all resources
  if (user.organization === 'admin') {
    return true;
  }
  
  // Check organization access
  if (resource.organization && resource.organization !== user.organization) {
    return false;
  }
  
  // Check jurisdiction access
  if (resource.jurisdiction && resource.jurisdiction !== user.jurisdiction) {
    return false;
  }
  
  return true;
}

// Helper function to filter resources by user access
export function filterResourcesByAccess<T extends { organization?: string; jurisdiction?: string }>(
  user: { organization: string; jurisdiction: string },
  resources: T[]
): T[] {
  return resources.filter(resource => canAccessResource(user, resource));
}

// Helper function to create audit context
export function createAuditContext(request: FastifyRequest) {
  return {
    userId: request.user?.id,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    timestamp: new Date(),
  };
}

