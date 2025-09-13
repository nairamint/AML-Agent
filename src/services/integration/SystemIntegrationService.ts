/**
 * System Integration Service
 * 
 * Central integration service that orchestrates all system components,
 * manages service dependencies, and provides a unified interface for
 * the AML-KYC advisory system.
 */

import { MultiAgentOrchestrator } from '../agents/MultiAgentOrchestrator';
import { ContextManagementService } from '../context/ContextManagementService';
import { BackendApiService } from '../api/BackendApiService';
import { ErrorHandlingService } from '../error/ErrorHandlingService';
import { PerformanceOptimizationService } from '../performance/PerformanceOptimizationService';
import { SecurityComplianceService } from '../security/SecurityComplianceService';

export interface SystemConfig {
  services: {
    multiAgent: boolean;
    contextManagement: boolean;
    backendApi: boolean;
    errorHandling: boolean;
    performanceOptimization: boolean;
    securityCompliance: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  performance: {
    cacheEnabled: boolean;
    batchProcessingEnabled: boolean;
    monitoringEnabled: boolean;
  };
  security: {
    auditEnabled: boolean;
    accessControlEnabled: boolean;
    encryptionEnabled: boolean;
  };
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    multiAgent: ServiceStatus;
    contextManagement: ServiceStatus;
    backendApi: ServiceStatus;
    errorHandling: ServiceStatus;
    performanceOptimization: ServiceStatus;
    securityCompliance: ServiceStatus;
  };
  metrics: SystemMetrics;
  lastHealthCheck: string;
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: string;
  error?: string;
  uptime: number;
  version: string;
}

export interface SystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeUsers: number;
  systemLoad: number;
  memoryUsage: number;
  errorRate: number;
}

export interface IntegrationEvent {
  id: string;
  timestamp: string;
  type: 'service_started' | 'service_stopped' | 'service_error' | 'health_check' | 'configuration_changed';
  service: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metadata: Record<string, any>;
}

export class SystemIntegrationService {
  private config: SystemConfig;
  private services: Map<string, any> = new Map();
  private isInitialized: boolean = false;
  private startTime: number = Date.now();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private integrationEvents: IntegrationEvent[] = [];

  constructor(config?: Partial<SystemConfig>) {
    this.config = this.getDefaultConfig(config);
  }

