/**
 * IAM Configuration Service
 * AML-KYC Agent Enterprise Identity & Access Management
 * 
 * This service provides configuration management for the IAM system
 */

import { Logger } from 'winston';

export interface IAMConfiguration {
  keycloak: {
    baseUrl: string;
    realmName: string;
    clientId: string;
    clientSecret: string;
    adminUsername: string;
    adminPassword: string;
    sslRequired: boolean;
    verifyTokenAudience: boolean;
  };
  oidc: {
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
    responseTypes: string[];
    grantTypes: string[];
  };
  session: {
    timeout: number; // minutes
    maxConcurrentSessions: number;
    requireMfa: boolean;
    sessionCookieSecure: boolean;
    sessionCookieHttpOnly: boolean;
    sessionCookieSameSite: 'strict' | 'lax' | 'none';
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
    logLevel: 'INFO' | 'WARN' | 'ERROR';
    includeUserData: boolean;
    includeSensitiveData: boolean;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number; // days
      historyCount: number;
    };
    mfa: {
      required: boolean;
      methods: string[];
      backupCodesCount: number;
      totpWindow: number;
    };
    encryption: {
      algorithm: string;
      keyLength: number;
      ivLength: number;
    };
  };
  compliance: {
    gdpr: {
      enabled: boolean;
      dataRetentionDays: number;
      rightToErasure: boolean;
    };
    sox: {
      enabled: boolean;
      auditTrailRetentionDays: number;
      segregationOfDuties: boolean;
    };
    iso27001: {
      enabled: boolean;
      accessControlPolicy: boolean;
      incidentManagement: boolean;
    };
  };
}

