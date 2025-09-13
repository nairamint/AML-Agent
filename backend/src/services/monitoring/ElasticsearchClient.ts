/**
 * Elasticsearch Client for Enterprise Log Aggregation
 * Production-ready implementation for comprehensive logging and search
 */

import { Logger } from 'winston';
import axios, { AxiosInstance } from 'axios';

export interface ElasticsearchConfig {
  node: string;
  username?: string;
  password?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  maxRetries?: number;
  requestTimeout?: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  source?: string;
  hostname?: string;
  environment?: string;
}

export interface SearchQuery {
  index?: string;
  query: any;
  size?: number;
  from?: number;
  sort?: any[];
  filter?: any;
  aggregations?: any;
  highlight?: any;
  source?: string[];
}

export interface SearchResponse {
  took: number;
  timed_out: boolean;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number;
    hits: SearchHit[];
  };
  aggregations?: any;
}

export interface SearchHit {
  _index: string;
  _id: string;
  _score: number;
  _source: any;
  highlight?: any;
}

export interface IndexTemplate {
  name: string;
  index_patterns: string[];
  template: {
    settings: any;
    mappings: any;
  };
  priority?: number;
  version?: number;
}

export interface LogAggregation {
  timestamp: string;
  level: string;
  count: number;
  services: Record<string, number>;
  components: Record<string, number>;
  environments: Record<string, number>;
}

export interface PerformanceMetrics {
  timestamp: string;
  service: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  errorRate: number;
  throughput: number;
}

export interface SecurityEvent {
  timestamp: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  description: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ComplianceAuditLog {
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: 'success' | 'failure' | 'denied';
  jurisdiction: string;
  regulation: string;
  metadata?: Record<string, any>;
}

export class ElasticsearchClient {
  private logger: Logger;
  private config: ElasticsearchConfig;
  private httpClient: AxiosInstance;
  private indices: Set<string> = new Set();

  constructor(config: ElasticsearchConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: config.node,
      timeout: config.timeout || 30000,
      auth: config.username && config.password ? {
        username: config.username,
        password: config.password
      } : undefined,
      headers: {
        'Authorization': config.apiKey ? `ApiKey ${config.apiKey}` : undefined,
        'Content-Type': 'application/json'
      }
    });