  /**
   * Initialize the entire system
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing AML-KYC Advisory System...');
      
      // Initialize services in dependency order
      await this.initializeServices();
      
      // Set up health monitoring
      this.startHealthMonitoring();
      
      // Set up event logging
      this.logIntegrationEvent('system_started', 'system', 'System initialization completed successfully', 'info');
      
      this.isInitialized = true;
      console.log('AML-KYC Advisory System initialized successfully');
    } catch (error) {
      console.error('System initialization failed:', error);
      this.logIntegrationEvent('system_error', 'system', `System initialization failed: ${error}`, 'critical');
      throw error;
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    const serviceStatuses = await this.checkAllServices();
    const metrics = await this.getSystemMetrics();
    
    // Determine overall system health
    const unhealthyServices = Object.values(serviceStatuses).filter(s => s.status === 'unhealthy');
    const degradedServices = Object.values(serviceStatuses).filter(s => s.status === 'degraded');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyServices.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      overall: overallStatus,
      services: serviceStatuses,
      metrics,
      lastHealthCheck: new Date().toISOString()
    };
  }

  /**
   * Process advisory query through the integrated system
   */
  async processAdvisoryQuery(
    query: string,
    userId: string,
    sessionId: string,
    context?: any
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Log the request
      await this.logAuditEvent('advisory_query', userId, sessionId, {
        query: query.substring(0, 100), // Log first 100 chars
        timestamp: new Date().toISOString()
      });

      // Get or create conversation context
      const contextManager = this.services.get('contextManagement') as ContextManagementService;
      let conversationContext = contextManager.getCurrentContext();
      
      if (!conversationContext) {
        conversationContext = await contextManager.createContext(userId, sessionId);
      }

      // Optimize query for performance
      const performanceService = this.services.get('performanceOptimization') as PerformanceOptimizationService;
      const { optimizedQuery, cacheKey } = performanceService.optimizeQuery(query, context);

      // Check cache first
      const cachedResponse = await performanceService.get(cacheKey);
      if (cachedResponse) {
        console.log('Returning cached response');
        return cachedResponse;
      }

      // Process through multi-agent orchestrator
      const orchestrator = this.services.get('multiAgent') as MultiAgentOrchestrator;
      const result = await orchestrator.processQuery({
        query: optimizedQuery,
        conversationHistory: contextManager.getConversationHistory(10).map(turn => ({
          id: turn.id,
          query: turn.query,
          response: {
            id: turn.response.id,
            agentType: 'advisory_generator' as any,
            content: turn.response.content,
            confidence: turn.response.confidence,
            reasoning: '',
            evidence: turn.response.evidence,
            assumptions: [],
            limitations: [],
            followUpSuggestions: turn.response.followUpSuggestions,
            processingTime: turn.response.processingTime,
            timestamp: turn.timestamp
          },
          timestamp: turn.timestamp,
          context: turn.context
        })),
        jurisdiction: conversationContext.jurisdiction,
        complianceFrameworks: conversationContext.complianceFrameworks,
        riskTolerance: conversationContext.riskTolerance,
        userRole: conversationContext.userRole,
        timestamp: new Date().toISOString()
      });

      // Cache the response
      await performanceService.set(cacheKey, result, 300000); // 5 minutes

      // Add to conversation history
      await contextManager.addConversationTurn(query, {
        id: result.finalResponse.id,
        content: result.finalResponse.content,
        confidence: result.finalResponse.confidence,
        evidence: result.finalResponse.evidence,
        recommendations: [], // TODO: Extract from agent response
        followUpSuggestions: result.finalResponse.followUpSuggestions,
        processingTime: result.processingTime,
        agentContributions: Object.entries(result.agentContributions).map(([agentType, response]) => ({
          agentType,
          confidence: response.confidence,
          processingTime: response.processingTime,
          evidenceCount: response.evidence.length,
          contribution: response.content.substring(0, 200) + '...'
        }))
      });

      // Log successful completion
      await this.logAuditEvent('advisory_completed', userId, sessionId, {
        queryId: result.finalResponse.id,
        processingTime: Date.now() - startTime,
        confidence: result.finalResponse.confidence,
        evidenceCount: result.finalResponse.evidence.length
      });

      return result;

    } catch (error) {
      // Handle error through error handling service
      const errorService = this.services.get('errorHandling') as ErrorHandlingService;
      await errorService.handleError(error as Error, {
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
        component: 'system_integration',
        operation: 'process_advisory_query',
        severity: 'high',
        category: 'system'
      });

      // Log error
      await this.logAuditEvent('advisory_error', userId, sessionId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Get system configuration
   */
  getConfiguration(): SystemConfig {
    return { ...this.config };
  }

  /**
   * Update system configuration
   */
  async updateConfiguration(updates: Partial<SystemConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };
    
    // Log configuration change
    this.logIntegrationEvent('configuration_changed', 'system', 'System configuration updated', 'info', {
      changes: Object.keys(updates),
      timestamp: new Date().toISOString()
    });

    // Restart affected services if needed
    await this.handleConfigurationChange(oldConfig, this.config);
  }

  /**
   * Get integration events
   */
  getIntegrationEvents(limit?: number): IntegrationEvent[] {
    const events = this.integrationEvents.slice(-(limit || 100));
    return events.reverse(); // Most recent first
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const status = await this.getSystemStatus();
      return status.overall === 'healthy' || status.overall === 'degraded';
    } catch (error) {
      console.error('System health check failed:', error);
      return false;
    }
  }

  /**
   * Shutdown the system
   */
  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down AML-KYC Advisory System...');
      
      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Shutdown services in reverse order
      await this.shutdownServices();
      
      // Log shutdown
      this.logIntegrationEvent('system_stopped', 'system', 'System shutdown completed', 'info');
      
