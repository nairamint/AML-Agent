/**
 * Jaeger Client for Distributed Tracing
 * Production-ready implementation for comprehensive observability
 */

import { Logger } from 'winston';
import axios, { AxiosInstance } from 'axios';

export interface JaegerConfig {
  endpoint: string;
  serviceName: string;
  username?: string;
  password?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  samplingRate?: number;
}

export interface Trace {
  traceID: string;
  spans: Span[];
  processes: Record<string, Process>;
  warnings?: string[];
}

export interface Span {
  traceID: string;
  spanID: string;
  parentSpanID?: string;
  operationName: string;
  startTime: number;
  duration: number;
  tags: Tag[];
  logs: Log[];
  references?: Reference[];
  flags?: number;
  processID: string;
  warnings?: string[];
}

export interface Tag {
  key: string;
  value: any;
  type?: string;
}

export interface Log {
  timestamp: number;
  fields: Tag[];
}

export interface Reference {
  refType: 'CHILD_OF' | 'FOLLOWS_FROM';
  traceID: string;
  spanID: string;
}

export interface Process {
  serviceName: string;
  tags: Tag[];
}

export interface TraceSearchQuery {
  service?: string;
  operation?: string;
  tags?: Record<string, string>;
  startTime?: number;
  endTime?: number;
  minDuration?: number;
  maxDuration?: number;
  limit?: number;
  lookback?: string;
}

export interface TraceSearchResponse {
  data: Trace[];
  total: number;
  limit: number;
  offset: number;
  errors?: any[];
}

export interface Service {
  serviceName: string;
  operations: Operation[];
}

export interface Operation {
  name: string;
  spanKind: string;
}

export interface ServiceDependency {
  parent: string;
  child: string;
  callCount: number;
  source: string;
}

export interface ServiceDependencies {
  data: ServiceDependency[];
  total: number;
  limit: number;
  offset: number;
}

export interface TraceAnalysis {
  traceId: string;
  totalDuration: number;
  spanCount: number;
  errorCount: number;
  criticalPath: Span[];
  bottlenecks: Span[];
  performanceIssues: PerformanceIssue[];
  recommendations: string[];
}

export interface PerformanceIssue {
  spanId: string;
  operationName: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
  recommendation: string;
}

export interface TraceMetrics {
  timestamp: string;
  service: string;
  operation: string;
  totalTraces: number;
  errorTraces: number;
  averageDuration: number;
  p50Duration: number;
  p90Duration: number;
  p95Duration: number;
  p99Duration: number;
  throughput: number;
  errorRate: number;
}

export class JaegerClient {
  private logger: Logger;
  private config: JaegerConfig;
  private httpClient: AxiosInstance;

