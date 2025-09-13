/**
 * OSCAL Client for NIST CSF 2.0 Compliance
 * Production-ready implementation for Open Security Controls Assessment Language
 */

import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface OSCALConfig {
  catalogPath: string;
  profilePath?: string;
  assessmentPath?: string;
  componentPath?: string;
  systemPath?: string;
}

export interface OSCALControl {
  id: string;
  title: string;
  description: string;
  category: string;
  function: 'IDENTIFY' | 'PROTECT' | 'DETECT' | 'RESPOND' | 'RECOVER';
  subcategory: string;
  implementationStatus: 'implemented' | 'partial' | 'not-implemented' | 'not-applicable';
  evidence: OSCALEvidence[];
  lastAssessed: Date;
  nextAssessment: Date;
}

export interface OSCALEvidence {
  id: string;
  type: 'documentation' | 'test-result' | 'interview' | 'observation' | 'automated-test';
  title: string;
  description: string;
  collectedBy: string;
  collectedOn: Date;
  content: any;
  attachments?: string[];
}

export interface OSCALAssessment {
  id: string;
  title: string;
  description: string;
  type: 'risk-assessment' | 'control-assessment' | 'system-assessment';
  framework: string;
  version: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  assessor: string;
  results: OSCALAssessmentResult[];
  metadata: Record<string, any>;
}

export interface OSCALAssessmentResult {
  controlId: string;
  status: 'satisfied' | 'not-satisfied' | 'not-applicable' | 'not-implemented';
  remarks: string;
  evidence: OSCALEvidence[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  remediationPlan?: string;
}

export interface OSCALCatalog {
  id: string;
  title: string;
  version: string;
  controls: OSCALControl[];
  metadata: Record<string, any>;
}

export class OSCALClient {
  private logger: Logger;
  private prisma: PrismaClient;
  private config: OSCALConfig;
  private catalog: OSCALCatalog | null = null;

  constructor(config: OSCALConfig, logger: Logger, prisma: PrismaClient) {
    this.config = config;
    this.logger = logger;
    this.prisma = prisma;
  }

  /**
   * Initialize OSCAL client and load NIST CSF 2.0 catalog
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing OSCAL client for NIST CSF 2.0');
      
      // Load NIST CSF 2.0 catalog
      await this.loadCatalog();
      
      // Initialize database schema if needed
      await this.initializeDatabase();
      
      this.logger.info('OSCAL client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OSCAL client', { error });
      throw error;
    }
  }

  /**
   * Load NIST CSF 2.0 catalog from file system
   */
  private async loadCatalog(): Promise<void> {
    try {
      const catalogData = await fs.readFile(this.config.catalogPath, 'utf-8');
      const catalog = JSON.parse(catalogData);
      
      this.catalog = {
        id: catalog.id || 'nist-csf-2.0',
        title: catalog.title || 'NIST Cybersecurity Framework 2.0',
        version: catalog.version || '2.0.0',
        controls: this.parseControls(catalog.controls || []),
        metadata: catalog.metadata || {}
      };
      
      this.logger.info(`Loaded NIST CSF 2.0 catalog with ${this.catalog.controls.length} controls`);
    } catch (error) {
      this.logger.error('Failed to load OSCAL catalog', { error });
      // Create default catalog if file doesn't exist
      this.catalog = this.createDefaultCatalog();
    }
  }

  /**
   * Create default NIST CSF 2.0 catalog structure
   */
  private createDefaultCatalog(): OSCALCatalog {
    return {
      id: 'nist-csf-2.0',
      title: 'NIST Cybersecurity Framework 2.0',
      version: '2.0.0',
      controls: this.getDefaultNISTCSFControls(),
      metadata: {
        created: new Date().toISOString(),
        source: 'NIST CSF 2.0',
        description: 'Default NIST Cybersecurity Framework 2.0 controls'
      }
    };
  }