      this.isInitialized = false;
      console.log('AML-KYC Advisory System shutdown completed');
    } catch (error) {
      console.error('System shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Private methods
   */
  private getDefaultConfig(overrides?: Partial<SystemConfig>): SystemConfig {
    return {
      services: {
        multiAgent: true,
        contextManagement: true,
        backendApi: true,
        errorHandling: true,
        performanceOptimization: true,
        securityCompliance: true
      },
      api: {
        baseUrl: 'https://api.aml-kyc-advisory.com',
        timeout: 30000,
        retryAttempts: 3
      },
      performance: {
        cacheEnabled: true,
        batchProcessingEnabled: true,
        monitoringEnabled: true
      },
      security: {
        auditEnabled: true,
        accessControlEnabled: true,
        encryptionEnabled: true
      },
      ...overrides
    };
  }

  private async initializeServices(): Promise<void> {
    const serviceInitializers = [
      { name: 'errorHandling', service: new ErrorHandlingService(), required: true },
      { name: 'securityCompliance', service: new SecurityComplianceService(), required: true },
      { name: 'performanceOptimization', service: new PerformanceOptimizationService(), required: true },
      { name: 'contextManagement', service: new ContextManagementService(), required: true },
      { name: 'multiAgent', service: new MultiAgentOrchestrator(), required: true },
      { name: 'backendApi', service: new BackendApiService({
        baseUrl: this.config.api.baseUrl,
        timeout: this.config.api.timeout,
        retryAttempts: this.config.api.retryAttempts,
        rateLimitPerMinute: 100
      }), required: false }
    ];

    for (const { name, service, required } of serviceInitializers) {
      try {
        if (this.config.services[name as keyof typeof this.config.services]) {
          console.log(`Initializing ${name} service...`);
          await service.initialize();
          this.services.set(name, service);
          this.logIntegrationEvent('service_started', name, `${name} service initialized successfully`, 'info');
        }
      } catch (error) {
        const errorMessage = `Failed to initialize ${name} service: ${error}`;
        console.error(errorMessage);
        this.logIntegrationEvent('service_error', name, errorMessage, required ? 'critical' : 'warning');
        
        if (required) {
          throw new Error(errorMessage);
        }
      }
    }
  }

  private async shutdownServices(): Promise<void> {
    const serviceNames = Array.from(this.services.keys()).reverse(); // Shutdown in reverse order
    
    for (const serviceName of serviceNames) {
      try {
        const service = this.services.get(serviceName);
        if (service && typeof service.cleanup === 'function') {
          console.log(`Shutting down ${serviceName} service...`);
          await service.cleanup();
          this.logIntegrationEvent('service_stopped', serviceName, `${serviceName} service stopped`, 'info');
        }
      } catch (error) {
        console.error(`Error shutting down ${serviceName} service:`, error);
        this.logIntegrationEvent('service_error', serviceName, `Error during shutdown: ${error}`, 'warning');
      }
    }
    
    this.services.clear();
  }

  private async checkAllServices(): Promise<SystemStatus['services']> {
    const serviceStatuses: SystemStatus['services'] = {
      multiAgent: { status: 'unknown', lastCheck: '', uptime: 0, version: '1.0.0' },
      contextManagement: { status: 'unknown', lastCheck: '', uptime: 0, version: '1.0.0' },
      backendApi: { status: 'unknown', lastCheck: '', uptime: 0, version: '1.0.0' },
      errorHandling: { status: 'unknown', lastCheck: '', uptime: 0, version: '1.0.0' },
      performanceOptimization: { status: 'unknown', lastCheck: '', uptime: 0, version: '1.0.0' },
      securityCompliance: { status: 'unknown', lastCheck: '', uptime: 0, version: '1.0.0' }
    };

    for (const [serviceName, service] of this.services.entries()) {
      try {
        const isHealthy = await service.healthCheck();
        const uptime = Date.now() - this.startTime;
        
        serviceStatuses[serviceName as keyof typeof serviceStatuses] = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString(),
          uptime,
          version: '1.0.0'
        };
      } catch (error) {
        serviceStatuses[serviceName as keyof typeof serviceStatuses] = {
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          uptime: 0,
          version: '1.0.0',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return serviceStatuses;
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    // In a real implementation, these would be collected from actual system metrics
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      activeUsers: 0,
      systemLoad: 0,
      memoryUsage: 0,
      errorRate: 0
    };
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const status = await this.getSystemStatus();
        this.logIntegrationEvent('health_check', 'system', `Health check completed: ${status.overall}`, 'info', {
          overallStatus: status.overall,
          unhealthyServices: Object.entries(status.services).filter(([_, s]) => s.status === 'unhealthy').map(([name, _]) => name)
        });
      } catch (error) {
        this.logIntegrationEvent('health_check', 'system', `Health check failed: ${error}`, 'error');
      }
    }, 60000); // Check every minute
  }

  private async handleConfigurationChange(oldConfig: SystemConfig, newConfig: SystemConfig): Promise<void> {
    // Handle service-specific configuration changes
    if (oldConfig.performance.cacheEnabled !== newConfig.performance.cacheEnabled) {
      const performanceService = this.services.get('performanceOptimization') as PerformanceOptimizationService;
      if (performanceService) {
        // Update cache configuration
        console.log('Updating cache configuration...');
      }
    }

    if (oldConfig.security.auditEnabled !== newConfig.security.auditEnabled) {
      const securityService = this.services.get('securityCompliance') as SecurityComplianceService;
      if (securityService) {
        // Update audit configuration
        console.log('Updating audit configuration...');
      }
    }
  }

  private logIntegrationEvent(
    type: IntegrationEvent['type'],
    service: string,
    message: string,
    severity: IntegrationEvent['severity'],
    metadata: Record<string, any> = {}
  ): void {
    const event: IntegrationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      service,
      message,
      severity,
      metadata
    };

    this.integrationEvents.push(event);
    
    // Keep only last 1000 events
    if (this.integrationEvents.length > 1000) {
      this.integrationEvents = this.integrationEvents.slice(-1000);
    }

    // Log to console based on severity
    switch (severity) {
      case 'critical':
      case 'error':
        console.error(`[${service}] ${message}`, metadata);
        break;
      case 'warning':
        console.warn(`[${service}] ${message}`, metadata);
        break;
      default:
        console.log(`[${service}] ${message}`, metadata);
    }
  }

  private async logAuditEvent(
    eventType: string,
    userId: string,
    sessionId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const securityService = this.services.get('securityCompliance') as SecurityComplianceService;
    if (securityService) {
      await securityService.logAuditEvent({
        userId,
        sessionId,
        eventType: eventType as any,
        category: 'operational',
        severity: 'medium',
        description: `Advisory system event: ${eventType}`,
        resource: 'advisory_system',
        action: eventType,
        result: 'success',
        metadata,
        complianceFlags: ['operational_monitoring']
      });
    }
  }
}