    // Initialize indices
    this.initializeIndices();
  }

  /**
   * Initialize Elasticsearch indices
   */
  private async initializeIndices(): Promise<void> {
    try {
      // Create index templates
      await this.createIndexTemplates();
      
      // Create default indices
      await this.createDefaultIndices();
      
      this.logger.info('Elasticsearch indices initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Elasticsearch indices', { error });
    }
  }

  /**
   * Create index templates
   */
  private async createIndexTemplates(): Promise<void> {
    const templates: IndexTemplate[] = [
      {
        name: 'aml-logs-template',
        index_patterns: ['aml-logs-*'],
        priority: 100,
        template: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1,
            index: {
              lifecycle: {
                name: 'aml-logs-policy',
                rollover_alias: 'aml-logs'
              }
            }
          },
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              level: { type: 'keyword' },
              message: { type: 'text', analyzer: 'standard' },
              service: { type: 'keyword' },
              component: { type: 'keyword' },
              userId: { type: 'keyword' },
              sessionId: { type: 'keyword' },
              requestId: { type: 'keyword' },
              traceId: { type: 'keyword' },
              spanId: { type: 'keyword' },
              metadata: { type: 'object' },
              tags: { type: 'keyword' },
              source: { type: 'keyword' },
              hostname: { type: 'keyword' },
              environment: { type: 'keyword' }
            }
          }
        }
      },
      {
        name: 'aml-performance-template',
        index_patterns: ['aml-performance-*'],
        priority: 100,
        template: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1
          },
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              service: { type: 'keyword' },
              endpoint: { type: 'keyword' },
              method: { type: 'keyword' },
              responseTime: { type: 'float' },
              statusCode: { type: 'integer' },
              requestSize: { type: 'long' },
              responseSize: { type: 'long' },
              errorRate: { type: 'float' },
              throughput: { type: 'float' }
            }
          }
        }
      },
      {
        name: 'aml-security-template',
        index_patterns: ['aml-security-*'],
        priority: 100,
        template: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1
          },
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              eventType: { type: 'keyword' },
              severity: { type: 'keyword' },
              source: { type: 'keyword' },
              target: { type: 'keyword' },
              description: { type: 'text' },
              userId: { type: 'keyword' },
              ipAddress: { type: 'ip' },
              userAgent: { type: 'text' },
              metadata: { type: 'object' }
            }
          }
        }
      },
      {
        name: 'aml-compliance-template',
        index_patterns: ['aml-compliance-*'],
        priority: 100,
        template: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1
          },
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              userId: { type: 'keyword' },
              action: { type: 'keyword' },
              resource: { type: 'keyword' },
              resourceId: { type: 'keyword' },
              result: { type: 'keyword' },
              jurisdiction: { type: 'keyword' },
              regulation: { type: 'keyword' },
              metadata: { type: 'object' }
            }
          }
        }
      }
    ];

    for (const template of templates) {
      try {
        await this.httpClient.put(`/_index_template/${template.name}`, template);
        this.logger.info(`Index template created: ${template.name}`);
      } catch (error) {
        this.logger.error(`Failed to create index template: ${template.name}`, { error });
      }
    }
  }

  /**
   * Create default indices
   */
  private async createDefaultIndices(): Promise<void> {
    const indices = [
      'aml-logs',
      'aml-performance',
      'aml-security',
      'aml-compliance'
    ];

    for (const index of indices) {
      try {
        const indexName = `${index}-${new Date().toISOString().split('T')[0]}`;
        await this.httpClient.put(`/${indexName}`);
        this.indices.add(indexName);
        this.logger.info(`Index created: ${indexName}`);
      } catch (error) {
        this.logger.error(`Failed to create index: ${index}`, { error });
      }
    }
  }

  /**
   * Index a log entry
   */
  async indexLog(logEntry: LogEntry): Promise<void> {
    try {
      const indexName = `aml-logs-${new Date().toISOString().split('T')[0]}`;
      
      await this.httpClient.post(`/${indexName}/_doc`, logEntry);
      
      this.logger.debug('Log entry indexed successfully', { 
        index: indexName, 
        level: logEntry.level,
        service: logEntry.service 
      });
    } catch (error) {
      this.logger.error('Failed to index log entry', { error, logEntry });
      throw error;
    }
  }

  /**
   * Index performance metrics
   */
  async indexPerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      const indexName = `aml-performance-${new Date().toISOString().split('T')[0]}`;
      
      await this.httpClient.post(`/${indexName}/_doc`, metrics);
      
      this.logger.debug('Performance metrics indexed successfully', { 
        index: indexName, 
        service: metrics.service,
        endpoint: metrics.endpoint 
      });
    } catch (error) {
      this.logger.error('Failed to index performance metrics', { error, metrics });
      throw error;
    }
  }

  /**
   * Index security event
   */
  async indexSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const indexName = `aml-security-${new Date().toISOString().split('T')[0]}`;
      
      await this.httpClient.post(`/${indexName}/_doc`, event);
      
      this.logger.info('Security event indexed successfully', { 
        index: indexName, 
        eventType: event.eventType,
        severity: event.severity 
      });
    } catch (error) {
      this.logger.error('Failed to index security event', { error, event });
      throw error;
    }
  }

  /**
   * Index compliance audit log
   */
  async indexComplianceAuditLog(auditLog: ComplianceAuditLog): Promise<void> {
    try {
      const indexName = `aml-compliance-${new Date().toISOString().split('T')[0]}`;
      
      await this.httpClient.post(`/${indexName}/_doc`, auditLog);
      
      this.logger.debug('Compliance audit log indexed successfully', { 
        index: indexName, 
        userId: auditLog.userId,
        action: auditLog.action 
      });
    } catch (error) {
      this.logger.error('Failed to index compliance audit log', { error, auditLog });
      throw error;
    }
  }

  /**
   * Search logs
   */
  async searchLogs(query: SearchQuery): Promise<SearchResponse> {
    try {
      const indexName = query.index || `aml-logs-*`;
      
      const response = await this.httpClient.post(`/${indexName}/_search`, {
        query: query.query,
        size: query.size || 100,
        from: query.from || 0,
        sort: query.sort || [{ timestamp: { order: 'desc' } }],
        _source: query.source,
        highlight: query.highlight,
        aggs: query.aggregations
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to search logs', { error, query });
      throw error;
    }
  }

  /**
   * Search performance metrics
   */
  async searchPerformanceMetrics(query: SearchQuery): Promise<SearchResponse> {
    try {
      const indexName = query.index || `aml-performance-*`;
      
      const response = await this.httpClient.post(`/${indexName}/_search`, {
        query: query.query,
        size: query.size || 100,
        from: query.from || 0,
        sort: query.sort || [{ timestamp: { order: 'desc' } }],
        _source: query.source,
        aggs: query.aggregations
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to search performance metrics', { error, query });
      throw error;
    }
  }

  /**
   * Search security events
   */
  async searchSecurityEvents(query: SearchQuery): Promise<SearchResponse> {
    try {
      const indexName = query.index || `aml-security-*`;
      
      const response = await this.httpClient.post(`/${indexName}/_search`, {
        query: query.query,
        size: query.size || 100,
        from: query.from || 0,
        sort: query.sort || [{ timestamp: { order: 'desc' } }],
        _source: query.source,
        aggs: query.aggregations
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to search security events', { error, query });
      throw error;
    }
  }

  /**
   * Search compliance audit logs
   */
  async searchComplianceAuditLogs(query: SearchQuery): Promise<SearchResponse> {
    try {
      const indexName = query.index || `aml-compliance-*`;
      
      const response = await this.httpClient.post(`/${indexName}/_search`, {
        query: query.query,
        size: query.size || 100,
        from: query.from || 0,
        sort: query.sort || [{ timestamp: { order: 'desc' } }],
        _source: query.source,
        aggs: query.aggregations
      });

      return response.data;
    } catch (error) {
      this.logger.error('Failed to search compliance audit logs', { error, query });
      throw error;
    }
  }

  /**
   * Get log aggregations
   */
  async getLogAggregations(timeRange: { from: string; to: string }): Promise<LogAggregation[]> {
    try {
      const query: SearchQuery = {
        index: 'aml-logs-*',
        query: {
          range: {
            timestamp: {
              gte: timeRange.from,
              lte: timeRange.to
            }
          }
        },
        aggregations: {
          by_level: {
            terms: {
              field: 'level'
            }
          },
          by_service: {
            terms: {
              field: 'service'
            }
          },
          by_component: {
            terms: {
              field: 'component'
            }
          },
          by_environment: {
            terms: {
              field: 'environment'
            }
          },
          by_hour: {
            date_histogram: {
              field: 'timestamp',
              calendar_interval: 'hour'
            },
            aggregations: {
              by_level: {
                terms: {
                  field: 'level'
                }
              }
            }
          }
        }
      };

      const response = await this.searchLogs(query);
      
      if (!response.aggregations) {
        return [];
      }

      const aggregations: LogAggregation[] = [];
      
      // Process hourly aggregations
      for (const bucket of response.aggregations.by_hour.buckets) {
        const levelCounts: Record<string, number> = {};
        for (const levelBucket of bucket.by_level.buckets) {
          levelCounts[levelBucket.key] = levelBucket.doc_count;
        }

        aggregations.push({
          timestamp: bucket.key_as_string,
          level: 'all',
          count: bucket.doc_count,
          services: {},
          components: {},
          environments: {}
        });
      }

      return aggregations;
    } catch (error) {
      this.logger.error('Failed to get log aggregations', { error });
      throw error;
    }
  }

  /**
   * Get performance metrics aggregations
   */
  async getPerformanceMetricsAggregations(
    timeRange: { from: string; to: string },
    service?: string
  ): Promise<PerformanceMetrics[]> {
    try {
      const query: any = {
        range: {
          timestamp: {
            gte: timeRange.from,
            lte: timeRange.to
          }
        }
      };

      if (service) {
        query.bool = {
          must: [query],
          filter: [
            {
              term: {
                service: service
              }
            }
          ]
        };
      }

      const searchQuery: SearchQuery = {
        index: 'aml-performance-*',
        query,
        size: 1000,
        sort: [{ timestamp: { order: 'asc' } }]
      };

      const response = await this.searchPerformanceMetrics(searchQuery);
      
      return response.hits.hits.map(hit => hit._source as PerformanceMetrics);
    } catch (error) {
      this.logger.error('Failed to get performance metrics aggregations', { error });
      throw error;
    }
  }

  /**
   * Get security events aggregations
   */
  async getSecurityEventsAggregations(
    timeRange: { from: string; to: string },
    severity?: string
  ): Promise<SecurityEvent[]> {
    try {
      const query: any = {
        range: {
          timestamp: {
            gte: timeRange.from,
            lte: timeRange.to
          }
        }
      };

      if (severity) {
        query.bool = {
          must: [query],
          filter: [
            {
              term: {
                severity: severity
              }
            }
          ]
        };
      }

      const searchQuery: SearchQuery = {
        index: 'aml-security-*',
        query,
        size: 1000,
        sort: [{ timestamp: { order: 'desc' } }]
      };

      const response = await this.searchSecurityEvents(searchQuery);
      
      return response.hits.hits.map(hit => hit._source as SecurityEvent);
    } catch (error) {
      this.logger.error('Failed to get security events aggregations', { error });
      throw error;
    }
  }

  /**
   * Get compliance audit log aggregations
   */
  async getComplianceAuditLogAggregations(
    timeRange: { from: string; to: string },
    userId?: string
  ): Promise<ComplianceAuditLog[]> {
    try {
      const query: any = {
        range: {
          timestamp: {
            gte: timeRange.from,
            lte: timeRange.to
          }
        }
      };

      if (userId) {
        query.bool = {
          must: [query],
          filter: [
            {
              term: {
                userId: userId
              }
            }
          ]
        };
      }

      const searchQuery: SearchQuery = {
        index: 'aml-compliance-*',
        query,
        size: 1000,
        sort: [{ timestamp: { order: 'desc' } }]
      };

      const response = await this.searchComplianceAuditLogs(searchQuery);
      
      return response.hits.hits.map(hit => hit._source as ComplianceAuditLog);
    } catch (error) {
      this.logger.error('Failed to get compliance audit log aggregations', { error });
      throw error;
    }
  }

  /**
   * Create index lifecycle policy
   */
  async createIndexLifecyclePolicy(): Promise<void> {
    try {
      const policy = {
        policy: {
          phases: {
            hot: {
              actions: {
                rollover: {
                  max_size: '50GB',
                  max_age: '7d'
                }
              }
            },
            warm: {
              min_age: '7d',
              actions: {
                allocate: {
                  number_of_replicas: 0
                }
              }
            },
            cold: {
              min_age: '30d',
              actions: {
                allocate: {
                  number_of_replicas: 0
                }
              }
            },
            delete: {
              min_age: '90d'
            }
          }
        }
      };

      await this.httpClient.put('/_ilm/policy/aml-logs-policy', policy);
      this.logger.info('Index lifecycle policy created successfully');
    } catch (error) {
      this.logger.error('Failed to create index lifecycle policy', { error });
      throw error;
    }
  }

  /**
   * Get cluster health
   */
  async getClusterHealth(): Promise<any> {
    try {
      const response = await this.httpClient.get('/_cluster/health');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get cluster health', { error });
      throw error;
    }
  }

  /**
   * Get index stats
   */
  async getIndexStats(index?: string): Promise<any> {
    try {
      const url = index ? `/${index}/_stats` : '/_stats';
      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get index stats', { error });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const health = await this.getClusterHealth();
      
      return {
        status: health.status === 'green' ? 'healthy' : 'degraded',
        details: {
          node: this.config.node,
          connected: true,
          clusterStatus: health.status,
          indicesCount: this.indices.size,
          indices: Array.from(this.indices)
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          node: this.config.node,
          connected: false,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Get available indices
   */
  getIndices(): string[] {
    return Array.from(this.indices);
  }

  /**
   * Delete old indices
   */
  async deleteOldIndices(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const cutoffDateString = cutoffDate.toISOString().split('T')[0];
      
      // Get all indices
      const response = await this.httpClient.get('/_cat/indices?format=json');
      const indices = response.data;
      
      for (const index of indices) {
        if (index.index.includes('aml-') && index.index < `aml-logs-${cutoffDateString}`) {
          await this.httpClient.delete(`/${index.index}`);
          this.logger.info(`Deleted old index: ${index.index}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to delete old indices', { error });
      throw error;
    }
  }
}