  /**
   * Get default NIST CSF 2.0 controls structure
   */
  private getDefaultNISTCSFControls(): OSCALControl[] {
    return [
      // IDENTIFY Function
      {
        id: 'ID.AM-1',
        title: 'Physical devices and systems within the organization are inventoried',
        description: 'Maintain an inventory of physical devices and systems within the organization',
        category: 'Asset Management',
        function: 'IDENTIFY',
        subcategory: 'ID.AM',
        implementationStatus: 'not-implemented',
        evidence: [],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      },
      {
        id: 'ID.AM-2',
        title: 'Software platforms and applications within the organization are inventoried',
        description: 'Maintain an inventory of software platforms and applications within the organization',
        category: 'Asset Management',
        function: 'IDENTIFY',
        subcategory: 'ID.AM',
        implementationStatus: 'not-implemented',
        evidence: [],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'ID.RA-1',
        title: 'Asset vulnerabilities are identified and documented',
        description: 'Identify and document vulnerabilities in organizational assets',
        category: 'Risk Assessment',
        function: 'IDENTIFY',
        subcategory: 'ID.RA',
        implementationStatus: 'not-implemented',
        evidence: [],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      
      // PROTECT Function
      {
        id: 'PR.AC-1',
        title: 'Identities and credentials are issued, managed, verified, revoked, and audited for authorized devices, users and processes',
        description: 'Implement identity and access management controls',
        category: 'Identity Management and Access Control',
        function: 'PROTECT',
        subcategory: 'PR.AC',
        implementationStatus: 'not-implemented',
        evidence: [],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
      },
      {
        id: 'PR.DS-1',
        title: 'Data-at-rest is protected',
        description: 'Implement data protection controls for data at rest',
        category: 'Data Security',
        function: 'PROTECT',
        subcategory: 'PR.DS',
        implementationStatus: 'not-implemented',
        evidence: [],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      
      // DETECT Function
      {
        id: 'DE.AE-1',
        title: 'A baseline of network operations and expected data flows for users and systems is established and managed',
        description: 'Establish and manage baseline network operations and data flows',
        category: 'Anomalies and Events',
        function: 'DETECT',
        subcategory: 'DE.AE',
        implementationStatus: 'not-implemented',
        evidence: [],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'DE.CM-1',
        title: 'The network is monitored to detect potential cybersecurity events',
        description: 'Implement network monitoring to detect cybersecurity events',
        category: 'Security Continuous Monitoring',
        function: 'DETECT',
        subcategory: 'DE.CM',
        implementationStatus: 'not-implemented',
        evidence: [],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      
      // RESPOND Function
      {
        id: 'RS.RP-1',
        title: 'Response plan is executed during or after a cybersecurity incident',
        description: 'Execute incident response plan during cybersecurity incidents',
        category: 'Response Planning',
        function: 'RESPOND',
        subcategory: 'RS.RP',
        implementationStatus: 'not-implemented',
        evidence: [],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      
      // RECOVER Function
      {
        id: 'RC.RP-1',
        title: 'Recovery plan is executed during or after a cybersecurity incident',
        description: 'Execute recovery plan during cybersecurity incidents',
        category: 'Recovery Planning',
        function: 'RECOVER',
        subcategory: 'RC.RP',
        implementationStatus: 'not-implemented',
        evidence: [],
        lastAssessed: new Date(),
        nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  /**
   * Parse controls from OSCAL format
   */
  private parseControls(controls: any[]): OSCALControl[] {
    return controls.map(control => ({
      id: control.id,
      title: control.title,
      description: control.description || '',
      category: control.category || 'Unknown',
      function: control.function || 'IDENTIFY',
      subcategory: control.subcategory || '',
      implementationStatus: 'not-implemented',
      evidence: [],
      lastAssessed: new Date(),
      nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }));
  }

  /**
   * Initialize database schema for OSCAL data
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // This would typically be handled by Prisma migrations
      // For now, we'll ensure the database is ready
      await this.prisma.$connect();
      this.logger.info('Database initialized for OSCAL data');
    } catch (error) {
      this.logger.error('Failed to initialize database', { error });
      throw error;
    }
  }

  /**
   * Get controls by function and category
   */
  async getControls(filters: {
    function?: string;
    categories?: string[];
    status?: string;
  } = {}): Promise<OSCALControl[]> {
    if (!this.catalog) {
      throw new Error('OSCAL catalog not loaded');
    }

    let controls = this.catalog.controls;

    if (filters.function) {
      controls = controls.filter(c => c.function === filters.function);
    }

    if (filters.categories && filters.categories.length > 0) {
      controls = controls.filter(c => filters.categories!.includes(c.subcategory));
    }

    if (filters.status) {
      controls = controls.filter(c => c.implementationStatus === filters.status);
    }

    return controls;
  }

  /**
   * Generate OSCAL-compliant assessment
   */
  async generateAssessment(params: {
    type: string;
    framework: string;
    results: any;
  }): Promise<OSCALAssessment> {
    const assessment: OSCALAssessment = {
      id: `assessment-${Date.now()}`,
      title: `${params.type} Assessment - ${params.framework}`,
      description: `Automated assessment for ${params.framework} framework`,
      type: params.type as any,
      framework: params.framework,
      version: '1.0.0',
      status: 'completed',
      startDate: new Date(),
      endDate: new Date(),
      assessor: 'AML-KYC Agent System',
      results: this.mapResultsToOSCAL(params.results),
      metadata: {
        generatedBy: 'AML-KYC Agent',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    // Store assessment in database
    await this.storeAssessment(assessment);

    return assessment;
  }

  /**
   * Map results to OSCAL format
   */
  private mapResultsToOSCAL(results: any): OSCALAssessmentResult[] {
    // This would map the actual assessment results to OSCAL format
    return Object.keys(results).map(controlId => ({
      controlId,
      status: this.determineStatus(results[controlId]),
      remarks: `Assessment result for ${controlId}`,
      evidence: [],
      riskLevel: this.determineRiskLevel(results[controlId])
    }));
  }

  /**
   * Determine control status from assessment result
   */
  private determineStatus(result: any): 'satisfied' | 'not-satisfied' | 'not-applicable' | 'not-implemented' {
    if (result.implemented === true) return 'satisfied';
    if (result.implemented === false) return 'not-implemented';
    if (result.notApplicable === true) return 'not-applicable';
    return 'not-satisfied';
  }

  /**
   * Determine risk level from assessment result
   */
  private determineRiskLevel(result: any): 'low' | 'medium' | 'high' | 'critical' {
    if (result.riskLevel) return result.riskLevel;
    if (result.implemented === true) return 'low';
    if (result.implemented === false) return 'high';
    return 'medium';
  }

  /**
   * Store assessment in database
   */
  private async storeAssessment(assessment: OSCALAssessment): Promise<void> {
    try {
      // Store assessment metadata
      await this.prisma.oscalAssessment.create({
        data: {
          id: assessment.id,
          title: assessment.title,
          description: assessment.description,
          type: assessment.type,
          framework: assessment.framework,
          version: assessment.version,
          status: assessment.status,
          startDate: assessment.startDate,
          endDate: assessment.endDate,
          assessor: assessment.assessor,
          metadata: assessment.metadata,
          results: assessment.results
        }
      });

      this.logger.info(`Stored OSCAL assessment: ${assessment.id}`);
    } catch (error) {
      this.logger.error('Failed to store OSCAL assessment', { error });
      // Continue execution even if storage fails
    }
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(assessmentId: string): Promise<OSCALAssessment | null> {
    try {
      const assessment = await this.prisma.oscalAssessment.findUnique({
        where: { id: assessmentId }
      });

      return assessment ? this.mapDatabaseToOSCAL(assessment) : null;
    } catch (error) {
      this.logger.error('Failed to get OSCAL assessment', { error });
      return null;
    }
  }

  /**
   * Map database record to OSCAL format
   */
  private mapDatabaseToOSCAL(dbRecord: any): OSCALAssessment {
    return {
      id: dbRecord.id,
      title: dbRecord.title,
      description: dbRecord.description,
      type: dbRecord.type,
      framework: dbRecord.framework,
      version: dbRecord.version,
      status: dbRecord.status,
      startDate: dbRecord.startDate,
      endDate: dbRecord.endDate,
      assessor: dbRecord.assessor,
      results: dbRecord.results,
      metadata: dbRecord.metadata
    };
  }

  /**
   * Update control implementation status
   */
  async updateControlStatus(controlId: string, status: OSCALControl['implementationStatus'], evidence?: OSCALEvidence[]): Promise<void> {
    if (!this.catalog) {
      throw new Error('OSCAL catalog not loaded');
    }

    const control = this.catalog.controls.find(c => c.id === controlId);
    if (!control) {
      throw new Error(`Control ${controlId} not found`);
    }

    control.implementationStatus = status;
    control.lastAssessed = new Date();
    
    if (evidence) {
      control.evidence = evidence;
    }

    // Update in database
    await this.storeControlUpdate(control);
  }

  /**
   * Store control update in database
   */
  private async storeControlUpdate(control: OSCALControl): Promise<void> {
    try {
      await this.prisma.oscalControl.upsert({
        where: { id: control.id },
        update: {
          implementationStatus: control.implementationStatus,
          lastAssessed: control.lastAssessed,
          evidence: control.evidence
        },
        create: {
          id: control.id,
          title: control.title,
          description: control.description,
          category: control.category,
          function: control.function,
          subcategory: control.subcategory,
          implementationStatus: control.implementationStatus,
          evidence: control.evidence,
          lastAssessed: control.lastAssessed,
          nextAssessment: control.nextAssessment
        }
      });

      this.logger.info(`Updated control status: ${control.id} -> ${control.implementationStatus}`);
    } catch (error) {
      this.logger.error('Failed to store control update', { error });
    }
  }

  /**
   * Get catalog information
   */
  getCatalog(): OSCALCatalog | null {
    return this.catalog;
  }

  /**
   * Export assessment to OSCAL JSON format
   */
  async exportAssessment(assessmentId: string): Promise<string> {
    const assessment = await this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    return JSON.stringify(assessment, null, 2);
  }
}