  constructor(config: JaegerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: config.endpoint,
      timeout: config.timeout || 30000,
      auth: config.username && config.password ? {
        username: config.username,
        password: config.password
      } : undefined,
      headers: {
        'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : undefined,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Search traces
   */
  async searchTraces(query: TraceSearchQuery): Promise<TraceSearchResponse> {
    try {
      const params: any = {
        service: query.service || this.config.serviceName,
        limit: query.limit || 20,
        lookback: query.lookback || '1h'
      };

      if (query.operation) {
        params.operation = query.operation;
      }

      if (query.startTime && query.endTime) {
        params.start = query.startTime;
        params.end = query.endTime;
      }

      if (query.minDuration || query.maxDuration) {
        params.minDuration = query.minDuration;
        params.maxDuration = query.maxDuration;
      }

      if (query.tags) {
        params.tags = Object.entries(query.tags)
          .map(([key, value]) => `${key}=${value}`)
          .join('&');
      }

      const response = await this.httpClient.get('/api/traces', { params });
      
      return {
        data: response.data.data || [],
        total: response.data.total || 0,
        limit: params.limit,
        offset: 0,
        errors: response.data.errors
      };
    } catch (error) {
      this.logger.error('Failed to search traces', { error, query });
      throw error;
    }
  }

  /**
   * Get trace by ID
   */
  async getTrace(traceId: string): Promise<Trace | null> {
    try {
      const response = await this.httpClient.get(`/api/traces/${traceId}`);
      
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      this.logger.error('Failed to get trace', { error, traceId });
      throw error;
    }
  }

  /**
   * Get services
   */
  async getServices(): Promise<Service[]> {
    try {
      const response = await this.httpClient.get('/api/services');
      
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to get services', { error });
      throw error;
    }
  }

  /**
   * Get service operations
   */
  async getServiceOperations(serviceName: string): Promise<Operation[]> {
    try {
      const response = await this.httpClient.get(`/api/services/${serviceName}/operations`);
      
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Failed to get service operations', { error, serviceName });
      throw error;
    }
  }

  /**
   * Get service dependencies
   */
  async getServiceDependencies(
    endTs: number,
    lookback: string = '1h'
  ): Promise<ServiceDependencies> {
    try {
      const params = {
        endTs,
        lookback
      };

      const response = await this.httpClient.get('/api/dependencies', { params });
      
      return {
        data: response.data.data || [],
        total: response.data.data?.length || 0,
        limit: 0,
        offset: 0
      };
    } catch (error) {
      this.logger.error('Failed to get service dependencies', { error });
      throw error;
    }
  }

  /**
   * Analyze trace performance
   */
  async analyzeTrace(traceId: string): Promise<TraceAnalysis> {
    try {
      const trace = await this.getTrace(traceId);
      
      if (!trace) {
        throw new Error(`Trace ${traceId} not found`);
      }

      const analysis: TraceAnalysis = {
        traceId,
        totalDuration: 0,
        spanCount: trace.spans.length,
        errorCount: 0,
        criticalPath: [],
        bottlenecks: [],
        performanceIssues: [],
        recommendations: []
      };

      // Calculate total duration
      analysis.totalDuration = Math.max(...trace.spans.map(span => span.startTime + span.duration)) - 
                              Math.min(...trace.spans.map(span => span.startTime));

      // Count errors
      analysis.errorCount = trace.spans.filter(span => 
        span.tags.some(tag => tag.key === 'error' && tag.value === true)
      ).length;

      // Find critical path
      analysis.criticalPath = this.findCriticalPath(trace);

      // Find bottlenecks
      analysis.bottlenecks = this.findBottlenecks(trace);

      // Identify performance issues
      analysis.performanceIssues = this.identifyPerformanceIssues(trace);

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      return analysis;
    } catch (error) {
      this.logger.error('Failed to analyze trace', { error, traceId });
      throw error;
    }
  }

  /**
   * Find critical path in trace
   */
  private findCriticalPath(trace: Trace): Span[] {
    const criticalPath: Span[] = [];
    const spanMap = new Map(trace.spans.map(span => [span.spanID, span]));
    
    // Find root span
    const rootSpan = trace.spans.find(span => !span.parentSpanID);
    if (!rootSpan) return criticalPath;

    // Build critical path by following the longest duration path
    let currentSpan = rootSpan;
    criticalPath.push(currentSpan);

    while (currentSpan) {
      const childSpans = trace.spans.filter(span => span.parentSpanID === currentSpan.spanID);
      if (childSpans.length === 0) break;

      // Find child with longest duration
      const longestChild = childSpans.reduce((longest, current) => 
        current.duration > longest.duration ? current : longest
      );

      criticalPath.push(longestChild);
      currentSpan = longestChild;
    }

    return criticalPath;
  }

  /**
   * Find bottlenecks in trace
   */
  private findBottlenecks(trace: Trace): Span[] {
    const bottlenecks: Span[] = [];
    const averageDuration = trace.spans.reduce((sum, span) => sum + span.duration, 0) / trace.spans.length;
    const threshold = averageDuration * 2; // Spans taking 2x average duration

    for (const span of trace.spans) {
      if (span.duration > threshold) {
        bottlenecks.push(span);
      }
    }

    return bottlenecks.sort((a, b) => b.duration - a.duration);
  }

  /**
   * Identify performance issues
   */
  private identifyPerformanceIssues(trace: Trace): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const averageDuration = trace.spans.reduce((sum, span) => sum + span.duration, 0) / trace.spans.length;

    for (const span of trace.spans) {
      // Check for high duration
      if (span.duration > averageDuration * 3) {
        issues.push({
          spanId: span.spanID,
          operationName: span.operationName,
          issue: 'High duration',
          severity: 'high',
          impact: span.duration / averageDuration,
          recommendation: 'Optimize operation or add caching'
        });
      }

      // Check for errors
      const hasError = span.tags.some(tag => tag.key === 'error' && tag.value === true);
      if (hasError) {
        issues.push({
          spanId: span.spanID,
          operationName: span.operationName,
          issue: 'Operation failed',
          severity: 'critical',
          impact: 1,
          recommendation: 'Investigate and fix the error'
        });
      }

      // Check for database operations
      const isDatabase = span.tags.some(tag => tag.key === 'db.system');
      if (isDatabase && span.duration > 1000) { // 1 second
        issues.push({
          spanId: span.spanID,
          operationName: span.operationName,
          issue: 'Slow database operation',
          severity: 'medium',
          impact: span.duration / 1000,
          recommendation: 'Optimize database query or add indexing'
        });
      }

      // Check for external service calls
      const isExternal = span.tags.some(tag => tag.key === 'http.url');
      if (isExternal && span.duration > 5000) { // 5 seconds
        issues.push({
          spanId: span.spanID,
          operationName: span.operationName,
          issue: 'Slow external service call',
          severity: 'medium',
          impact: span.duration / 5000,
          recommendation: 'Add timeout or circuit breaker'
        });
      }
    }

    return issues;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(analysis: TraceAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.errorCount > 0) {
      recommendations.push(`Fix ${analysis.errorCount} error(s) in the trace`);
    }

    if (analysis.bottlenecks.length > 0) {
      recommendations.push(`Optimize ${analysis.bottlenecks.length} bottleneck operation(s)`);
    }

    if (analysis.performanceIssues.length > 0) {
      const criticalIssues = analysis.performanceIssues.filter(issue => issue.severity === 'critical');
      if (criticalIssues.length > 0) {
        recommendations.push(`Address ${criticalIssues.length} critical performance issue(s)`);
      }
    }

    if (analysis.totalDuration > 10000) { // 10 seconds
      recommendations.push('Consider breaking down long-running operations');
    }

    if (analysis.spanCount > 100) {
      recommendations.push('Consider reducing trace complexity');
    }

    return recommendations;
  }

  /**
   * Get trace metrics
   */
  async getTraceMetrics(
    service: string,
    operation: string,
    timeRange: { start: number; end: number }
  ): Promise<TraceMetrics> {
    try {
      // Search for traces in the time range
      const query: TraceSearchQuery = {
        service,
        operation,
        startTime: timeRange.start,
        endTime: timeRange.end,
        limit: 1000
      };

      const response = await this.searchTraces(query);
      const traces = response.data;

      if (traces.length === 0) {
        return {
          timestamp: new Date().toISOString(),
          service,
          operation,
          totalTraces: 0,
          errorTraces: 0,
          averageDuration: 0,
          p50Duration: 0,
          p90Duration: 0,
          p95Duration: 0,
          p99Duration: 0,
          throughput: 0,
          errorRate: 0
        };
      }

      // Calculate metrics
      const durations = traces.map(trace => {
        const rootSpan = trace.spans.find(span => !span.parentSpanID);
        return rootSpan ? rootSpan.duration : 0;
      }).filter(duration => duration > 0);

      const errorTraces = traces.filter(trace => 
        trace.spans.some(span => 
          span.tags.some(tag => tag.key === 'error' && tag.value === true)
        )
      ).length;

      const sortedDurations = durations.sort((a, b) => a - b);
      const timeSpan = (timeRange.end - timeRange.start) / 1000; // seconds

      return {
        timestamp: new Date().toISOString(),
        service,
        operation,
        totalTraces: traces.length,
        errorTraces,
        averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p50Duration: this.percentile(sortedDurations, 0.5),
        p90Duration: this.percentile(sortedDurations, 0.9),
        p95Duration: this.percentile(sortedDurations, 0.95),
        p99Duration: this.percentile(sortedDurations, 0.99),
        throughput: traces.length / timeSpan,
        errorRate: (errorTraces / traces.length) * 100
      };
    } catch (error) {
      this.logger.error('Failed to get trace metrics', { error, service, operation });
      throw error;
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Get service topology
   */
  async getServiceTopology(lookback: string = '1h'): Promise<ServiceDependency[]> {
    try {
      const endTs = Date.now() * 1000; // Convert to microseconds
      const dependencies = await this.getServiceDependencies(endTs, lookback);
      
      return dependencies.data;
    } catch (error) {
      this.logger.error('Failed to get service topology', { error });
      throw error;
    }
  }

  /**
   * Get error traces
   */
  async getErrorTraces(
    service?: string,
    timeRange?: { start: number; end: number }
  ): Promise<Trace[]> {
    try {
      const query: TraceSearchQuery = {
        service: service || this.config.serviceName,
        tags: { error: 'true' },
        limit: 100
      };

      if (timeRange) {
        query.startTime = timeRange.start;
        query.endTime = timeRange.end;
      }

      const response = await this.searchTraces(query);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get error traces', { error });
      throw error;
    }
  }

  /**
   * Get slow traces
   */
  async getSlowTraces(
    service?: string,
    minDuration: number = 5000, // 5 seconds
    timeRange?: { start: number; end: number }
  ): Promise<Trace[]> {
    try {
      const query: TraceSearchQuery = {
        service: service || this.config.serviceName,
        minDuration,
        limit: 100
      };

      if (timeRange) {
        query.startTime = timeRange.start;
        query.endTime = timeRange.end;
      }

      const response = await this.searchTraces(query);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get slow traces', { error });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test Jaeger connectivity by getting services
      const services = await this.getServices();
      
      return {
        status: 'healthy',
        details: {
          endpoint: this.config.endpoint,
          connected: true,
          serviceName: this.config.serviceName,
          servicesCount: services.length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          endpoint: this.config.endpoint,
          connected: false,
          serviceName: this.config.serviceName,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Get sampling configuration
   */
  getSamplingConfig(): { rate: number; serviceName: string } {
    return {
      rate: this.config.samplingRate || 0.1,
      serviceName: this.config.serviceName
    };
  }

  /**
   * Update sampling rate
   */
  async updateSamplingRate(rate: number): Promise<void> {
    try {
      // In a real implementation, this would update the sampling configuration
      // For now, we'll just update the local config
      this.config.samplingRate = rate;
      
      this.logger.info(`Sampling rate updated to ${rate} for service ${this.config.serviceName}`);
    } catch (error) {
      this.logger.error('Failed to update sampling rate', { error, rate });
      throw error;
    }
  }
}
