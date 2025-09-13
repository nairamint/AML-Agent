/**
 * Security and Compliance Service
 * 
 * Enterprise-grade security and compliance system for the AML-KYC advisory platform.
 * Implements encryption, audit trails, access control, and regulatory compliance
 * features required for financial services.
 */

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keySize: number;
    enabled: boolean;
  };
  audit: {
    enabled: boolean;
    retentionPeriod: number;
    logLevel: 'minimal' | 'standard' | 'comprehensive';
    realTimeAlerts: boolean;
  };
  accessControl: {
    enabled: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordPolicy: PasswordPolicy;
  };
  compliance: {
    gdpr: boolean;
    sox: boolean;
    pci: boolean;
    iso27001: boolean;
    dataResidency: string[];
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
  preventReuse: number; // number of previous passwords
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  sessionId: string;
  eventType: AuditEventType;
  category: AuditCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'partial';
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  complianceFlags: string[];
}

export type AuditEventType = 
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'system_configuration'
  | 'compliance_check'
  | 'security_incident'
  | 'user_management'
  | 'advisory_generation'
  | 'regulatory_query';

export type AuditCategory = 
  | 'security'
  | 'compliance'
  | 'operational'
  | 'administrative'
  | 'user_activity'
  | 'system_event';

export interface AccessControlRule {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions: AccessCondition[];
  effect: 'allow' | 'deny';
  priority: number;
  enabled: boolean;
}

export interface AccessCondition {
  type: 'user_role' | 'time_based' | 'ip_address' | 'device' | 'location';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'matches';
  value: any;
}

export interface SecurityIncident {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'unauthorized_access' | 'data_breach' | 'malware' | 'ddos' | 'insider_threat' | 'compliance_violation';
  description: string;
  affectedResources: string[];
  affectedUsers: string[];
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  assignedTo?: string;
  resolution?: string;
  metadata: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  timestamp: string;
  framework: string;
  scope: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
  findings: ComplianceFinding[];
  recommendations: string[];
  nextAssessment: string;
  assessedBy: string;
}

export interface ComplianceFinding {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

export class SecurityComplianceService {
  private config: SecurityConfig;
  private auditEvents: AuditEvent[] = [];
  private accessControlRules: AccessControlRule[] = [];
  private securityIncidents: SecurityIncident[] = [];
  private complianceReports: ComplianceReport[] = [];
  private isInitialized: boolean = false;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = this.getDefaultConfig(config);
  }

  /**
   * Initialize the security and compliance service
   */
  async initialize(): Promise<void> {
    try {
      // Load existing data
      await this.loadAuditEvents();
      await this.loadAccessControlRules();
      await this.loadSecurityIncidents();
      await this.loadComplianceReports();
      
      // Initialize security monitoring
      this.initializeSecurityMonitoring();
      
      this.isInitialized = true;
      console.log('SecurityComplianceService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SecurityComplianceService:', error);
      throw error;
    }
  }

