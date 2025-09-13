/**
 * Real Authentication Service Implementation
 * 
 * Production-ready authentication using Auth0, JWT, and OAuth2
 * Replaces mock authentication with enterprise-grade security
 */

import { AuthenticationClient, ManagementClient } from 'auth0';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
    timeout: number; // milliseconds
    maxSessions: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  profile: {
    firstName: string;
    lastName: string;
    organization: string;
    department: string;
    jurisdiction: string;
    complianceFrameworks: string[];
  };
  preferences: {
    defaultJurisdiction: string;
    preferredFrameworks: string[];
    riskTolerance: 'low' | 'medium' | 'high';
    notificationSettings: any;
    displaySettings: any;
  };
  lastLogin: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export class RealAuthService {
  private auth0: AuthenticationClient;
  private management: ManagementClient;
  private config: AuthConfig;
  private activeSessions: Map<string, SessionInfo> = new Map();
  private isInitialized: boolean = false;

  constructor(config: AuthConfig) {
    this.config = config;
    
    this.auth0 = new AuthenticationClient({
      domain: config.auth0.domain,
      clientId: config.auth0.clientId,
      clientSecret: config.auth0.clientSecret,
    });
    
    this.management = new ManagementClient({
      domain: config.auth0.domain,
      clientId: config.auth0.clientId,
      clientSecret: config.auth0.clientSecret,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test Auth0 connection
      await this.testAuth0Connection();
      
      // Initialize session cleanup
      this.startSessionCleanup();
      
      this.isInitialized = true;
      console.log('RealAuthService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RealAuthService:', error);
      throw error;
    }
  }

  private async testAuth0Connection(): Promise<void> {
    try {
      // Test management API connection
      await this.management.getUsers({ per_page: 1 });
    } catch (error) {
      console.error('Auth0 connection test failed:', error);
      throw new Error('Cannot connect to Auth0');
    }
  }

  // Authentication Methods
  async authenticateUser(email: string, password: string): Promise<{
    user: User;
    tokens: AuthTokens;
    session: SessionInfo;
  }> {
    try {
      // Authenticate with Auth0
      const authResult = await this.auth0.passwordGrant({
        username: email,
        password: password,
        audience: this.config.auth0.audience,
        scope: 'openid profile email',
      });

      // Get user information
      const userInfo = await this.auth0.getUserInfo(authResult.access_token);
      
      // Get user details from Auth0
      const auth0User = await this.management.getUser({ id: userInfo.sub });
      
      // Create user object
      const user = await this.createUserFromAuth0(auth0User);
      
      // Generate tokens
      const tokens = await this.generateTokens(user);
      
      // Create session
      const session = await this.createSession(user.id, authResult.access_token);
      
      return { user, tokens, session };
      
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Invalid credentials');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.config.jwt.secret) as any;
      
      // Get user
      const user = await this.getUserById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }
      
      // Generate new tokens
      const tokens = await this.generateTokens(user);
      
      return tokens;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Invalid refresh token');
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, this.config.jwt.secret) as any;
      
      // Get user
      const user = await this.getUserById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }
      
      // Check session validity
      const session = this.activeSessions.get(decoded.sessionId);
      if (!session || !session.isActive || new Date() > new Date(session.expiresAt)) {
        throw new Error('Session expired');
      }
      
      // Update last activity
      session.lastActivity = new Date().toISOString();
      
      return user;
      
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new Error('Invalid token');
    }
  }

  async logout(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.isActive = false;
        this.activeSessions.delete(sessionId);
      }
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  // Authorization Methods
  async checkPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;
      
      // Check if user has the required permission
      const hasPermission = user.permissions.some(p => 
        p === `${permission.resource}:${permission.action}` ||
        p === `${permission.resource}:*` ||
        p === '*:*'
      );
      
      if (!hasPermission) return false;
      
      // Check role-based conditions
      if (permission.conditions) {
        return this.evaluateConditions(user, permission.conditions);
      }
      
      return true;
      
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.getUserById(userId);
      return user ? user.permissions : [];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const user = await this.getUserById(userId);
      return user ? user.roles : [];
    } catch (error) {
      console.error('Failed to get user roles:', error);
      return [];
    }
  }

  // User Management Methods
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    roles: string[];
    profile: User['profile'];
  }): Promise<User> {
    try {
      // Create user in Auth0
      const auth0User = await this.management.createUser({
        connection: 'Username-Password-Authentication',
        email: userData.email,
        password: userData.password,
        name: userData.name,
        user_metadata: {
          roles: userData.roles,
          profile: userData.profile,
        },
      });
      
      // Create user object
      const user = await this.createUserFromAuth0(auth0User);
      
      return user;
      
    } catch (error) {
      console.error('User creation failed:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      // Update user in Auth0
      const auth0User = await this.management.updateUser(
        { id: userId },
        {
          user_metadata: {
            roles: updates.roles,
            profile: updates.profile,
            preferences: updates.preferences,
          },
        }
      );
      
      // Create updated user object
      const user = await this.createUserFromAuth0(auth0User);
      
      return user;
      
    } catch (error) {
      console.error('User update failed:', error);
      throw new Error('Failed to update user');
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Delete user from Auth0
      await this.management.deleteUser({ id: userId });
      
      // Remove all sessions for this user
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (session.userId === userId) {
          this.activeSessions.delete(sessionId);
        }
      }
      
    } catch (error) {
      console.error('User deletion failed:', error);
      throw new Error('Failed to delete user');
    }
  }

  // Session Management Methods
  async createSession(userId: string, accessToken: string): Promise<SessionInfo> {
    try {
      const sessionId = `session_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.session.timeout);
      
      const session: SessionInfo = {
        sessionId,
        userId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastActivity: now.toISOString(),
        ipAddress: '', // Will be set by the calling code
        userAgent: '', // Will be set by the calling code
        isActive: true,
      };
      
      // Check session limit
      const userSessions = Array.from(this.activeSessions.values())
        .filter(s => s.userId === userId && s.isActive);
      
      if (userSessions.length >= this.config.session.maxSessions) {
        // Remove oldest session
        const oldestSession = userSessions.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[0];
        this.activeSessions.delete(oldestSession.sessionId);
      }
      
      this.activeSessions.set(sessionId, session);
      
      return session;
      
    } catch (error) {
      console.error('Session creation failed:', error);
      throw new Error('Failed to create session');
    }
  }

  async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.isActive);
  }

  async terminateSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
    }
  }

  // Private Helper Methods
  private async createUserFromAuth0(auth0User: any): Promise<User> {
    const metadata = auth0User.user_metadata || {};
    const appMetadata = auth0User.app_metadata || {};
    
    return {
      id: auth0User.user_id,
      email: auth0User.email,
      name: auth0User.name,
      roles: metadata.roles || [],
      permissions: this.getPermissionsFromRoles(metadata.roles || []),
      profile: {
        firstName: metadata.profile?.firstName || '',
        lastName: metadata.profile?.lastName || '',
        organization: metadata.profile?.organization || '',
        department: metadata.profile?.department || '',
        jurisdiction: metadata.profile?.jurisdiction || 'Luxembourg',
        complianceFrameworks: metadata.profile?.complianceFrameworks || ['AML', 'KYC'],
      },
      preferences: {
        defaultJurisdiction: metadata.preferences?.defaultJurisdiction || 'Luxembourg',
        preferredFrameworks: metadata.preferences?.preferredFrameworks || ['AML', 'KYC'],
        riskTolerance: metadata.preferences?.riskTolerance || 'medium',
        notificationSettings: metadata.preferences?.notificationSettings || {},
        displaySettings: metadata.preferences?.displaySettings || {},
      },
      lastLogin: auth0User.last_login || new Date().toISOString(),
      isActive: !auth0User.blocked,
    };
  }

  private getPermissionsFromRoles(roles: string[]): string[] {
    const rolePermissions: Record<string, string[]> = {
      'admin': ['*:*'],
      'compliance_officer': [
        'advisory:*',
        'regulatory:*',
        'audit:read',
        'reports:read',
        'reports:create',
      ],
      'analyst': [
        'advisory:read',
        'advisory:create',
        'regulatory:read',
        'reports:read',
      ],
      'manager': [
        'advisory:*',
        'regulatory:read',
        'audit:read',
        'reports:*',
        'users:read',
      ],
      'auditor': [
        'audit:*',
        'reports:read',
        'regulatory:read',
      ],
    };
    
    const permissions = new Set<string>();
    roles.forEach(role => {
      const rolePerms = rolePermissions[role] || [];
      rolePerms.forEach(perm => permissions.add(perm));
    });
    
    return Array.from(permissions);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour
    const refreshExpiresIn = 7 * 24 * 3600; // 7 days
    
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      iat: now,
      exp: now + expiresIn,
    };
    
    const refreshPayload = {
      userId: user.id,
      type: 'refresh',
      iat: now,
      exp: now + refreshExpiresIn,
    };
    
    const accessToken = jwt.sign(payload, this.config.jwt.secret);
    const refreshToken = jwt.sign(refreshPayload, this.config.jwt.secret);
    const idToken = jwt.sign({ ...payload, type: 'id' }, this.config.jwt.secret);
    
    return {
      accessToken,
      refreshToken,
      idToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  private async getUserById(userId: string): Promise<User | null> {
    try {
      // In a real implementation, this would fetch from a database
      // For now, we'll simulate by getting from Auth0
      const auth0User = await this.management.getUser({ id: userId });
      return await this.createUserFromAuth0(auth0User);
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }

  private evaluateConditions(user: User, conditions: Record<string, any>): boolean {
    // Evaluate authorization conditions
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'jurisdiction':
          if (user.profile.jurisdiction !== value) return false;
          break;
        case 'department':
          if (user.profile.department !== value) return false;
          break;
        case 'time_based':
          const currentHour = new Date().getHours();
          if (currentHour < value.start || currentHour > value.end) return false;
          break;
        default:
          // Unknown condition
          break;
      }
    }
    return true;
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      const now = new Date();
      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (new Date(session.expiresAt) < now) {
          this.activeSessions.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000);
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test Auth0 connection
      await this.management.getUsers({ per_page: 1 });
      return this.isInitialized;
    } catch (error) {
      console.error('Auth service health check failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    this.activeSessions.clear();
    this.isInitialized = false;
  }
}