export class IAMConfigurationService {
  private config: IAMConfiguration;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from environment variables and defaults
   */
  private loadConfiguration(): IAMConfiguration {
    return {
      keycloak: {
        baseUrl: process.env.KEYCLOAK_BASE_URL || 'https://iam.internal.company.com',
        realmName: process.env.KEYCLOAK_REALM || 'aml-compliance',
        clientId: process.env.KEYCLOAK_CLIENT_ID || 'aml-advisory-agent',
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
        adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
        adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || '',
        sslRequired: process.env.KEYCLOAK_SSL_REQUIRED === 'true',
        verifyTokenAudience: process.env.KEYCLOAK_VERIFY_TOKEN_AUDIENCE === 'true'
      },
      oidc: {
        issuer: process.env.OIDC_ISSUER || 'https://iam.internal.company.com/realms/aml-compliance',
        clientId: process.env.OIDC_CLIENT_ID || 'aml-advisory-agent',
        clientSecret: process.env.OIDC_CLIENT_SECRET || '',
        redirectUri: process.env.OIDC_REDIRECT_URI || 'http://localhost:3000/auth/callback',
        scopes: (process.env.OIDC_SCOPES || 'openid profile email').split(' '),
        responseTypes: ['code'],
        grantTypes: ['authorization_code', 'password', 'refresh_token']
      },
      session: {
        timeout: parseInt(process.env.SESSION_TIMEOUT || '60'), // 60 minutes
        maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5'),
        requireMfa: process.env.REQUIRE_MFA === 'true',
        sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
        sessionCookieHttpOnly: process.env.SESSION_COOKIE_HTTP_ONLY !== 'false',
        sessionCookieSameSite: (process.env.SESSION_COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict'
      },
      audit: {
        enabled: process.env.AUDIT_ENABLED !== 'false',
        retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'), // 7 years
        logLevel: (process.env.AUDIT_LOG_LEVEL as 'INFO' | 'WARN' | 'ERROR') || 'INFO',
        includeUserData: process.env.AUDIT_INCLUDE_USER_DATA === 'true',
        includeSensitiveData: process.env.AUDIT_INCLUDE_SENSITIVE_DATA === 'false'
      },
      security: {
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '30'), // 30 minutes
        passwordPolicy: {
          minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12'),
          requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
          requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
          requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
          requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS !== 'false',
          maxAge: parseInt(process.env.PASSWORD_MAX_AGE || '90'), // 90 days
          historyCount: parseInt(process.env.PASSWORD_HISTORY_COUNT || '12')
        },
        mfa: {
          required: process.env.MFA_REQUIRED === 'true',
          methods: (process.env.MFA_METHODS || 'TOTP,SMS,EMAIL').split(','),
          backupCodesCount: parseInt(process.env.MFA_BACKUP_CODES_COUNT || '10'),
          totpWindow: parseInt(process.env.MFA_TOTP_WINDOW || '1')
        },
        encryption: {
          algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
          keyLength: parseInt(process.env.ENCRYPTION_KEY_LENGTH || '32'),
          ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH || '16')
        }
      },
      compliance: {
        gdpr: {
          enabled: process.env.GDPR_ENABLED === 'true',
          dataRetentionDays: parseInt(process.env.GDPR_DATA_RETENTION_DAYS || '2555'), // 7 years
          rightToErasure: process.env.GDPR_RIGHT_TO_ERASURE === 'true'
        },
        sox: {
          enabled: process.env.SOX_ENABLED === 'true',
          auditTrailRetentionDays: parseInt(process.env.SOX_AUDIT_TRAIL_RETENTION_DAYS || '2555'), // 7 years
          segregationOfDuties: process.env.SOX_SEGREGATION_OF_DUTIES === 'true'
        },
        iso27001: {
          enabled: process.env.ISO27001_ENABLED === 'true',
          accessControlPolicy: process.env.ISO27001_ACCESS_CONTROL_POLICY === 'true',
          incidentManagement: process.env.ISO27001_INCIDENT_MANAGEMENT === 'true'
        }
      }
    };
  }

  /**
   * Get the current configuration
   */
  getConfiguration(): IAMConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration (for runtime updates)
   */
  updateConfiguration(updates: Partial<IAMConfiguration>): void {
    this.config = { ...this.config, ...updates };
    this.logger.info('IAM configuration updated', { updates });
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!this.config.keycloak.baseUrl) {
      errors.push('Keycloak base URL is required');
    }

    if (!this.config.keycloak.realmName) {
      errors.push('Keycloak realm name is required');
    }

    if (!this.config.keycloak.clientId) {
      errors.push('Keycloak client ID is required');
    }

    if (!this.config.keycloak.clientSecret) {
      errors.push('Keycloak client secret is required');
    }

    if (!this.config.oidc.issuer) {
      errors.push('OIDC issuer is required');
    }

    if (!this.config.oidc.clientId) {
      errors.push('OIDC client ID is required');
    }

    if (!this.config.oidc.clientSecret) {
      errors.push('OIDC client secret is required');
    }

    // Validate numeric values
    if (this.config.session.timeout <= 0) {
      errors.push('Session timeout must be greater than 0');
    }

    if (this.config.session.maxConcurrentSessions <= 0) {
      errors.push('Max concurrent sessions must be greater than 0');
    }

    if (this.config.security.maxLoginAttempts <= 0) {
      errors.push('Max login attempts must be greater than 0');
    }

    if (this.config.security.lockoutDuration <= 0) {
      errors.push('Lockout duration must be greater than 0');
    }

    if (this.config.security.passwordPolicy.minLength < 8) {
      errors.push('Password minimum length must be at least 8 characters');
    }

    // Validate URLs
    try {
      new URL(this.config.keycloak.baseUrl);
    } catch {
      errors.push('Invalid Keycloak base URL format');
    }

    try {
      new URL(this.config.oidc.issuer);
    } catch {
      errors.push('Invalid OIDC issuer URL format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration for specific environment
   */
  getEnvironmentConfiguration(environment: 'development' | 'staging' | 'production'): IAMConfiguration {
    const baseConfig = this.getConfiguration();

    switch (environment) {
      case 'development':
        return {
          ...baseConfig,
          keycloak: {
            ...baseConfig.keycloak,
            sslRequired: false,
            verifyTokenAudience: false
          },
          session: {
            ...baseConfig.session,
            timeout: 480, // 8 hours for development
            requireMfa: false
          },
          audit: {
            ...baseConfig.audit,
            logLevel: 'INFO',
            includeUserData: true,
            includeSensitiveData: true
          },
          security: {
            ...baseConfig.security,
            maxLoginAttempts: 10,
            lockoutDuration: 5,
            passwordPolicy: {
              ...baseConfig.security.passwordPolicy,
              minLength: 8
            },
            mfa: {
              ...baseConfig.security.mfa,
              required: false
            }
          }
        };

      case 'staging':
        return {
          ...baseConfig,
          session: {
            ...baseConfig.session,
            timeout: 120, // 2 hours for staging
            requireMfa: true
          },
          audit: {
            ...baseConfig.audit,
            logLevel: 'WARN',
            includeUserData: false,
            includeSensitiveData: false
          },
          security: {
            ...baseConfig.security,
            maxLoginAttempts: 3,
            lockoutDuration: 15,
            mfa: {
              ...baseConfig.security.mfa,
              required: true
            }
          }
        };

      case 'production':
        return {
          ...baseConfig,
          keycloak: {
            ...baseConfig.keycloak,
            sslRequired: true,
            verifyTokenAudience: true
          },
          session: {
            ...baseConfig.session,
            timeout: 60, // 1 hour for production
            requireMfa: true,
            sessionCookieSecure: true,
            sessionCookieHttpOnly: true,
            sessionCookieSameSite: 'strict'
          },
          audit: {
            ...baseConfig.audit,
            logLevel: 'ERROR',
            includeUserData: false,
            includeSensitiveData: false
          },
          security: {
            ...baseConfig.security,
            maxLoginAttempts: 3,
            lockoutDuration: 30,
            passwordPolicy: {
              ...baseConfig.security.passwordPolicy,
              minLength: 12,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: true
            },
            mfa: {
              ...baseConfig.security.mfa,
              required: true,
              methods: ['TOTP', 'HARDWARE_TOKEN']
            }
          }
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Export configuration for backup/restore
   */
  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from backup
   */
  importConfiguration(configJson: string): { success: boolean; error?: string } {
    try {
      const importedConfig = JSON.parse(configJson);
      const validation = this.validateConfiguration();
      
      if (validation.valid) {
        this.config = importedConfig;
        this.logger.info('Configuration imported successfully');
        return { success: true };
      } else {
        return { success: false, error: `Invalid configuration: ${validation.errors.join(', ')}` };
      }
    } catch (error) {
      return { success: false, error: `Failed to parse configuration: ${error.message}` };
    }
  }
}
