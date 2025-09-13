/**
 * Grafana Client for Enterprise Dashboard Management
 * Production-ready implementation for comprehensive visualization
 */

import { Logger } from 'winston';
import axios, { AxiosInstance } from 'axios';

export interface GrafanaConfig {
  url: string;
  apiKey: string;
  username?: string;
  password?: string;
  timeout?: number;
  retries?: number;
}

export interface DashboardSuite {
  executive: Dashboard;
  technical: Dashboard;
  compliance: Dashboard;
}

export interface Dashboard {
  id?: number;
  uid?: string;
  title: string;
  description?: string;
  tags?: string[];
  panels: Panel[];
  timezone?: string;
  refresh?: string;
  schemaVersion?: number;
  version?: number;
  links?: DashboardLink[];
  annotations?: Annotation[];
  templating?: Templating;
  time?: TimeRange;
}

export interface Panel {
  id: number;
  title: string;
  type: string;
  gridPos: GridPosition;
  targets: Target[];
  fieldConfig?: FieldConfig;
  options?: any;
  thresholds?: Threshold[];
  legend?: Legend;
  xAxis?: Axis;
  yAxes?: Axis[];
  datasource?: string;
  interval?: string;
  maxDataPoints?: number;
  repeat?: string;
  repeatDirection?: string;
  repeatPanelId?: number;
  scopedVars?: any;
  span?: number;
  stack?: boolean;
  steppedLine?: boolean;
  tooltip?: Tooltip;
  transparent?: boolean;
  valueName?: string;
  valueOptions?: ValueOptions;
  valueMaps?: ValueMap[];
  valueText?: string;
  valueType?: string;
  values?: boolean;
  yAxis?: Axis;
}

export interface GridPosition {
  h: number;
  w: number;
  x: number;
  y: number;
}

export interface Target {
  expr: string;
  format?: string;
  interval?: string;
  intervalFactor?: number;
  legendFormat?: string;
  refId: string;
  step?: number;
  target?: string;
  hide?: boolean;
  instant?: boolean;
  range?: boolean;
}

export interface FieldConfig {
  defaults: FieldConfigDefaults;
  overrides: FieldConfigOverride[];
}

export interface FieldConfigDefaults {
  color?: ColorConfig;
  custom?: any;
  mappings?: Mapping[];
  max?: number;
  min?: number;
  thresholds?: Threshold[];
  unit?: string;
  decimals?: number;
  displayName?: string;
  filterable?: boolean;
  links?: any[];
  noValue?: string;
  path?: string;
  writeable?: boolean;
}

export interface FieldConfigOverride {
  matcher: Matcher;
  properties: any[];
}

export interface ColorConfig {
  mode: string;
  fixedColor?: string;
  seriesBy?: string;
}

export interface Mapping {
  id: number;
  options: any;
  type: string;
}

export interface Threshold {
  color: string;
  value: number;
  op?: string;
}

export interface Matcher {
  id: string;
  options: any;
}

export interface Legend {
  avg?: boolean;
  current?: boolean;
  max?: boolean;
  min?: boolean;
  show?: boolean;
  total?: boolean;
  values?: boolean;
  asTable?: boolean;
  asColumns?: boolean;
  isVisible?: boolean;
  placement?: string;
  rightSide?: boolean;
  width?: number;
}

export interface Axis {
  label?: string;
  max?: number;
  min?: number;
  show?: boolean;
  logBase?: number;
  unit?: string;
  scale?: string;
}

export interface Tooltip {
  mode: string;
  sort?: string;
}

export interface ValueOptions {
  allValues?: boolean;
  calcs?: string[];
  fields?: string;
  limit?: number;
  values?: boolean;
}

export interface ValueMap {
  op: string;
  text: string;
  value: string;
}

export interface DashboardLink {
  asDropdown: boolean;
  icon: string;
  includeVars: boolean;
  keepTime: boolean;
  tags: string[];
  targetBlank: boolean;
  title: string;
  tooltip: string;
  type: string;
  url: string;
}

export interface Annotation {
  builtIn: number;
  datasource: string;
  enable: boolean;
  hide: boolean;
  iconColor: string;
  name: string;
  type: string;
}

export interface Templating {
  list: Variable[];
}

