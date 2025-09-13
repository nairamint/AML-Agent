import { PrismaClient } from '@prisma/client';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { config } from '../config';
import { logger } from '../utils/logger';
import { auditService } from './auditService';

export interface TransactionData {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  transactionType: string;
  counterparty?: string;
  jurisdiction: string;
  timestamp: Date;
  metadata?: any;
}

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  jurisdiction: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  customerType: 'INDIVIDUAL' | 'CORPORATE';
  metadata?: any;
}

export interface ComplianceData {
  id: string;
  type: 'KYC' | 'CDD' | 'EDD' | 'SANCTIONS_CHECK';
  entityId: string;
  entityType: 'CUSTOMER' | 'TRANSACTION';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW';
  data: any;
  timestamp: Date;
}

export class DataPipelineService {
  private static instance: DataPipelineService;
  private prisma: PrismaClient;
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isInitialized = false;

  private constructor() {
    this.prisma = new PrismaClient();
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'data-pipeline-consumer' });
  }

  public static getInstance(): DataPipelineService {
    if (!DataPipelineService.instance) {
      DataPipelineService.instance = new DataPipelineService();
    }
    return DataPipelineService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Connect to Kafka
      await this.producer.connect();
      await this.consumer.connect();

      // Subscribe to topics
      await this.consumer.subscribe({
        topics: [
          'transactions',
          'customers',
          'compliance-checks',
          'sanctions-updates',
          'regulatory-updates',
        ],
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          await this.processMessage(topic, message);
        },
      });

      // Create topics if they don't exist
      await this.createTopics();

      this.isInitialized = true;
      logger.info('Data Pipeline Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Data Pipeline Service:', error);
      throw error;
    }
  }

  private async createTopics(): Promise<void> {
    const admin = this.kafka.admin();
    await admin.connect();

    const topics = [
      {
        topic: 'transactions',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'customers',
        numPartitions: 2,
        replicationFactor: 1,
      },
      {
        topic: 'compliance-checks',
        numPartitions: 2,
        replicationFactor: 1,
      },
      {
        topic: 'sanctions-updates',
        numPartitions: 1,
        replicationFactor: 1,
      },
      {
        topic: 'regulatory-updates',
        numPartitions: 1,
        replicationFactor: 1,
      },
    ];

    try {
      await admin.createTopics({ topics });
      logger.info('Kafka topics created successfully');
    } catch (error) {
      if (error.message.includes('Topic already exists')) {
        logger.info('Kafka topics already exist');
      } else {
        logger.error('Failed to create Kafka topics:', error);
      }
    }

    await admin.disconnect();
  }

  private async processMessage(topic: string, message: any): Promise<void> {
    try {
      const data = JSON.parse(message.value.toString());

      switch (topic) {
        case 'transactions':
          await this.processTransaction(data);
          break;
        case 'customers':
          await this.processCustomer(data);
          break;
        case 'compliance-checks':
          await this.processComplianceCheck(data);
          break;
        case 'sanctions-updates':
          await this.processSanctionsUpdate(data);
          break;
        case 'regulatory-updates':
          await this.processRegulatoryUpdate(data);
          break;
        default:
          logger.warn(`Unknown topic: ${topic}`);
      }
    } catch (error) {
      logger.error(`Failed to process message from topic ${topic}:`, error);
    }
  }

  private async processTransaction(data: TransactionData): Promise<void> {
    try {
      // Calculate risk score
      const riskScore = await this.calculateTransactionRisk(data);

      // Store transaction
      const transaction = await this.prisma.transaction.create({
        data: {
          id: data.id,
          userId: data.userId,
          amount: data.amount,
          currency: data.currency,
          transactionType: data.transactionType,
          counterparty: data.counterparty,
          jurisdiction: data.jurisdiction,
          riskScore,
          status: riskScore > 0.7 ? 'FLAGGED' : 'PENDING',
          metadata: data.metadata,
        },
      });

      // Generate alert if high risk
      if (riskScore > 0.7) {
        await this.generateAlert({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          title: 'High-risk transaction detected',
          description: `Transaction ${data.id} flagged for review`,
          transactionId: data.id,
          userId: data.userId,
        });
      }

      // Log audit trail
      await auditService.logDataAccess(
        'system',
        'transaction',
        data.id,
        'WRITE',
        { riskScore, status: transaction.status }
      );

      logger.info(`Processed transaction: ${data.id}`, { riskScore });
    } catch (error) {
      logger.error('Failed to process transaction:', error);
    }
  }

  private async processCustomer(data: CustomerData): Promise<void> {
    try {
      // Store customer data
      const customer = await this.prisma.user.upsert({
        where: { email: data.email },
        update: {
          name: data.name,
          jurisdiction: data.jurisdiction,
          metadata: data.metadata,
        },
        create: {
          id: data.id,
          email: data.email,
          name: data.name,
          jurisdiction: data.jurisdiction,
          organization: 'external',
          role: 'CUSTOMER',
          metadata: data.metadata,
        },
      });

      // Log audit trail
      await auditService.logDataAccess(
        'system',
        'customer',
        data.id,
        'WRITE',
        { riskLevel: data.riskLevel }
      );

      logger.info(`Processed customer: ${data.id}`);
    } catch (error) {
      logger.error('Failed to process customer:', error);
    }
  }

  private async processComplianceCheck(data: ComplianceData): Promise<void> {
    try {
      // Store compliance check
      const check = await this.prisma.auditLog.create({
        data: {
          id: data.id,
          action: `COMPLIANCE_${data.type}`,
          resource: data.entityType.toLowerCase(),
          resourceId: data.entityId,
          details: {
            type: data.type,
            status: data.status,
            data: data.data,
          },
        },
      });

      // Update entity status if needed
      if (data.entityType === 'CUSTOMER') {
        await this.updateCustomerComplianceStatus(data.entityId, data.status);
      } else if (data.entityType === 'TRANSACTION') {
        await this.updateTransactionComplianceStatus(data.entityId, data.status);
      }

      logger.info(`Processed compliance check: ${data.id}`, { type: data.type, status: data.status });
    } catch (error) {
      logger.error('Failed to process compliance check:', error);
    }
  }

  private async processSanctionsUpdate(data: any): Promise<void> {
    try {
      // Process sanctions list update
      for (const sanction of data.sanctions) {
        await this.prisma.sanctionsCheck.create({
          data: {
            id: `sanction-${sanction.id}`,
            userId: 'system',
            entityName: sanction.name,
            entityType: sanction.type,
            jurisdiction: sanction.jurisdiction,
            matchFound: false, // Will be updated during screening
            matchDetails: null,
            metadata: sanction,
          },
        });
      }

      logger.info(`Processed sanctions update: ${data.sanctions.length} entries`);
    } catch (error) {
      logger.error('Failed to process sanctions update:', error);
    }
  }

  private async processRegulatoryUpdate(data: any): Promise<void> {
    try {
      // Process regulatory update
      await this.prisma.regulatoryDocument.create({
        data: {
          id: data.id,
          title: data.title,
          content: data.content,
          jurisdiction: data.jurisdiction,
          regulation: data.regulation,
          section: data.section,
          version: data.version,
          lastUpdated: new Date(data.lastUpdated),
          metadata: data.metadata,
        },
      });

      logger.info(`Processed regulatory update: ${data.id}`);
    } catch (error) {
      logger.error('Failed to process regulatory update:', error);
    }
  }

  private async calculateTransactionRisk(transaction: TransactionData): Promise<number> {
    let riskScore = 0;

    // Amount-based risk
    if (transaction.amount > 10000) riskScore += 0.3;
    if (transaction.amount > 50000) riskScore += 0.2;

    // Jurisdiction-based risk
    const highRiskJurisdictions = ['AF', 'IR', 'KP', 'SY'];
    if (highRiskJurisdictions.includes(transaction.jurisdiction)) {
      riskScore += 0.4;
    }

    // Transaction type risk
    const highRiskTypes = ['CASH', 'WIRE_TRANSFER', 'CRYPTOCURRENCY'];
    if (highRiskTypes.includes(transaction.transactionType)) {
      riskScore += 0.2;
    }

    // Time-based risk (transactions outside business hours)
    const hour = new Date(transaction.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 0.1;
    }

    return Math.min(riskScore, 1.0);
  }

  private async generateAlert(alertData: {
    type: string;
    severity: string;
    title: string;
    description: string;
    transactionId?: string;
    userId: string;
  }): Promise<void> {
    try {
      const alert = await this.prisma.alert.create({
        data: {
          id: `alert-${Date.now()}`,
          userId: alertData.userId,
          transactionId: alertData.transactionId,
          type: alertData.type as any,
          severity: alertData.severity as any,
          title: alertData.title,
          description: alertData.description,
          status: 'OPEN',
        },
      });

      // Publish alert to Kafka for real-time processing
      await this.producer.send({
        topic: 'alerts',
        messages: [{
          key: alert.id,
          value: JSON.stringify(alert),
        }],
      });

      logger.info(`Generated alert: ${alert.id}`, { type: alertData.type, severity: alertData.severity });
    } catch (error) {
      logger.error('Failed to generate alert:', error);
    }
  }

  private async updateCustomerComplianceStatus(customerId: string, status: string): Promise<void> {
    try {
      // Update customer compliance status
      await this.prisma.user.update({
        where: { id: customerId },
        data: {
          metadata: {
            complianceStatus: status,
            lastComplianceCheck: new Date(),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to update customer compliance status:', error);
    }
  }

  private async updateTransactionComplianceStatus(transactionId: string, status: string): Promise<void> {
    try {
      // Update transaction compliance status
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: status === 'APPROVED' ? 'APPROVED' : 
                 status === 'REJECTED' ? 'REJECTED' : 'PENDING',
        },
      });
    } catch (error) {
      logger.error('Failed to update transaction compliance status:', error);
    }
  }

  // Public methods for external data ingestion
  public async ingestTransaction(transaction: TransactionData): Promise<void> {
    try {
      await this.producer.send({
        topic: 'transactions',
        messages: [{
          key: transaction.id,
          value: JSON.stringify(transaction),
        }],
      });

      logger.info(`Ingested transaction: ${transaction.id}`);
    } catch (error) {
      logger.error('Failed to ingest transaction:', error);
      throw error;
    }
  }

  public async ingestCustomer(customer: CustomerData): Promise<void> {
    try {
      await this.producer.send({
        topic: 'customers',
        messages: [{
          key: customer.id,
          value: JSON.stringify(customer),
        }],
      });

      logger.info(`Ingested customer: ${customer.id}`);
    } catch (error) {
      logger.error('Failed to ingest customer:', error);
      throw error;
    }
  }

  public async ingestComplianceCheck(check: ComplianceData): Promise<void> {
    try {
      await this.producer.send({
        topic: 'compliance-checks',
        messages: [{
          key: check.id,
          value: JSON.stringify(check),
        }],
      });

      logger.info(`Ingested compliance check: ${check.id}`);
    } catch (error) {
      logger.error('Failed to ingest compliance check:', error);
      throw error;
    }
  }

  public async getPipelineStats(): Promise<{
    totalTransactions: number;
    totalCustomers: number;
    totalAlerts: number;
    averageRiskScore: number;
  }> {
    try {
      const [transactions, customers, alerts, avgRisk] = await Promise.all([
        this.prisma.transaction.count(),
        this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
        this.prisma.alert.count(),
        this.prisma.transaction.aggregate({
          _avg: { riskScore: true },
        }),
      ]);

      return {
        totalTransactions: transactions,
        totalCustomers: customers,
        totalAlerts: alerts,
        averageRiskScore: avgRisk._avg.riskScore || 0,
      };
    } catch (error) {
      logger.error('Failed to get pipeline stats:', error);
      return {
        totalTransactions: 0,
        totalCustomers: 0,
        totalAlerts: 0,
        averageRiskScore: 0,
      };
    }
  }
}

export const dataPipelineService = DataPipelineService.getInstance();