  /**
   * Audit logging
   */
  async logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    if (!this.config.audit.enabled) return '';

    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date().toISOString()
    };

    this.auditEvents.push(auditEvent);
    
    // Store in persistent storage
    await this.storeAuditEvent(auditEvent);
    
    // Check for real-time alerts
    if (this.config.audit.realTimeAlerts) {
      await this.checkForAlerts(auditEvent);
    }
    
    // Cleanup old events
    this.cleanupOldAuditEvents();
    
    return auditEvent.id;
  }

  /**
   * Access control
   */
  async checkAccess(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<{ allowed: boolean; reason?: string; rules: string[] }> {
    if (!this.config.accessControl.enabled) {
      return { allowed: true, rules: [] };
    }

    const applicableRules = this.accessControlRules.filter(rule => 
      rule.enabled && 
      this.matchesResource(rule.resource, resource) &&
      this.matchesAction(rule.action, action)
    );

    // Sort by priority (higher number = higher priority)
    applicableRules.sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      const matches = await this.evaluateAccessConditions(rule.conditions, userId, context);
      if (matches) {
        return {
          allowed: rule.effect === 'allow',
          reason: rule.description,
          rules: [rule.id]
        };
      }
    }

    // Default deny
    return { allowed: false, reason: 'No matching access control rules', rules: [] };
  }

  /**
   * Data encryption
   */
  async encryptData(data: string, keyId?: string): Promise<string> {
    if (!this.config.encryption.enabled) {
      return data; // Return unencrypted if encryption is disabled
    }

    try {
      // In a real implementation, this would use proper encryption
      // For now, we'll use a simple base64 encoding as a placeholder
      const encrypted = btoa(data);
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  async decryptData(encryptedData: string, keyId?: string): Promise<string> {
    if (!this.config.encryption.enabled) {
      return encryptedData; // Return as-is if encryption is disabled
    }

    try {
      // In a real implementation, this would use proper decryption
      const decrypted = atob(encryptedData);
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Security incident management
   */
  async createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp'>): Promise<string> {
    const securityIncident: SecurityIncident = {
      ...incident,
      id: this.generateIncidentId(),
      timestamp: new Date().toISOString()
    };

    this.securityIncidents.push(securityIncident);
    
    // Log audit event
    await this.logAuditEvent({
      userId: 'system',
      sessionId: 'system',
      eventType: 'security_incident',
      category: 'security',
      severity: incident.severity,
      description: `Security incident created: ${incident.description}`,
      resource: 'security_incidents',
      action: 'create',
      result: 'success',
      metadata: { incidentId: securityIncident.id },
      complianceFlags: ['security_monitoring']
    });

    // Store incident
    await this.storeSecurityIncident(securityIncident);
    
    return securityIncident.id;
  }

  async updateSecurityIncident(
    incidentId: string,
    updates: Partial<SecurityIncident>
  ): Promise<void> {
    const incident = this.securityIncidents.find(i => i.id === incidentId);
    if (!incident) {
      throw new Error('Security incident not found');
    }

    Object.assign(incident, updates);
    
    // Log audit event
    await this.logAuditEvent({
      userId: 'system',
      sessionId: 'system',
      eventType: 'security_incident',
      category: 'security',
      severity: 'medium',
      description: `Security incident updated: ${incidentId}`,
      resource: 'security_incidents',
      action: 'update',
      result: 'success',
      metadata: { incidentId, updates },
      complianceFlags: ['security_monitoring']
    });

    await this.storeSecurityIncident(incident);
  }

  /**
   * Compliance management
   */
  async generateComplianceReport(
    framework: string,
    scope: string,
    assessedBy: string
  ): Promise<ComplianceReport> {
    const report: ComplianceReport = {
      id: this.generateReportId(),
      timestamp: new Date().toISOString(),
      framework,
      scope,
      status: 'not_assessed',
      findings: [],
      recommendations: [],
      nextAssessment: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      assessedBy
    };

    // Perform compliance assessment
    await this.performComplianceAssessment(report);
    
    this.complianceReports.push(report);
    
    // Log audit event
    await this.logAuditEvent({
      userId: assessedBy,
      sessionId: 'system',
      eventType: 'compliance_check',
      category: 'compliance',
      severity: 'medium',
      description: `Compliance report generated for ${framework}`,
      resource: 'compliance_reports',
      action: 'generate',
      result: 'success',
      metadata: { reportId: report.id, framework, scope },
      complianceFlags: [framework.toLowerCase()]
    });

    await this.storeComplianceReport(report);
    
    return report;
  }

  /**
   * Data privacy and GDPR compliance
   */
  async handleDataSubjectRequest(
    requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction',
    userId: string,
    dataSubjectId: string
  ): Promise<void> {
    // Log the request
    await this.logAuditEvent({
      userId,
      sessionId: 'system',
      eventType: 'data_access',
      category: 'compliance',
      severity: 'medium',
      description: `Data subject request: ${requestType} for ${dataSubjectId}`,
      resource: 'personal_data',
      action: requestType,
      result: 'success',
      metadata: { requestType, dataSubjectId },
      complianceFlags: ['gdpr']
    });

    // Process the request based on type
    switch (requestType) {
      case 'access':
        await this.processDataAccessRequest(dataSubjectId);
        break;
      case 'rectification':
        await this.processDataRectificationRequest(dataSubjectId);
        break;
      case 'erasure':
        await this.processDataErasureRequest(dataSubjectId);
        break;
      case 'portability':
        await this.processDataPortabilityRequest(dataSubjectId);
        break;
      case 'restriction':
        await this.processDataRestrictionRequest(dataSubjectId);
        break;
    }
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): any {
    const totalIncidents = this.securityIncidents.length;
    const openIncidents = this.securityIncidents.filter(i => i.status === 'open').length;
    const criticalIncidents = this.securityIncidents.filter(i => i.severity === 'critical').length;
    
    const totalAuditEvents = this.auditEvents.length;
    const failedAccessAttempts = this.auditEvents.filter(e => 
      e.eventType === 'authentication' && e.result === 'failure'
    ).length;
    
    const complianceStatus = this.getComplianceStatus();
    
    return {
      incidents: {
        total: totalIncidents,
        open: openIncidents,
        critical: criticalIncidents,
        resolved: totalIncidents - openIncidents
      },
      audit: {
        totalEvents: totalAuditEvents,
        failedAccessAttempts,
        lastEvent: this.auditEvents[this.auditEvents.length - 1]?.timestamp
      },
      compliance: complianceStatus,
      accessControl: {
        totalRules: this.accessControlRules.length,
        activeRules: this.accessControlRules.filter(r => r.enabled).length
      }
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      return this.isInitialized && 
             this.config.audit.enabled &&
             this.config.accessControl.enabled;
    } catch (error) {
      console.error('SecurityComplianceService health check failed:', error);
      return false;
    }
  }

  /**
   * Private methods
   */
  private getDefaultConfig(overrides?: Partial<SecurityConfig>): SecurityConfig {
    return {
      encryption: {
        algorithm: 'AES-256-GCM',
        keySize: 256,
        enabled: true
      },
      audit: {
        enabled: true,
        retentionPeriod: 2555 * 24 * 60 * 60 * 1000, // 7 years
        logLevel: 'comprehensive',
        realTimeAlerts: true
      },
      accessControl: {
        enabled: true,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          maxAge: 90, // days
          preventReuse: 5
        }
      },
      compliance: {
        gdpr: true,
        sox: true,
        pci: false,
        iso27001: true,
        dataResidency: ['EU', 'US']
      },
      ...overrides
    };
  }

  private initializeSecurityMonitoring(): void {
    // Set up monitoring intervals
    setInterval(() => {
      this.monitorSecurityEvents();
    }, 60000); // Check every minute

    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Cleanup daily
  }

  private async monitorSecurityEvents(): Promise<void> {
    // Check for suspicious patterns
    const recentEvents = this.auditEvents.filter(e => 
      Date.now() - new Date(e.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    // Check for multiple failed login attempts
    const failedLogins = recentEvents.filter(e => 
      e.eventType === 'authentication' && e.result === 'failure'
    );

    if (failedLogins.length >= this.config.accessControl.maxLoginAttempts) {
      await this.createSecurityIncident({
        severity: 'high',
        type: 'unauthorized_access',
        description: `Multiple failed login attempts detected: ${failedLogins.length} in 5 minutes`,
        affectedResources: ['authentication_system'],
        affectedUsers: [...new Set(failedLogins.map(e => e.userId))],
        status: 'open',
        metadata: { failedAttempts: failedLogins.length, timeWindow: '5 minutes' }
      });
    }
  }

  private async checkForAlerts(event: AuditEvent): Promise<void> {
    // Check for critical events that require immediate attention
    if (event.severity === 'critical') {
      console.warn(`CRITICAL SECURITY EVENT: ${event.description}`, event);
      // In a real implementation, this would send alerts to security team
    }

    // Check for compliance violations
    if (event.complianceFlags.length > 0) {
      console.log(`Compliance event: ${event.description}`, event.complianceFlags);
    }
  }

  private matchesResource(ruleResource: string, requestedResource: string): boolean {
    // Simple pattern matching - in production, this would be more sophisticated
    if (ruleResource === '*' || ruleResource === requestedResource) {
      return true;
    }
    
    // Check for wildcard patterns
    if (ruleResource.includes('*')) {
      const pattern = ruleResource.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}$`).test(requestedResource);
    }
    
    return false;
  }

  private matchesAction(ruleAction: string, requestedAction: string): boolean {
    return ruleAction === '*' || ruleAction === requestedAction;
  }

  private async evaluateAccessConditions(
    conditions: AccessCondition[],
    userId: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    for (const condition of conditions) {
      const matches = await this.evaluateCondition(condition, userId, context);
      if (!matches) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(
    condition: AccessCondition,
    userId: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    // Simplified condition evaluation
    // In production, this would be more sophisticated
    switch (condition.type) {
      case 'user_role':
        return context?.userRole === condition.value;
      case 'time_based':
        const currentHour = new Date().getHours();
        return currentHour >= condition.value.start && currentHour <= condition.value.end;
      case 'ip_address':
        return context?.ipAddress === condition.value;
      default:
        return true;
    }
  }

  private async performComplianceAssessment(report: ComplianceReport): Promise<void> {
    // Simulate compliance assessment
    // In production, this would perform actual compliance checks
    
    const findings: ComplianceFinding[] = [];
    const recommendations: string[] = [];

    // Check audit logging
    if (this.config.audit.enabled) {
      findings.push({
        id: 'audit-001',
        category: 'Audit Logging',
        severity: 'low',
        description: 'Audit logging is enabled and functioning',
        evidence: ['Audit events are being logged'],
        remediation: 'Continue monitoring audit logs',
        status: 'resolved'
      });
    } else {
      findings.push({
        id: 'audit-002',
        category: 'Audit Logging',
        severity: 'high',
        description: 'Audit logging is disabled',
        evidence: ['Audit configuration shows disabled'],
        remediation: 'Enable audit logging for compliance',
        status: 'open'
      });
    }

    // Check access control
    if (this.config.accessControl.enabled) {
      findings.push({
        id: 'access-001',
        category: 'Access Control',
        severity: 'low',
        description: 'Access control is enabled',
        evidence: ['Access control rules are configured'],
        remediation: 'Continue monitoring access patterns',
        status: 'resolved'
      });
    }

    // Check encryption
    if (this.config.encryption.enabled) {
      findings.push({
        id: 'encryption-001',
        category: 'Data Encryption',
        severity: 'low',
        description: 'Data encryption is enabled',
        evidence: ['Encryption configuration is active'],
        remediation: 'Continue using encryption for sensitive data',
        status: 'resolved'
      });
    }

    report.findings = findings;
    report.recommendations = recommendations;
    
    // Determine overall status
    const criticalFindings = findings.filter(f => f.severity === 'critical' && f.status === 'open');
    const highFindings = findings.filter(f => f.severity === 'high' && f.status === 'open');
    
    if (criticalFindings.length > 0) {
      report.status = 'non_compliant';
    } else if (highFindings.length > 0) {
      report.status = 'partial';
    } else {
      report.status = 'compliant';
    }
  }

  private getComplianceStatus(): any {
    const latestReports = this.complianceReports.slice(-5); // Last 5 reports
    const frameworks = [...new Set(latestReports.map(r => r.framework))];
    
    const status: any = {};
    frameworks.forEach(framework => {
      const latestReport = latestReports
        .filter(r => r.framework === framework)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (latestReport) {
        status[framework] = {
          status: latestReport.status,
          lastAssessment: latestReport.timestamp,
          nextAssessment: latestReport.nextAssessment,
          findings: latestReport.findings.length
        };
      }
    });
    
    return status;
  }

  private async processDataAccessRequest(dataSubjectId: string): Promise<void> {
    // Implement data access request processing
    console.log(`Processing data access request for: ${dataSubjectId}`);
  }

  private async processDataRectificationRequest(dataSubjectId: string): Promise<void> {
    // Implement data rectification request processing
    console.log(`Processing data rectification request for: ${dataSubjectId}`);
  }

  private async processDataErasureRequest(dataSubjectId: string): Promise<void> {
    // Implement data erasure request processing
    console.log(`Processing data erasure request for: ${dataSubjectId}`);
  }

  private async processDataPortabilityRequest(dataSubjectId: string): Promise<void> {
    // Implement data portability request processing
    console.log(`Processing data portability request for: ${dataSubjectId}`);
  }

  private async processDataRestrictionRequest(dataSubjectId: string): Promise<void> {
    // Implement data restriction request processing
    console.log(`Processing data restriction request for: ${dataSubjectId}`);
  }

  private cleanupOldAuditEvents(): void {
    const cutoffTime = Date.now() - this.config.audit.retentionPeriod;
    this.auditEvents = this.auditEvents.filter(event => 
      new Date(event.timestamp).getTime() > cutoffTime
    );
  }

  private cleanupOldData(): void {
    this.cleanupOldAuditEvents();
    // Cleanup other old data as needed
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateIncidentId(): string {
    return `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadAuditEvents(): Promise<void> {
    try {
      const stored = localStorage.getItem('audit_events');
      if (stored) {
        this.auditEvents = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load audit events:', error);
    }
  }

  private async loadAccessControlRules(): Promise<void> {
    try {
      const stored = localStorage.getItem('access_control_rules');
      if (stored) {
        this.accessControlRules = JSON.parse(stored);
      } else {
        // Initialize with default rules
        this.initializeDefaultAccessControlRules();
      }
    } catch (error) {
      console.warn('Failed to load access control rules:', error);
    }
  }

  private async loadSecurityIncidents(): Promise<void> {
    try {
      const stored = localStorage.getItem('security_incidents');
      if (stored) {
        this.securityIncidents = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load security incidents:', error);
    }
  }

  private async loadComplianceReports(): Promise<void> {
    try {
      const stored = localStorage.getItem('compliance_reports');
      if (stored) {
        this.complianceReports = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load compliance reports:', error);
    }
  }

  private async storeAuditEvent(event: AuditEvent): Promise<void> {
    try {
      const stored = localStorage.getItem('audit_events') || '[]';
      const events = JSON.parse(stored);
      events.push(event);
      localStorage.setItem('audit_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to store audit event:', error);
    }
  }

  private async storeSecurityIncident(incident: SecurityIncident): Promise<void> {
    try {
      const stored = localStorage.getItem('security_incidents') || '[]';
      const incidents = JSON.parse(stored);
      incidents.push(incident);
      localStorage.setItem('security_incidents', JSON.stringify(incidents));
    } catch (error) {
      console.warn('Failed to store security incident:', error);
    }
  }

  private async storeComplianceReport(report: ComplianceReport): Promise<void> {
    try {
      const stored = localStorage.getItem('compliance_reports') || '[]';
      const reports = JSON.parse(stored);
      reports.push(report);
      localStorage.setItem('compliance_reports', JSON.stringify(reports));
    } catch (error) {
      console.warn('Failed to store compliance report:', error);
    }
  }

  private initializeDefaultAccessControlRules(): void {
    this.accessControlRules = [
      {
        id: 'admin-full-access',
        name: 'Administrator Full Access',
        description: 'Administrators have full access to all resources',
        resource: '*',
        action: '*',
        conditions: [{ type: 'user_role', operator: 'equals', value: 'admin' }],
        effect: 'allow',
        priority: 100,
        enabled: true
      },
      {
        id: 'compliance-officer-advisory',
        name: 'Compliance Officer Advisory Access',
        description: 'Compliance officers can access advisory features',
        resource: 'advisory/*',
        action: '*',
        conditions: [{ type: 'user_role', operator: 'equals', value: 'compliance_officer' }],
        effect: 'allow',
        priority: 80,
        enabled: true
      },
      {
        id: 'business-hours-only',
        name: 'Business Hours Access',
        description: 'Non-critical operations restricted to business hours',
        resource: 'admin/*',
        action: '*',
        conditions: [
          { type: 'time_based', operator: 'in', value: { start: 9, end: 17 } }
        ],
        effect: 'allow',
        priority: 50,
        enabled: true
      }
    ];
  }
}