export interface Variable {
  allValue?: string;
  current: VariableCurrent;
  datasource?: string;
  definition?: string;
  hide: number;
  includeAll: boolean;
  label?: string;
  multi: boolean;
  name: string;
  options: VariableOption[];
  query: string;
  refresh: number;
  regex?: string;
  skipUrlSync: boolean;
  sort: number;
  tagValuesQuery?: string;
  tags?: string[];
  tagsQuery?: string;
  type: string;
  useTags: boolean;
}

export interface VariableCurrent {
  selected: boolean;
  text: string;
  value: string;
}

export interface VariableOption {
  selected: boolean;
  text: string;
  value: string;
}

export interface TimeRange {
  from: string;
  to: string;
}

export interface DashboardResponse {
  id: number;
  uid: string;
  title: string;
  url: string;
  version: number;
  created: string;
  updated: string;
}

export class GrafanaClient {
  private logger: Logger;
  private config: GrafanaConfig;
  private httpClient: AxiosInstance;

  constructor(config: GrafanaConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    
    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: config.url,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a dashboard
   */
  async createDashboard(dashboard: Dashboard): Promise<DashboardResponse> {
    try {
      this.logger.info(`Creating dashboard: ${dashboard.title}`);

      const response = await this.httpClient.post('/api/dashboards/db', {
        dashboard: {
          ...dashboard,
          id: null,
          version: 0
        },
        overwrite: false
      });

      const result: DashboardResponse = {
        id: response.data.id,
        uid: response.data.uid,
        title: response.data.title,
        url: response.data.url,
        version: response.data.version,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      this.logger.info(`Dashboard created successfully: ${result.title} (ID: ${result.id})`);
      return result;

    } catch (error) {
      this.logger.error('Failed to create dashboard', { error, title: dashboard.title });
      throw error;
    }
  }

  /**
   * Update a dashboard
   */
  async updateDashboard(uid: string, dashboard: Dashboard): Promise<DashboardResponse> {
    try {
      this.logger.info(`Updating dashboard: ${dashboard.title} (UID: ${uid})`);

      const response = await this.httpClient.post('/api/dashboards/db', {
        dashboard: {
          ...dashboard,
          uid,
          version: dashboard.version || 1
        },
        overwrite: true
      });

      const result: DashboardResponse = {
        id: response.data.id,
        uid: response.data.uid,
        title: response.data.title,
        url: response.data.url,
        version: response.data.version,
        created: response.data.created || new Date().toISOString(),
        updated: new Date().toISOString()
      };

      this.logger.info(`Dashboard updated successfully: ${result.title} (ID: ${result.id})`);
      return result;

    } catch (error) {
      this.logger.error('Failed to update dashboard', { error, uid, title: dashboard.title });
      throw error;
    }
  }

  /**
   * Get a dashboard by UID
   */
  async getDashboard(uid: string): Promise<Dashboard> {
    try {
      const response = await this.httpClient.get(`/api/dashboards/uid/${uid}`);
      return response.data.dashboard;
    } catch (error) {
      this.logger.error('Failed to get dashboard', { error, uid });
      throw error;
    }
  }

  /**
   * Delete a dashboard
   */
  async deleteDashboard(uid: string): Promise<void> {
    try {
      this.logger.info(`Deleting dashboard: ${uid}`);
      await this.httpClient.delete(`/api/dashboards/uid/${uid}`);
      this.logger.info(`Dashboard deleted successfully: ${uid}`);
    } catch (error) {
      this.logger.error('Failed to delete dashboard', { error, uid });
      throw error;
    }
  }

  /**
   * List all dashboards
   */
  async listDashboards(): Promise<DashboardResponse[]> {
    try {
      const response = await this.httpClient.get('/api/search?type=dash-db');
      return response.data.map((dashboard: any) => ({
        id: dashboard.id,
        uid: dashboard.uid,
        title: dashboard.title,
        url: dashboard.url,
        version: dashboard.version || 1,
        created: dashboard.created || new Date().toISOString(),
        updated: dashboard.updated || new Date().toISOString()
      }));
    } catch (error) {
      this.logger.error('Failed to list dashboards', { error });
      throw error;
    }
  }

  /**
   * Create executive dashboard
   */
  async createExecutiveDashboard(): Promise<DashboardResponse> {
    const dashboard: Dashboard = {
      title: 'AML Advisory Agent - Executive Overview',
      description: 'High-level business and compliance metrics for executive leadership',
      tags: ['executive', 'business', 'compliance', 'aml'],
      refresh: '30s',
      timezone: 'browser',
      panels: [
        this.createKPIPanel('Advisory Success Rate', 'aml_advisory_success_rate', 0, 0),
        this.createKPIPanel('Response Time SLA', 'aml_response_time_sla_compliance', 6, 0),
        this.createKPIPanel('Customer Satisfaction', 'aml_customer_satisfaction_score', 12, 0),
        this.createKPIPanel('Revenue Impact', 'aml_revenue_impact_total', 18, 0),
        this.createCompliancePanel('Regulatory Compliance Score', 0, 6),
        this.createSecurityPanel('Security Posture Score', 12, 6),
        this.createTrendPanel('Advisory Volume Trend', 'aml_advisory_requests_total', 0, 12),
        this.createTrendPanel('Response Time Trend', 'aml_advisory_response_time_seconds', 12, 12)
      ],
      time: {
        from: 'now-7d',
        to: 'now'
      }
    };

    return this.createDashboard(dashboard);
  }

  /**
   * Create technical dashboard
   */
  async createTechnicalDashboard(): Promise<DashboardResponse> {
    const dashboard: Dashboard = {
      title: 'AML Advisory Agent - Technical Operations',
      description: 'Technical metrics and system health for operations teams',
      tags: ['technical', 'operations', 'system', 'performance'],
      refresh: '15s',
      timezone: 'browser',
      panels: [
        this.createSystemMetricsPanel(0, 0),
        this.createApplicationMetricsPanel(12, 0),
        this.createErrorRatePanel(0, 8),
        this.createLatencyDistributionPanel(12, 8),
        this.createResourceUtilizationPanel(0, 16),
        this.createDatabaseMetricsPanel(12, 16),
        this.createNetworkMetricsPanel(0, 24),
        this.createQueueMetricsPanel(12, 24)
      ],
      time: {
        from: 'now-1h',
        to: 'now'
      }
    };

    return this.createDashboard(dashboard);
  }

  /**
   * Create compliance dashboard
   */
  async createComplianceDashboard(): Promise<DashboardResponse> {
    const dashboard: Dashboard = {
      title: 'AML Advisory Agent - Compliance & Audit',
      description: 'Compliance metrics and audit trails for regulatory teams',
      tags: ['compliance', 'audit', 'regulatory', 'nist-csf'],
      refresh: '1m',
      timezone: 'browser',
      panels: [
        this.createNISTCompliancePanel(0, 0),
        this.createAuditTrailPanel(12, 0),
        this.createDataProtectionPanel(0, 8),
        this.createRegulatoryReportingPanel(12, 8),
        this.createControlEffectivenessPanel(0, 16),
        this.createRiskAssessmentPanel(12, 16),
        this.createIncidentResponsePanel(0, 24),
        this.createTrainingCompliancePanel(12, 24)
      ],
      time: {
        from: 'now-30d',
        to: 'now'
      }
    };

    return this.createDashboard(dashboard);
  }

  /**
   * Create dashboard suite
   */
  async createDashboards(): Promise<DashboardSuite> {
    try {
      this.logger.info('Creating comprehensive dashboard suite');

      const executive = await this.createExecutiveDashboard();
      const technical = await this.createTechnicalDashboard();
      const compliance = await this.createComplianceDashboard();

      const suite: DashboardSuite = {
        executive: await this.getDashboard(executive.uid),
        technical: await this.getDashboard(technical.uid),
        compliance: await this.getDashboard(compliance.uid)
      };

      this.logger.info('Dashboard suite created successfully');
      return suite;

    } catch (error) {
      this.logger.error('Failed to create dashboard suite', { error });
      throw error;
    }
  }

  /**
   * Create KPI panel
   */
  private createKPIPanel(title: string, metric: string, x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title,
      type: 'stat',
      gridPos: { h: 6, w: 6, x, y },
      targets: [
        {
          expr: metric,
          refId: 'A',
          format: 'time_series'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100,
          thresholds: [
            { color: 'red', value: 0 },
            { color: 'yellow', value: 70 },
            { color: 'green', value: 90 }
          ]
        },
        overrides: []
      },
      options: {
        colorMode: 'value',
        graphMode: 'area',
        justifyMode: 'auto',
        orientation: 'auto',
        reduceOptions: {
          values: false,
          calcs: ['lastNotNull'],
          fields: ''
        },
        textMode: 'auto'
      }
    };
  }

  /**
   * Create compliance panel
   */
  private createCompliancePanel(title: string, x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title,
      type: 'gauge',
      gridPos: { h: 6, w: 12, x, y },
      targets: [
        {
          expr: 'compliance_nist_csf_score',
          refId: 'A',
          format: 'time_series'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100,
          thresholds: [
            { color: 'red', value: 0 },
            { color: 'yellow', value: 70 },
            { color: 'green', value: 90 }
          ]
        },
        overrides: []
      },
      options: {
        showThresholdLabels: false,
        showThresholdMarkers: true
      }
    };
  }

