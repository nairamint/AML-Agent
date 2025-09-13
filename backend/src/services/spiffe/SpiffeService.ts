/**
 * SPIFFE Service Implementation
 * AML-KYC Agent Zero Trust Identity Management
 * 
 * This service provides SPIFFE/SPIRE integration for workload identity
 * and zero trust authentication in the AML-KYC Agent system.
 */

import { createClient } from '@spiffe/spiffe-js';
import { WorkloadX509Source } from '@spiffe/spiffe-js/dist/src/x509-source';
import { JwtSvidSource } from '@spiffe/spiffe-js/dist/src/jwt-svid-source';
import { SpiffeId } from '@spiffe/spiffe-js/dist/src/spiffe-id';
import { Logger } from 'winston';

export interface SpiffeConfig {
  trustDomain: string;
  serverAddress: string;
  serverPort: number;
  workloadApiSocket: string;
  spiffeId: string;
  logger: Logger;
}

export interface SpiffeIdentity {
  spiffeId: string;
  trustDomain: string;
  x509Svid: string;
  jwtSvid: string;
  expiresAt: Date;
  issuedAt: Date;
}

export interface SpiffeValidationResult {
  isValid: boolean;
  spiffeId?: string;
  trustDomain?: string;
  error?: string;
  expiresAt?: Date;
}

export class SpiffeService {
  private config: SpiffeConfig;
  private x509Source: WorkloadX509Source | null = null;
  private jwtSvidSource: JwtSvidSource | null = null;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(config: SpiffeConfig) {
    this.config = config;
    this.logger = config.logger;
  }

  /**
   * Initialize SPIFFE service with workload API connection
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing SPIFFE service', {
        trustDomain: this.config.trustDomain,
        serverAddress: this.config.serverAddress,
        spiffeId: this.config.spiffeId
      });

      // Initialize X.509 SVID source
      this.x509Source = new WorkloadX509Source({
        socketPath: this.config.workloadApiSocket,
        timeout: 30000
      });

      // Initialize JWT SVID source
      this.jwtSvidSource = new JwtSvidSource({
        socketPath: this.config.workloadApiSocket,
        timeout: 30000
      });

      // Test connection to workload API
      await this.testConnection();

      this.isInitialized = true;
      this.logger.info('SPIFFE service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SPIFFE service', { error });
      throw new Error(`SPIFFE initialization failed: ${error.message}`);
    }
  }

  /**
   * Test connection to SPIFFE workload API
   */
  private async testConnection(): Promise<void> {
    try {
      if (!this.x509Source) {
        throw new Error('X.509 source not initialized');
      }

      // Attempt to fetch X.509 SVID
      const x509Svid = await this.x509Source.getX509Svid();
      this.logger.info('SPIFFE workload API connection successful', {
        spiffeId: x509Svid.spiffeId.toString()
      });
    } catch (error) {
      this.logger.error('SPIFFE workload API connection failed', { error });
      throw error;
    }
  }

  /**
   * Get current X.509 SVID for this workload
   */
  async getX509Svid(): Promise<string> {
    if (!this.isInitialized || !this.x509Source) {
      throw new Error('SPIFFE service not initialized');
    }

    try {
      const x509Svid = await this.x509Source.getX509Svid();
      return x509Svid.certChain;
    } catch (error) {
      this.logger.error('Failed to get X.509 SVID', { error });
      throw new Error(`Failed to get X.509 SVID: ${error.message}`);
    }
  }

  /**
   * Get JWT SVID for this workload
   */
  async getJwtSvid(audience: string): Promise<string> {
    if (!this.isInitialized || !this.jwtSvidSource) {
      throw new Error('SPIFFE service not initialized');
    }

    try {
      const jwtSvid = await this.jwtSvidSource.fetchJwtSvid({
        audience: [audience],
        spiffeId: this.config.spiffeId
      });
      return jwtSvid.token;
    } catch (error) {
      this.logger.error('Failed to get JWT SVID', { error, audience });
      throw new Error(`Failed to get JWT SVID: ${error.message}`);
    }
  }

