/**
 * Enterprise Monitoring API Routes
 * Production-ready endpoints for comprehensive monitoring
 */

import { Router, Request, Response } from 'express';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { ProductionEnterpriseMonitoringService, MonitoringConfig } from '../services/monitoring/ProductionEnterpriseMonitoringService';

export class MonitoringRoutes {
  private router: Router;
  private monitoringService: ProductionEnterpriseMonitoringService;
  private logger: Logger;
  private prisma: PrismaClient;

  constructor(logger: Logger, prisma: PrismaClient) {
    this.router = Router();
    this.logger = logger;
    this.prisma = prisma;
    
    // Initialize monitoring service
    const config: MonitoringConfig = {
      prometheus: {
        endpoint: process.env.PROMETHEUS_ENDPOINT || 'http://localhost:9090',
        apiKey: process.env.PROMETHEUS_API_KEY
      },
      grafana: {
        url: process.env.GRAFANA_URL || 'http://localhost:3000',
        apiKey: process.env.GRAFANA_API_KEY || 'admin:admin'
      },
      elasticsearch: {
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      },
      jaeger: {
        endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:16686',
        serviceName: 'aml-kyc-agent',
        samplingRate: 0.1
      }
    };
    
    this.monitoringService = new ProductionEnterpriseMonitoringService(config, logger, prisma);
    
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Initialize monitoring service
    this.router.use(async (req, res, next) => {
      try {
        await this.monitoringService.initialize();
        next();
      } catch (error) {
        this.logger.error('Failed to initialize monitoring service', { error });
        res.status(500).json({ error: 'Monitoring service initialization failed' });
      }
    });

    // Health and Status Routes
    this.router.get('/health', this.getHealth.bind(this));
    this.router.get('/status', this.getStatus.bind(this));

    // Metrics Routes
    this.router.get('/metrics', this.getMetrics.bind(this));
    this.router.post('/metrics/collect', this.collectMetrics.bind(this));
    this.router.get('/metrics/prometheus', this.getPrometheusMetrics.bind(this));
    this.router.get('/metrics/business', this.getBusinessMetrics.bind(this));
    this.router.get('/metrics/system', this.getSystemMetrics.bind(this));
    this.router.get('/metrics/security', this.getSecurityMetrics.bind(this));
    this.router.get('/metrics/compliance', this.getComplianceMetrics.bind(this));

    // Alerting Routes
    this.router.get('/alerts', this.getAlerts.bind(this));
    this.router.post('/alerts/generate', this.generateAlerts.bind(this));
    this.router.get('/alerts/rules', this.getAlertRules.bind(this));

    // Dashboard Routes
    this.router.get('/dashboards', this.getDashboards.bind(this));
    this.router.post('/dashboards/create', this.createDashboards.bind(this));
    this.router.get('/dashboards/executive', this.getExecutiveDashboard.bind(this));
    this.router.get('/dashboards/technical', this.getTechnicalDashboard.bind(this));
    this.router.get('/dashboards/compliance', this.getComplianceDashboard.bind(this));

    // Tracing Routes
    this.router.get('/traces', this.searchTraces.bind(this));
    this.router.get('/traces/:traceId', this.getTrace.bind(this));
    this.router.get('/traces/:traceId/analyze', this.analyzeTrace.bind(this));
    this.router.get('/traces/errors', this.getErrorTraces.bind(this));
    this.router.get('/traces/slow', this.getSlowTraces.bind(this));
    this.router.get('/topology', this.getServiceTopology.bind(this));

    // Logging Routes
    this.router.get('/logs', this.searchLogs.bind(this));
    this.router.get('/logs/security', this.searchSecurityEvents.bind(this));
    this.router.get('/logs/compliance', this.searchComplianceAuditLogs.bind(this));
    this.router.get('/logs/aggregations', this.getLogAggregations.bind(this));

    // Prometheus Query Routes
    this.router.get('/query', this.queryPrometheus.bind(this));
    this.router.get('/query/range', this.queryPrometheusRange.bind(this));

    // Service Routes
    this.router.get('/services', this.getServices.bind(this));
    this.router.get('/services/:service/operations', this.getServiceOperations.bind(this));
    this.router.get('/services/:service/metrics', this.getServiceMetrics.bind(this));
  }

  /**
   * Get health status
   */
  private async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.monitoringService.healthCheck();
      