  /**
   * Create security panel
   */
  private createSecurityPanel(title: string, x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title,
      type: 'gauge',
      gridPos: { h: 6, w: 12, x, y },
      targets: [
        {
          expr: 'security_compliance_score',
          refId: 'A',
          format: 'time_series'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100,
          thresholds: [
            { color: 'red', value: 0 },
            { color: 'yellow', value: 70 },
            { color: 'green', value: 90 }
          ]
        },
        overrides: []
      },
      options: {
        showThresholdLabels: false,
        showThresholdMarkers: true
      }
    };
  }

  /**
   * Create trend panel
   */
  private createTrendPanel(title: string, metric: string, x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title,
      type: 'graph',
      gridPos: { h: 6, w: 12, x, y },
      targets: [
        {
          expr: metric,
          refId: 'A',
          format: 'time_series'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'short'
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true,
        current: true,
        max: true,
        min: true,
        avg: true
      },
      xAxis: {
        show: true
      },
      yAxes: [
        {
          label: 'Value',
          show: true
        }
      ]
    };
  }

  /**
   * Create system metrics panel
   */
  private createSystemMetricsPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'System Metrics',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'system_cpu_usage_percent',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'CPU Usage'
        },
        {
          expr: 'system_memory_usage_bytes / 1024 / 1024 / 1024',
          refId: 'B',
          format: 'time_series',
          legendFormat: 'Memory Usage (GB)'
        },
        {
          expr: 'system_disk_usage_percent',
          refId: 'C',
          format: 'time_series',
          legendFormat: 'Disk Usage'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent'
        },
        overrides: [
          {
            matcher: { id: 'byName', options: 'Memory Usage (GB)' },
            properties: [
              { id: 'unit', value: 'short' }
            ]
          }
        ]
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create application metrics panel
   */
  private createApplicationMetricsPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Application Metrics',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'application_active_connections',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Active Connections'
        },
        {
          expr: 'application_queue_depth',
          refId: 'B',
          format: 'time_series',
          legendFormat: 'Queue Depth'
        },
        {
          expr: 'application_cache_hit_rate',
          refId: 'C',
          format: 'time_series',
          legendFormat: 'Cache Hit Rate'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'short'
        },
        overrides: [
          {
            matcher: { id: 'byName', options: 'Cache Hit Rate' },
            properties: [
              { id: 'unit', value: 'percent' }
            ]
          }
        ]
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create error rate panel
   */
  private createErrorRatePanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Error Rate',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'rate(aml_advisory_errors_total[5m])',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Error Rate'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create latency distribution panel
   */
  private createLatencyDistributionPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Latency Distribution',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'histogram_quantile(0.50, rate(aml_advisory_response_time_seconds_bucket[5m]))',
          refId: 'A',
          format: 'time_series',
          legendFormat: '50th percentile'
        },
        {
          expr: 'histogram_quantile(0.90, rate(aml_advisory_response_time_seconds_bucket[5m]))',
          refId: 'B',
          format: 'time_series',
          legendFormat: '90th percentile'
        },
        {
          expr: 'histogram_quantile(0.95, rate(aml_advisory_response_time_seconds_bucket[5m]))',
          refId: 'C',
          format: 'time_series',
          legendFormat: '95th percentile'
        },
        {
          expr: 'histogram_quantile(0.99, rate(aml_advisory_response_time_seconds_bucket[5m]))',
          refId: 'D',
          format: 'time_series',
          legendFormat: '99th percentile'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 's'
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create resource utilization panel
   */
  private createResourceUtilizationPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Resource Utilization',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'system_cpu_usage_percent',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'CPU'
        },
        {
          expr: 'system_memory_usage_percent',
          refId: 'B',
          format: 'time_series',
          legendFormat: 'Memory'
        },
        {
          expr: 'system_disk_usage_percent',
          refId: 'C',
          format: 'time_series',
          legendFormat: 'Disk'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create database metrics panel
   */
  private createDatabaseMetricsPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Database Metrics',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'database_connections_active',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Active Connections'
        },
        {
          expr: 'database_queries_per_second',
          refId: 'B',
          format: 'time_series',
          legendFormat: 'Queries/sec'
        },
        {
          expr: 'database_connection_pool_utilization',
          refId: 'C',
          format: 'time_series',
          legendFormat: 'Pool Utilization'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'short'
        },
        overrides: [
          {
            matcher: { id: 'byName', options: 'Pool Utilization' },
            properties: [
              { id: 'unit', value: 'percent' }
            ]
          }
        ]
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create network metrics panel
   */
  private createNetworkMetricsPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Network Metrics',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'rate(network_bytes_received_total[5m])',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Bytes Received/sec'
        },
        {
          expr: 'rate(network_bytes_sent_total[5m])',
          refId: 'B',
          format: 'time_series',
          legendFormat: 'Bytes Sent/sec'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'binBps'
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create queue metrics panel
   */
  private createQueueMetricsPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Queue Metrics',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'queue_depth',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Queue Depth'
        },
        {
          expr: 'rate(queue_processed_total[5m])',
          refId: 'B',
          format: 'time_series',
          legendFormat: 'Processed/sec'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'short'
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create NIST compliance panel
   */
  private createNISTCompliancePanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'NIST CSF Compliance',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'compliance_nist_csf_score{function="IDENTIFY"}',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'IDENTIFY'
        },
        {
          expr: 'compliance_nist_csf_score{function="PROTECT"}',
          refId: 'B',
          format: 'time_series',
          legendFormat: 'PROTECT'
        },
        {
          expr: 'compliance_nist_csf_score{function="DETECT"}',
          refId: 'C',
          format: 'time_series',
          legendFormat: 'DETECT'
        },
        {
          expr: 'compliance_nist_csf_score{function="RESPOND"}',
          refId: 'D',
          format: 'time_series',
          legendFormat: 'RESPOND'
        },
        {
          expr: 'compliance_nist_csf_score{function="RECOVER"}',
          refId: 'E',
          format: 'time_series',
          legendFormat: 'RECOVER'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create audit trail panel
   */
  private createAuditTrailPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Audit Trail Completeness',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'compliance_audit_trail_completeness',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Audit Trail Completeness'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create data protection panel
   */
  private createDataProtectionPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Data Protection Compliance',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'compliance_data_retention_compliance',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Data Retention'
        },
        {
          expr: 'compliance_data_encryption_compliance',
          refId: 'B',
          format: 'time_series',
          legendFormat: 'Data Encryption'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create regulatory reporting panel
   */
  private createRegulatoryReportingPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Regulatory Reporting Accuracy',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'compliance_regulatory_reporting_accuracy',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Reporting Accuracy'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create control effectiveness panel
   */
  private createControlEffectivenessPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Control Effectiveness',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'compliance_control_effectiveness',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Control Effectiveness'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create risk assessment panel
   */
  private createRiskAssessmentPanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Risk Assessment Coverage',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'compliance_risk_assessment_coverage',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Risk Assessment Coverage'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create incident response panel
   */
  private createIncidentResponsePanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Incident Response Time',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'compliance_incident_response_time',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Response Time (minutes)'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'm'
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Create training compliance panel
   */
  private createTrainingCompliancePanel(x: number, y: number): Panel {
    return {
      id: Math.floor(Math.random() * 1000000),
      title: 'Training Compliance',
      type: 'graph',
      gridPos: { h: 8, w: 12, x, y },
      targets: [
        {
          expr: 'compliance_training_completion',
          refId: 'A',
          format: 'time_series',
          legendFormat: 'Training Completion'
        }
      ],
      fieldConfig: {
        defaults: {
          unit: 'percent',
          min: 0,
          max: 100
        },
        overrides: []
      },
      legend: {
        show: true,
        values: true
      }
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const response = await this.httpClient.get('/api/health');
      
      return {
        status: 'healthy',
        details: {
          url: this.config.url,
          connected: true,
          version: response.data.version || 'unknown'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          url: this.config.url,
          connected: false,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}