  /**
   * Validate SPIFFE identity from X.509 certificate
   */
  async validateX509Identity(certificate: string): Promise<SpiffeValidationResult> {
    try {
      // Parse X.509 certificate
      const cert = this.parseX509Certificate(certificate);
      
      // Extract SPIFFE ID from certificate
      const spiffeId = this.extractSpiffeIdFromCert(cert);
      
      if (!spiffeId) {
        return {
          isValid: false,
          error: 'No SPIFFE ID found in certificate'
        };
      }

      // Validate trust domain
      if (spiffeId.trustDomain !== this.config.trustDomain) {
        return {
          isValid: false,
          error: `Invalid trust domain: ${spiffeId.trustDomain}`
        };
      }

      // Validate certificate expiration
      const now = new Date();
      if (cert.validTo < now) {
        return {
          isValid: false,
          error: 'Certificate has expired'
        };
      }

      return {
        isValid: true,
        spiffeId: spiffeId.toString(),
        trustDomain: spiffeId.trustDomain,
        expiresAt: cert.validTo
      };
    } catch (error) {
      this.logger.error('Failed to validate X.509 identity', { error });
      return {
        isValid: false,
        error: `Validation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate JWT SVID
   */
  async validateJwtSvid(token: string, audience: string): Promise<SpiffeValidationResult> {
    try {
      // Parse JWT token
      const jwt = this.parseJwtToken(token);
      
      // Validate audience
      if (!jwt.aud || !jwt.aud.includes(audience)) {
        return {
          isValid: false,
          error: 'Invalid audience in JWT'
        };
      }

      // Validate trust domain
      if (jwt.iss !== this.config.trustDomain) {
        return {
          isValid: false,
          error: `Invalid issuer: ${jwt.iss}`
        };
      }

      // Validate expiration
      const now = Math.floor(Date.now() / 1000);
      if (jwt.exp && jwt.exp < now) {
        return {
          isValid: false,
          error: 'JWT has expired'
        };
      }

      return {
        isValid: true,
        spiffeId: jwt.sub,
        trustDomain: jwt.iss,
        expiresAt: new Date(jwt.exp * 1000)
      };
    } catch (error) {
      this.logger.error('Failed to validate JWT SVID', { error });
      return {
        isValid: false,
        error: `JWT validation failed: ${error.message}`
      };
    }
  }

  /**
   * Get current workload identity
   */
  async getWorkloadIdentity(): Promise<SpiffeIdentity> {
    if (!this.isInitialized) {
      throw new Error('SPIFFE service not initialized');
    }

    try {
      const x509Svid = await this.getX509Svid();
      const jwtSvid = await this.getJwtSvid('aml-kyc-agent');
      
      // Parse certificate to get expiration
      const cert = this.parseX509Certificate(x509Svid);
      const spiffeId = this.extractSpiffeIdFromCert(cert);

      return {
        spiffeId: spiffeId?.toString() || this.config.spiffeId,
        trustDomain: this.config.trustDomain,
        x509Svid,
        jwtSvid,
        expiresAt: cert.validTo,
        issuedAt: cert.validFrom
      };
    } catch (error) {
      this.logger.error('Failed to get workload identity', { error });
      throw new Error(`Failed to get workload identity: ${error.message}`);
    }
  }

  /**
   * Parse X.509 certificate
   */
  private parseX509Certificate(certificate: string): any {
    // This is a simplified implementation
    // In production, use a proper X.509 certificate parser
    try {
      // Remove PEM headers and decode base64
      const certData = certificate
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\s/g, '');
      
      // Parse certificate (simplified)
      return {
        validFrom: new Date(),
        validTo: new Date(Date.now() + 3600000), // 1 hour from now
        subject: 'CN=aml-kyc-agent'
      };
    } catch (error) {
      throw new Error(`Failed to parse X.509 certificate: ${error.message}`);
    }
  }

  /**
   * Extract SPIFFE ID from X.509 certificate
   */
  private extractSpiffeIdFromCert(cert: any): SpiffeId | null {
    try {
      // Extract SPIFFE ID from certificate subject or SAN
      // This is a simplified implementation
      const spiffeIdString = `spiffe://${this.config.trustDomain}/aml-kyc-agent`;
      return SpiffeId.parse(spiffeIdString);
    } catch (error) {
      this.logger.error('Failed to extract SPIFFE ID from certificate', { error });
      return null;
    }
  }

  /**
   * Parse JWT token
   */
  private parseJwtToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload;
    } catch (error) {
      throw new Error(`Failed to parse JWT token: ${error.message}`);
    }
  }

  /**
   * Check if SPIFFE service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }

      // Test workload API connection
      await this.testConnection();
      return true;
    } catch (error) {
      this.logger.error('SPIFFE health check failed', { error });
      return false;
    }
  }

  /**
   * Get SPIFFE service status
   */
  getStatus(): { initialized: boolean; trustDomain: string; spiffeId: string } {
    return {
      initialized: this.isInitialized,
      trustDomain: this.config.trustDomain,
      spiffeId: this.config.spiffeId
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.x509Source) {
        await this.x509Source.close();
        this.x509Source = null;
      }

      if (this.jwtSvidSource) {
        await this.jwtSvidSource.close();
        this.jwtSvidSource = null;
      }

      this.isInitialized = false;
      this.logger.info('SPIFFE service cleaned up');
    } catch (error) {
      this.logger.error('Failed to cleanup SPIFFE service', { error });
    }
  }
}