      res.status(health.status === 'healthy' ? 200 : 503).json({
        status: health.status,
        timestamp: new Date().toISOString(),
        details: health.details
      });
    } catch (error) {
      this.logger.error('Health check failed', { error });
      res.status(503).json({ 
        status: 'unhealthy', 
        error: 'Health check failed' 
      });
    }
  }

  /**
   * Get monitoring status
   */
  private async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.monitoringService.getMonitoringStatus();
      
      res.json({
        status: status.overall,
        timestamp: new Date().toISOString(),
        components: {
          prometheus: status.prometheus,
          grafana: status.grafana,
          elasticsearch: status.elasticsearch,
          jaeger: status.jaeger
        }
      });
    } catch (error) {
      this.logger.error('Failed to get monitoring status', { error });
      res.status(500).json({ error: 'Failed to get monitoring status' });
    }
  }

  /**
   * Get metrics
   */
  private async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.collectMetrics();
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get metrics', { error });
      res.status(500).json({ error: 'Failed to collect metrics' });
    }
  }

  /**
   * Collect metrics
   */
  private async collectMetrics(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Starting metrics collection via API');
      
      const metrics = await this.monitoringService.collectMetrics();
      
      res.json({
        success: true,
        data: metrics,
        message: 'Metrics collected successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Metrics collection failed', { error });
      res.status(500).json({ error: 'Metrics collection failed' });
    }
  }

  /**
   * Get Prometheus metrics
   */
  private async getPrometheusMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.getMetrics();
      
      res.setHeader('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      this.logger.error('Failed to get Prometheus metrics', { error });
      res.status(500).json({ error: 'Failed to get Prometheus metrics' });
    }
  }

  /**
   * Get business metrics
   */
  private async getBusinessMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.collectMetrics();
      
      res.json({
        success: true,
        data: metrics.business,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get business metrics', { error });
      res.status(500).json({ error: 'Failed to get business metrics' });
    }
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.collectMetrics();
      
      res.json({
        success: true,
        data: metrics.system,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get system metrics', { error });
      res.status(500).json({ error: 'Failed to get system metrics' });
    }
  }

  /**
   * Get security metrics
   */
  private async getSecurityMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.collectMetrics();
      
      res.json({
        success: true,
        data: metrics.security,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get security metrics', { error });
      res.status(500).json({ error: 'Failed to get security metrics' });
    }
  }

  /**
   * Get compliance metrics
   */
  private async getComplianceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await this.monitoringService.collectMetrics();
      
      res.json({
        success: true,
        data: metrics.compliance,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get compliance metrics', { error });
      res.status(500).json({ error: 'Failed to get compliance metrics' });
    }
  }

  /**
   * Get alerts
   */
  private async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alertRules = this.monitoringService.getAlertRules();
      
      res.json({
        success: true,
        data: alertRules,
        count: alertRules.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get alerts', { error });
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  }

  /**
   * Generate alerts
   */
  private async generateAlerts(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Generating alerts via API');
      
      const alerts = await this.monitoringService.generateAlerts();
      
      res.json({
        success: true,
        data: alerts,
        message: `Generated ${alerts.rules.length} alerting rules`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Alert generation failed', { error });
      res.status(500).json({ error: 'Alert generation failed' });
    }
  }

  /**
   * Get alert rules
   */
  private async getAlertRules(req: Request, res: Response): Promise<void> {
    try {
      const alertRules = this.monitoringService.getAlertRules();
      
      res.json({
        success: true,
        data: alertRules,
        count: alertRules.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get alert rules', { error });
      res.status(500).json({ error: 'Failed to get alert rules' });
    }
  }

  /**
   * Get dashboards
   */
  private async getDashboards(req: Request, res: Response): Promise<void> {
    try {
      const dashboards = await this.monitoringService.getDashboardSuite();
      
      res.json({
        success: true,
        data: dashboards,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get dashboards', { error });
      res.status(500).json({ error: 'Failed to get dashboards' });
    }
  }

  /**
   * Create dashboards
   */
  private async createDashboards(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('Creating dashboards via API');
      
      const dashboards = await this.monitoringService.createDashboards();
      
      res.json({
        success: true,
        data: dashboards,
        message: 'Dashboards created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Dashboard creation failed', { error });
      res.status(500).json({ error: 'Dashboard creation failed' });
    }
  }

  /**
   * Get executive dashboard
   */
  private async getExecutiveDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboards = await this.monitoringService.getDashboardSuite();
      
      res.json({
        success: true,
        data: dashboards.executive,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get executive dashboard', { error });
      res.status(500).json({ error: 'Failed to get executive dashboard' });
    }
  }

  /**
   * Get technical dashboard
   */
  private async getTechnicalDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboards = await this.monitoringService.getDashboardSuite();
      
      res.json({
        success: true,
        data: dashboards.technical,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get technical dashboard', { error });
      res.status(500).json({ error: 'Failed to get technical dashboard' });
    }
  }

  /**
   * Get compliance dashboard
   */
  private async getComplianceDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboards = await this.monitoringService.getDashboardSuite();
      
      res.json({
        success: true,
        data: dashboards.compliance,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get compliance dashboard', { error });
      res.status(500).json({ error: 'Failed to get compliance dashboard' });
    }
  }

  /**
   * Search traces
   */
  private async searchTraces(req: Request, res: Response): Promise<void> {
    try {
      const { service, operation, tags, startTime, endTime, minDuration, maxDuration, limit } = req.query;
      
      const query = {
        service: service as string,
        operation: operation as string,
        tags: tags ? JSON.parse(tags as string) : undefined,
        startTime: startTime ? parseInt(startTime as string) : undefined,
        endTime: endTime ? parseInt(endTime as string) : undefined,
        minDuration: minDuration ? parseInt(minDuration as string) : undefined,
        maxDuration: maxDuration ? parseInt(maxDuration as string) : undefined,
        limit: limit ? parseInt(limit as string) : 20
      };

      const traces = await this.monitoringService.searchTraces(query);
      
      res.json({
        success: true,
        data: traces,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to search traces', { error });
      res.status(500).json({ error: 'Failed to search traces' });
    }
  }

  /**
   * Get trace by ID
   */
  private async getTrace(req: Request, res: Response): Promise<void> {
    try {
      const { traceId } = req.params;
      const traces = await this.monitoringService.searchTraces({ 
        service: this.monitoringService['jaegerClient']['config'].serviceName,
        limit: 1
      });
      
      const trace = traces.data.find(t => t.traceID === traceId);
      
      if (!trace) {
        res.status(404).json({ error: 'Trace not found' });
        return;
      }

      res.json({
        success: true,
        data: trace,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get trace', { error });
      res.status(500).json({ error: 'Failed to get trace' });
    }
  }

  /**
   * Analyze trace
   */
  private async analyzeTrace(req: Request, res: Response): Promise<void> {
    try {
      const { traceId } = req.params;
      
      const analysis = await this.monitoringService.analyzeTracePerformance(traceId);
      
      res.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to analyze trace', { error });
      res.status(500).json({ error: 'Failed to analyze trace' });
    }
  }

  /**
   * Get error traces
   */
  private async getErrorTraces(req: Request, res: Response): Promise<void> {
    try {
      const { service } = req.query;
      
      const traces = await this.monitoringService.getErrorTraces(service as string);
      
      res.json({
        success: true,
        data: traces,
        count: traces.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get error traces', { error });
      res.status(500).json({ error: 'Failed to get error traces' });
    }
  }

  /**
   * Get slow traces
   */
  private async getSlowTraces(req: Request, res: Response): Promise<void> {
    try {
      const { service, minDuration } = req.query;
      
      const traces = await this.monitoringService.getSlowTraces(
        service as string, 
        minDuration ? parseInt(minDuration as string) : 5000
      );
      
      res.json({
        success: true,
        data: traces,
        count: traces.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get slow traces', { error });
      res.status(500).json({ error: 'Failed to get slow traces' });
    }
  }

  /**
   * Get service topology
   */
  private async getServiceTopology(req: Request, res: Response): Promise<void> {
    try {
      const topology = await this.monitoringService.getServiceTopology();
      
      res.json({
        success: true,
        data: topology,
        count: topology.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get service topology', { error });
      res.status(500).json({ error: 'Failed to get service topology' });
    }
  }

  /**
   * Search logs
   */
  private async searchLogs(req: Request, res: Response): Promise<void> {
    try {
      const { query, size, from, sort } = req.query;
      
      const searchQuery = {
        query: query ? JSON.parse(query as string) : { match_all: {} },
        size: size ? parseInt(size as string) : 100,
        from: from ? parseInt(from as string) : 0,
        sort: sort ? JSON.parse(sort as string) : [{ timestamp: { order: 'desc' } }]
      };

      const logs = await this.monitoringService.searchLogs(searchQuery);
      
      res.json({
        success: true,
        data: logs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to search logs', { error });
      res.status(500).json({ error: 'Failed to search logs' });
    }
  }

  /**
   * Search security events
   */
  private async searchSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const { query, size, from, sort } = req.query;
      
      const searchQuery = {
        query: query ? JSON.parse(query as string) : { match_all: {} },
        size: size ? parseInt(size as string) : 100,
        from: from ? parseInt(from as string) : 0,
        sort: sort ? JSON.parse(sort as string) : [{ timestamp: { order: 'desc' } }]
      };

      const events = await this.monitoringService.searchSecurityEvents(searchQuery);
      
      res.json({
        success: true,
        data: events,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to search security events', { error });
      res.status(500).json({ error: 'Failed to search security events' });
    }
  }

  /**
   * Search compliance audit logs
   */
  private async searchComplianceAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { query, size, from, sort } = req.query;
      
      const searchQuery = {
        query: query ? JSON.parse(query as string) : { match_all: {} },
        size: size ? parseInt(size as string) : 100,
        from: from ? parseInt(from as string) : 0,
        sort: sort ? JSON.parse(sort as string) : [{ timestamp: { order: 'desc' } }]
      };

      const logs = await this.monitoringService.searchComplianceAuditLogs(searchQuery);
      
      res.json({
        success: true,
        data: logs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to search compliance audit logs', { error });
      res.status(500).json({ error: 'Failed to search compliance audit logs' });
    }
  }

  /**
   * Get log aggregations
   */
  private async getLogAggregations(req: Request, res: Response): Promise<void> {
    try {
      const { from, to } = req.query;
      
      const timeRange = {
        from: from as string || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        to: to as string || new Date().toISOString()
      };

      const aggregations = await this.monitoringService['elasticClient'].getLogAggregations(timeRange);
      
      res.json({
        success: true,
        data: aggregations,
        count: aggregations.length,
        timeRange,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get log aggregations', { error });
      res.status(500).json({ error: 'Failed to get log aggregations' });
    }
  }

  /**
   * Query Prometheus
   */
  private async queryPrometheus(req: Request, res: Response): Promise<void> {
    try {
      const { query, time } = req.query;
      
      if (!query) {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }

      const result = await this.monitoringService.queryPrometheus(
        query as string, 
        time as string
      );
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to query Prometheus', { error });
      res.status(500).json({ error: 'Failed to query Prometheus' });
    }
  }

  /**
   * Query Prometheus range
   */
  private async queryPrometheusRange(req: Request, res: Response): Promise<void> {
    try {
      const { query, start, end, step } = req.query;
      
      if (!query || !start || !end || !step) {
        res.status(400).json({ error: 'Query, start, end, and step parameters are required' });
        return;
      }

      const result = await this.monitoringService['prometheusClient'].queryRange(
        query as string,
        start as string,
        end as string,
        step as string
      );
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to query Prometheus range', { error });
      res.status(500).json({ error: 'Failed to query Prometheus range' });
    }
  }

  /**
   * Get services
   */
  private async getServices(req: Request, res: Response): Promise<void> {
    try {
      const services = await this.monitoringService['jaegerClient'].getServices();
      
      res.json({
        success: true,
        data: services,
        count: services.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get services', { error });
      res.status(500).json({ error: 'Failed to get services' });
    }
  }

  /**
   * Get service operations
   */
  private async getServiceOperations(req: Request, res: Response): Promise<void> {
    try {
      const { service } = req.params;
      
      const operations = await this.monitoringService['jaegerClient'].getServiceOperations(service);
      
      res.json({
        success: true,
        data: operations,
        count: operations.length,
        service,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get service operations', { error });
      res.status(500).json({ error: 'Failed to get service operations' });
    }
  }

  /**
   * Get service metrics
   */
  private async getServiceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { service } = req.params;
      const { operation, start, end } = req.query;
      
      const timeRange = {
        start: start ? parseInt(start as string) : Date.now() - 3600000, // 1 hour ago
        end: end ? parseInt(end as string) : Date.now()
      };

      const metrics = await this.monitoringService['jaegerClient'].getTraceMetrics(
        service,
        operation as string || 'all',
        timeRange
      );
      
      res.json({
        success: true,
        data: metrics,
        service,
        operation: operation || 'all',
        timeRange,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to get service metrics', { error });
      res.status(500).json({ error: 'Failed to get service metrics' });
    }
  }

  /**
   * Get router instance
   */
  public getRouter(): Router {
    return this.router;
  }
}
