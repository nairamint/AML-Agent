import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { knowledgeService } from './knowledgeService';
import { dataPipelineService } from './dataPipelineService';
// Removed cheerio import - using API-first approach
import axios from 'axios';
import { createHash } from 'crypto';
import { schedule } from 'node-cron';

export interface RegulatoryDataSource {
  id: string;
  name: string;
  url: string;
  jurisdiction: string;
  type: 'API' | 'SCRAPE' | 'RSS' | 'JSON';
  parser: string;
  updateFrequency: string; // cron expression
  lastChecked?: Date;
  lastUpdated?: Date;
  isActive: boolean;
  metadata?: any;
}

export interface RegulatoryUpdate {
  id: string;
  sourceId: string;
  title: string;
  content: string;
  jurisdiction: string;
  regulation: string;
  section?: string;
  version: string;
  effectiveDate?: Date;
  lastUpdated: Date;
  changeType: 'NEW' | 'UPDATED' | 'AMENDED' | 'REPEALED';
  metadata?: any;
  hash: string; // For change detection
}

export interface ChangeDetectionResult {
  hasChanges: boolean;
  newDocuments: RegulatoryUpdate[];
  updatedDocuments: RegulatoryUpdate[];
  removedDocuments: string[];
}

export class RegulatoryDataIngestionService {
  private static instance: RegulatoryDataIngestionService;
  private prisma: PrismaClient;
  private isInitialized = false;
  private scheduledJobs: Map<string, any> = new Map();

  // Comprehensive multi-jurisdiction data sources - API-first approach
  private dataSources: RegulatoryDataSource[] = [
    // UK Sources - API-based
    {
      id: 'uk-fca-aml-data',
      name: 'FCA AML Data Return',
      url: 'https://www.fca.org.uk/publication/data/aml-data-return.json',
      jurisdiction: 'UK',
      type: 'API',
      parser: 'fca-aml-parser',
      updateFrequency: '0 6 * * 1', // Every Monday at 6 AM
      isActive: true,
      metadata: {
        apiKey: process.env.FCA_API_KEY,
        rateLimit: '100/hour',
        format: 'JSON',
      },
    },
    {
      id: 'uk-legislation-gov',
      name: 'UK Legislation - AML Regulations',
      url: 'https://www.legislation.gov.uk/uksi/2017/692/data.json',
      jurisdiction: 'UK',
      type: 'API',
      parser: 'legislation-gov-parser',
      updateFrequency: '0 8 * * *', // Daily at 8 AM
      isActive: true,
      metadata: {
        rateLimit: '1000/hour',
        format: 'JSON',
      },
    },
    {
      id: 'uk-fca-regdata',
      name: 'FCA RegData Platform',
      url: 'https://regdata.fca.org.uk/api/v1/regulatory-data',
      jurisdiction: 'UK',
      type: 'API',
      parser: 'fca-regdata-parser',
      updateFrequency: '0 7 * * 1,3,5', // Mon, Wed, Fri at 7 AM
      isActive: true,
      metadata: {
        apiKey: process.env.FCA_REGDATA_API_KEY,
        rateLimit: '500/hour',
        format: 'JSON',
      },
    },

    // EU Sources - API-based where available
    {
      id: 'eu-eba-aml-api',
      name: 'EBA AML/CFT Guidelines API',
      url: 'https://www.eba.europa.eu/api/v1/guidelines/aml-cft',
      jurisdiction: 'EU',
      type: 'API',
      parser: 'eba-aml-api-parser',
      updateFrequency: '0 9 * * 1', // Every Monday at 9 AM
      isActive: true,
      metadata: {
        rateLimit: '200/hour',
        format: 'JSON',
      },
    },
    {
      id: 'eu-eur-lex-api',
      name: 'EUR-Lex API - AML Directives',
      url: 'https://eur-lex.europa.eu/api/v1/legal-content/EN/AUTO/',
      jurisdiction: 'EU',
      type: 'API',
      parser: 'eur-lex-api-parser',
      updateFrequency: '0 10 * * *', // Daily at 10 AM
      isActive: true,
      metadata: {
        rateLimit: '1000/hour',
        format: 'JSON',
      },
    },
    {
      id: 'eu-aml-directive-5-api',
      name: '5th AML Directive API',
      url: 'https://eur-lex.europa.eu/api/v1/legal-content/EN/TXT/?uri=CELEX:32018L0843',
      jurisdiction: 'EU',
      type: 'API',
      parser: 'directive-api-parser',
      updateFrequency: '0 11 * * 1', // Every Monday at 11 AM
      isActive: true,
      metadata: {
        rateLimit: '1000/hour',
        format: 'JSON',
      },
    },

    // US Sources - API-based
    {
      id: 'us-treasury-ofac-api',
      name: 'Treasury OFAC API - SDN List',
      url: 'https://api.treasury.gov/v1/sanctions/sdn',
      jurisdiction: 'US',
      type: 'API',
      parser: 'treasury-ofac-api-parser',
      updateFrequency: '0 12 * * *', // Daily at 12 PM
      isActive: true,
      metadata: {
        apiKey: process.env.TREASURY_API_KEY,
        rateLimit: '1000/hour',
        format: 'JSON',
      },
    },
    {
      id: 'us-fincen-api',
      name: 'FinCEN API - Advisories',
      url: 'https://api.fincen.gov/v1/advisories',
      jurisdiction: 'US',
      type: 'API',
      parser: 'fincen-api-parser',
      updateFrequency: '0 13 * * 1,3,5', // Mon, Wed, Fri at 1 PM
      isActive: true,
      metadata: {
        apiKey: process.env.FINCEN_API_KEY,
        rateLimit: '500/hour',
        format: 'JSON',
      },
    },
    {
      id: 'us-fincen-bsa-api',
      name: 'FinCEN BSA Regulations API',
      url: 'https://api.fincen.gov/v1/regulations/bsa',
      jurisdiction: 'US',
      type: 'API',
      parser: 'bsa-regulations-api-parser',
      updateFrequency: '0 14 * * 1', // Every Monday at 2 PM
      isActive: true,
      metadata: {
        apiKey: process.env.FINCEN_API_KEY,
        rateLimit: '500/hour',
        format: 'JSON',
      },
    },
    {
      id: 'us-federal-register-api',
      name: 'Federal Register API - AML Rules',
      url: 'https://www.federalregister.gov/api/v1/documents.json',
      jurisdiction: 'US',
      type: 'API',
      parser: 'federal-register-api-parser',
      updateFrequency: '0 15 * * *', // Daily at 3 PM
      isActive: true,
      metadata: {
        apiKey: process.env.FEDERAL_REGISTER_API_KEY,
        rateLimit: '1000/hour',
        format: 'JSON',
        searchParams: {
          'agencies[]': 'treasury-department',
          'type': 'RULE',
          'per_page': 100,
        },
      },
    },
    {
      id: 'us-sec-edgar-api',
      name: 'SEC EDGAR API - AML Filings',
      url: 'https://data.sec.gov/api/xbrl/companyfacts/',
      jurisdiction: 'US',
      type: 'API',
      parser: 'sec-edgar-api-parser',
      updateFrequency: '0 16 * * *', // Daily at 4 PM
      isActive: true,
      metadata: {
        rateLimit: '10/second',
        format: 'JSON',
        userAgent: 'AML-KYC-Advisory-Agent/1.0',
      },
    },

    // Additional Jurisdictions - API-based where available
    {
      id: 'ca-fintrac-api',
      name: 'FINTRAC API - Guidance',
      url: 'https://api.fintrac-canafe.gc.ca/v1/guidance',
      jurisdiction: 'CA',
      type: 'API',
      parser: 'fintrac-api-parser',
      updateFrequency: '0 17 * * 1', // Every Monday at 5 PM
      isActive: true,
      metadata: {
        apiKey: process.env.FINTRAC_API_KEY,
        rateLimit: '200/hour',
        format: 'JSON',
      },
    },
    {
      id: 'au-austrac-api',
      name: 'AUSTRAC API - Guidance',
      url: 'https://api.austrac.gov.au/v1/guidance',
      jurisdiction: 'AU',
      type: 'API',
      parser: 'austrac-api-parser',
      updateFrequency: '0 18 * * 1', // Every Monday at 6 PM
      isActive: true,
      metadata: {
        apiKey: process.env.AUSTRAC_API_KEY,
        rateLimit: '200/hour',
        format: 'JSON',
      },
    },
    {
      id: 'sg-mas-api',
      name: 'MAS API - AML Guidelines',
      url: 'https://api.mas.gov.sg/v1/regulations/aml',
      jurisdiction: 'SG',
      type: 'API',
      parser: 'mas-aml-api-parser',
      updateFrequency: '0 19 * * 1', // Every Monday at 7 PM
      isActive: true,
      metadata: {
        apiKey: process.env.MAS_API_KEY,
        rateLimit: '200/hour',
        format: 'JSON',
      },
    },

    // Third-party API providers for comprehensive coverage
    {
      id: 'complyadvantage-api',
      name: 'ComplyAdvantage API - Global Sanctions',
      url: 'https://api.complyadvantage.com/v1/sanctions',
      jurisdiction: 'GLOBAL',
      type: 'API',
      parser: 'complyadvantage-api-parser',
      updateFrequency: '0 */4 * * *', // Every 4 hours
      isActive: true,
      metadata: {
        apiKey: process.env.COMPLYADVANTAGE_API_KEY,
        rateLimit: '1000/hour',
        format: 'JSON',
      },
    },
    {
      id: 'lexisnexis-api',
      name: 'LexisNexis API - KYC Data',
      url: 'https://api.lexisnexis.com/v1/kyc',
      jurisdiction: 'GLOBAL',
      type: 'API',
      parser: 'lexisnexis-api-parser',
      updateFrequency: '0 20 * * *', // Daily at 8 PM
      isActive: true,
      metadata: {
        apiKey: process.env.LEXISNEXIS_API_KEY,
        rateLimit: '500/hour',
        format: 'JSON',
      },
    },
  ];

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): RegulatoryDataIngestionService {
    if (!RegulatoryDataIngestionService.instance) {
      RegulatoryDataIngestionService.instance = new RegulatoryDataIngestionService();
    }
    return RegulatoryDataIngestionService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize data sources in database
      await this.initializeDataSources();
      
      // Start scheduled ingestion jobs
      await this.startScheduledIngestion();
      
      // Perform initial data ingestion
      await this.performInitialIngestion();
      
      this.isInitialized = true;
      logger.info('Regulatory Data Ingestion Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Regulatory Data Ingestion Service:', error);
      throw error;
    }
  }

  private async initializeDataSources(): Promise<void> {
    try {
      for (const source of this.dataSources) {
        await this.prisma.regulatoryDataSource.upsert({
          where: { id: source.id },
          update: source,
          create: source,
        });
      }
      logger.info(`Initialized ${this.dataSources.length} regulatory data sources`);
    } catch (error) {
      logger.error('Failed to initialize data sources:', error);
      throw error;
    }
  }

  private async startScheduledIngestion(): Promise<void> {
    try {
      const activeSources = this.dataSources.filter(source => source.isActive);
      
      for (const source of activeSources) {
        const job = schedule(source.updateFrequency, async () => {
          try {
            logger.info(`Starting scheduled ingestion for source: ${source.id}`);
            await this.ingestFromSource(source.id);
          } catch (error) {
            logger.error(`Scheduled ingestion failed for source ${source.id}:`, error);
          }
        }, {
          scheduled: true,
          timezone: 'UTC',
        });

        this.scheduledJobs.set(source.id, job);
        logger.info(`Scheduled ingestion job for source: ${source.id} (${source.updateFrequency})`);
      }
    } catch (error) {
      logger.error('Failed to start scheduled ingestion:', error);
      throw error;
    }
  }

  private async performInitialIngestion(): Promise<void> {
    try {
      logger.info('Starting initial regulatory data ingestion...');
      
      const activeSources = this.dataSources.filter(source => source.isActive);
      const results = await Promise.allSettled(
        activeSources.map(source => this.ingestFromSource(source.id))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Initial ingestion completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      logger.error('Failed to perform initial ingestion:', error);
    }
  }

  public async ingestFromSource(sourceId: string): Promise<void> {
    try {
      const source = this.dataSources.find(s => s.id === sourceId);
      if (!source) {
        throw new Error(`Source not found: ${sourceId}`);
      }

      logger.info(`Ingesting data from source: ${source.name} (${source.jurisdiction})`);

      // Update last checked timestamp
      await this.updateSourceLastChecked(sourceId);

      // Fetch data based on source type
      let rawData: any;
      switch (source.type) {
        case 'API':
          rawData = await this.fetchFromAPI(source);
          break;
        case 'SCRAPE':
          rawData = await this.scrapeFromWeb(source);
          break;
        case 'RSS':
          rawData = await this.fetchFromRSS(source);
          break;
        case 'JSON':
          rawData = await this.fetchFromJSON(source);
          break;
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }

      // Parse data using appropriate parser
      const parsedData = await this.parseData(rawData, source);

      // Detect changes
      const changeResult = await this.detectChanges(parsedData, sourceId);

      if (changeResult.hasChanges) {
        // Update knowledge base
        await this.updateKnowledgeBase(changeResult, sourceId);
        
        // Retrain models if significant changes
        if (changeResult.newDocuments.length > 0 || changeResult.updatedDocuments.length > 0) {
          await this.retrainModels(source.jurisdiction);
        }

        logger.info(`Source ${sourceId} updated: ${changeResult.newDocuments.length} new, ${changeResult.updatedDocuments.length} updated`);
      } else {
        logger.info(`No changes detected for source: ${sourceId}`);
      }

      // Update last updated timestamp
      await this.updateSourceLastUpdated(sourceId);

    } catch (error) {
      logger.error(`Failed to ingest from source ${sourceId}:`, error);
      throw error;
    }
  }

  private async fetchFromAPI(source: RegulatoryDataSource): Promise<any> {
    try {
      // Build headers with authentication
      const headers: any = {
        'User-Agent': 'AML-KYC-Advisory-Agent/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      // Add API key if available
      if (source.metadata?.apiKey) {
        headers['Authorization'] = `Bearer ${source.metadata.apiKey}`;
      }

      // Add custom user agent if specified
      if (source.metadata?.userAgent) {
        headers['User-Agent'] = source.metadata.userAgent;
      }

      // Build request config
      const config: any = {
        timeout: 30000,
        headers,
      };

      // Add search parameters if available
      if (source.metadata?.searchParams) {
        config.params = source.metadata.searchParams;
      }

      // Apply rate limiting
      await this.applyRateLimit(source);

      const response = await axios.get(source.url, config);

      // Log successful API call
      logger.info(`API fetch successful for ${source.id}: ${response.status} ${response.statusText}`);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          // Rate limit exceeded - wait and retry
          logger.warn(`Rate limit exceeded for ${source.id}, waiting before retry`);
          await this.handleRateLimitError(source);
          return this.fetchFromAPI(source); // Retry once
        } else if (error.response?.status === 401) {
          logger.error(`Authentication failed for ${source.id}: Invalid API key`);
          throw new Error(`Authentication failed for ${source.id}`);
        } else if (error.response?.status === 403) {
          logger.error(`Access forbidden for ${source.id}: Check API permissions`);
          throw new Error(`Access forbidden for ${source.id}`);
        } else if (error.response?.status >= 500) {
          logger.error(`Server error for ${source.id}: ${error.response.status}`);
          throw new Error(`Server error for ${source.id}: ${error.response.status}`);
        }
      }
      
      logger.error(`API fetch failed for ${source.id}:`, error);
      throw error;
    }
  }

  private async scrapeFromWeb(source: RegulatoryDataSource): Promise<any> {
    try {
      const response = await axios.get(source.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      // Note: Web scraping functionality removed in favor of API-first approach
      // This method is kept for fallback compatibility
      return {
        html: response.data,
        url: source.url,
      };
    } catch (error) {
      logger.error(`Web scraping failed for ${source.id}:`, error);
      throw error;
    }
  }

  private async fetchFromRSS(source: RegulatoryDataSource): Promise<any> {
    // Implementation for RSS feeds
    try {
      const response = await axios.get(source.url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });

      return response.data;
    } catch (error) {
      logger.error(`RSS fetch failed for ${source.id}:`, error);
      throw error;
    }
  }

  private async fetchFromJSON(source: RegulatoryDataSource): Promise<any> {
    try {
      const response = await axios.get(source.url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error(`JSON fetch failed for ${source.id}:`, error);
      throw error;
    }
  }

  private async parseData(rawData: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    try {
      switch (source.parser) {
        // UK API Parsers
        case 'fca-aml-parser':
          return this.parseFCAAMLData(rawData, source);
        case 'legislation-gov-parser':
          return this.parseLegislationGovData(rawData, source);
        case 'fca-regdata-parser':
          return this.parseFCARegDataAPI(rawData, source);
        
        // EU API Parsers
        case 'eba-aml-api-parser':
          return this.parseEBAAMLAPI(rawData, source);
        case 'eur-lex-api-parser':
          return this.parseEurLexData(rawData, source); // Using existing parser for now
        case 'directive-api-parser':
          return this.parseDirectiveData(rawData, source); // Using existing parser for now
        
        // US API Parsers
        case 'treasury-ofac-api-parser':
          return this.parseTreasuryOFACAPI(rawData, source);
        case 'fincen-api-parser':
          return this.parseFinCENAPI(rawData, source);
        case 'bsa-regulations-api-parser':
          return this.parseBSARegulationsData(rawData, source); // Using existing parser for now
        case 'federal-register-api-parser':
          return this.parseFederalRegisterData(rawData, source); // Using existing parser for now
        case 'sec-edgar-api-parser':
          return this.parseFederalRegisterData(rawData, source); // Using existing parser for now
        
        // Additional Jurisdiction API Parsers
        case 'fintrac-api-parser':
          return this.parseFINTRACData(rawData, source); // Using existing parser for now
        case 'austrac-api-parser':
          return this.parseAUSTRACData(rawData, source); // Using existing parser for now
        case 'mas-aml-api-parser':
          return this.parseMASAMLData(rawData, source); // Using existing parser for now
        
        // Third-party API Parsers
        case 'complyadvantage-api-parser':
          return this.parseComplyAdvantageAPI(rawData, source);
        case 'lexisnexis-api-parser':
          return this.parseComplyAdvantageAPI(rawData, source); // Using existing parser for now
        
        // Legacy web scraping parsers (fallback)
        case 'fca-handbook-parser':
          return this.parseFCAHandbookData(rawData, source);
        case 'eba-aml-parser':
          return this.parseEBAAMLData(rawData, source);
        case 'eur-lex-parser':
          return this.parseEurLexData(rawData, source);
        case 'directive-parser':
          return this.parseDirectiveData(rawData, source);
        case 'treasury-sdn-parser':
          return this.parseTreasurySDNData(rawData, source);
        case 'fincen-advisories-parser':
          return this.parseFinCENAdvisoriesData(rawData, source);
        case 'bsa-regulations-parser':
          return this.parseBSARegulationsData(rawData, source);
        case 'federal-register-parser':
          return this.parseFederalRegisterData(rawData, source);
        case 'fintrac-parser':
          return this.parseFINTRACData(rawData, source);
        case 'austrac-parser':
          return this.parseAUSTRACData(rawData, source);
        case 'mas-aml-parser':
          return this.parseMASAMLData(rawData, source);
        
        default:
          throw new Error(`Unknown parser: ${source.parser}`);
      }
    } catch (error) {
      logger.error(`Data parsing failed for ${source.id}:`, error);
      throw error;
    }
  }

  // Parser implementations for different sources
  private async parseFCAAMLData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      if (data && data.regulations) {
        for (const regulation of data.regulations) {
          const update: RegulatoryUpdate = {
            id: `fca-aml-${regulation.id}`,
            sourceId: source.id,
            title: regulation.title || 'FCA AML Regulation',
            content: regulation.content || regulation.description || '',
            jurisdiction: source.jurisdiction,
            regulation: 'FCA_AML',
            section: regulation.section,
            version: regulation.version || '1.0',
            effectiveDate: regulation.effectiveDate ? new Date(regulation.effectiveDate) : undefined,
            lastUpdated: new Date(),
            changeType: 'NEW',
            metadata: {
              source: 'FCA',
              type: 'AML_REGULATION',
              originalData: regulation,
            },
            hash: this.generateHash(regulation.content || regulation.description || ''),
          };
          updates.push(update);
        }
      }
    } catch (error) {
      logger.error('FCA AML parsing error:', error);
    }

    return updates;
  }

  private async parseLegislationGovData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      if (data && data.legislation) {
        const update: RegulatoryUpdate = {
          id: `uk-leg-${data.legislation.id}`,
          sourceId: source.id,
          title: data.legislation.title || 'UK AML Legislation',
          content: data.legislation.content || data.legislation.text || '',
          jurisdiction: source.jurisdiction,
          regulation: 'UK_AML_REGULATIONS',
          section: data.legislation.section,
          version: data.legislation.version || '1.0',
          effectiveDate: data.legislation.effectiveDate ? new Date(data.legislation.effectiveDate) : undefined,
          lastUpdated: new Date(),
          changeType: 'NEW',
          metadata: {
            source: 'UK_LEGISLATION',
            type: 'LEGISLATION',
            originalData: data.legislation,
          },
          hash: this.generateHash(data.legislation.content || data.legislation.text || ''),
        };
        updates.push(update);
      }
    } catch (error) {
      logger.error('UK Legislation parsing error:', error);
    }

    return updates;
  }

  private async parseFCAHandbookData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse FCA Handbook AML sections
        $('.handbook-section').each((index, element) => {
          const $section = $(element);
          const title = $section.find('h2, h3').first().text().trim();
          const content = $section.find('.handbook-content').text().trim();
          
          if (title && content) {
            const update: RegulatoryUpdate = {
              id: `fca-handbook-${index}`,
              sourceId: source.id,
              title: title,
              content: content,
              jurisdiction: source.jurisdiction,
              regulation: 'FCA_HANDBOOK',
              section: $section.attr('data-section'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'FCA_HANDBOOK',
                type: 'HANDBOOK_SECTION',
                url: data.url,
              },
              hash: this.generateHash(content),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('FCA Handbook parsing error:', error);
    }

    return updates;
  }

  private async parseEBAAMLData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse EBA AML guidelines
        $('.guideline-item, .regulation-item').each((index, element) => {
          const $item = $(element);
          const title = $item.find('h3, h4').first().text().trim();
          const content = $item.find('.content, .description').text().trim();
          
          if (title && content) {
            const update: RegulatoryUpdate = {
              id: `eba-aml-${index}`,
              sourceId: source.id,
              title: title,
              content: content,
              jurisdiction: source.jurisdiction,
              regulation: 'EBA_AML_GUIDELINES',
              section: $item.attr('data-section'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'EBA',
                type: 'AML_GUIDELINE',
                url: data.url,
              },
              hash: this.generateHash(content),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('EBA AML parsing error:', error);
    }

    return updates;
  }

  private async parseEurLexData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse EUR-Lex documents
        $('.document-item, .legal-text').each((index, element) => {
          const $item = $(element);
          const title = $item.find('h2, h3, .title').first().text().trim();
          const content = $item.find('.content, .text').text().trim();
          
          if (title && content) {
            const update: RegulatoryUpdate = {
              id: `eur-lex-${index}`,
              sourceId: source.id,
              title: title,
              content: content,
              jurisdiction: source.jurisdiction,
              regulation: 'EU_AML_DIRECTIVE',
              section: $item.attr('data-section'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'EUR_LEX',
                type: 'LEGAL_DOCUMENT',
                url: data.url,
              },
              hash: this.generateHash(content),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('EUR-Lex parsing error:', error);
    }

    return updates;
  }

  private async parseDirectiveData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse 5th AML Directive
        $('.directive-article, .legal-article').each((index, element) => {
          const $article = $(element);
          const title = $article.find('h3, .article-title').first().text().trim();
          const content = $article.find('.article-content, .text').text().trim();
          
          if (title && content) {
            const update: RegulatoryUpdate = {
              id: `directive-5-${index}`,
              sourceId: source.id,
              title: title,
              content: content,
              jurisdiction: source.jurisdiction,
              regulation: '5TH_AML_DIRECTIVE',
              section: $article.attr('data-article'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'EU_DIRECTIVE',
                type: 'DIRECTIVE_ARTICLE',
                url: data.url,
              },
              hash: this.generateHash(content),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('Directive parsing error:', error);
    }

    return updates;
  }

  private async parseTreasurySDNData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse Treasury SDN List
        $('.sdn-entry, .sanctions-entry').each((index, element) => {
          const $entry = $(element);
          const name = $entry.find('.name, .entity-name').first().text().trim();
          const details = $entry.find('.details, .description').text().trim();
          
          if (name && details) {
            const update: RegulatoryUpdate = {
              id: `treasury-sdn-${index}`,
              sourceId: source.id,
              title: `SDN Entry: ${name}`,
              content: details,
              jurisdiction: source.jurisdiction,
              regulation: 'TREASURY_SDN',
              section: $entry.attr('data-program'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'TREASURY',
                type: 'SANCTIONS_ENTRY',
                entityName: name,
                url: data.url,
              },
              hash: this.generateHash(details),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('Treasury SDN parsing error:', error);
    }

    return updates;
  }

  private async parseFinCENAdvisoriesData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse FinCEN Advisories
        $('.advisory-item, .guidance-item').each((index, element) => {
          const $item = $(element);
          const title = $item.find('h3, .advisory-title').first().text().trim();
          const content = $item.find('.advisory-content, .content').text().trim();
          
          if (title && content) {
            const update: RegulatoryUpdate = {
              id: `fincen-advisory-${index}`,
              sourceId: source.id,
              title: title,
              content: content,
              jurisdiction: source.jurisdiction,
              regulation: 'FINCEN_ADVISORY',
              section: $item.attr('data-advisory-number'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'FINCEN',
                type: 'ADVISORY',
                url: data.url,
              },
              hash: this.generateHash(content),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('FinCEN Advisories parsing error:', error);
    }

    return updates;
  }

  private async parseBSARegulationsData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse BSA Regulations
        $('.regulation-section, .bsa-section').each((index, element) => {
          const $section = $(element);
          const title = $section.find('h3, .section-title').first().text().trim();
          const content = $section.find('.section-content, .regulation-text').text().trim();
          
          if (title && content) {
            const update: RegulatoryUpdate = {
              id: `bsa-regulation-${index}`,
              sourceId: source.id,
              title: title,
              content: content,
              jurisdiction: source.jurisdiction,
              regulation: 'BANK_SECRECY_ACT',
              section: $section.attr('data-section'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'FINCEN_BSA',
                type: 'REGULATION',
                url: data.url,
              },
              hash: this.generateHash(content),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('BSA Regulations parsing error:', error);
    }

    return updates;
  }

  private async parseFederalRegisterData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      if (data && data.results) {
        for (const result of data.results) {
          const update: RegulatoryUpdate = {
            id: `federal-register-${result.document_number}`,
            sourceId: source.id,
            title: result.title || 'Federal Register Entry',
            content: result.abstract || result.summary || '',
            jurisdiction: source.jurisdiction,
            regulation: 'FEDERAL_REGISTER',
            section: result.agency_names?.join(', '),
            version: '1.0',
            effectiveDate: result.effective_on ? new Date(result.effective_on) : undefined,
            lastUpdated: new Date(),
            changeType: 'NEW',
            metadata: {
              source: 'FEDERAL_REGISTER',
              type: 'REGULATORY_ENTRY',
              documentNumber: result.document_number,
              originalData: result,
            },
            hash: this.generateHash(result.abstract || result.summary || ''),
          };
          updates.push(update);
        }
      }
    } catch (error) {
      logger.error('Federal Register parsing error:', error);
    }

    return updates;
  }

  private async parseFINTRACData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse FINTRAC Guidance
        $('.guidance-item, .fintrac-item').each((index, element) => {
          const $item = $(element);
          const title = $item.find('h3, .guidance-title').first().text().trim();
          const content = $item.find('.guidance-content, .content').text().trim();
          
          if (title && content) {
            const update: RegulatoryUpdate = {
              id: `fintrac-${index}`,
              sourceId: source.id,
              title: title,
              content: content,
              jurisdiction: source.jurisdiction,
              regulation: 'FINTRAC_GUIDANCE',
              section: $item.attr('data-guidance-type'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'FINTRAC',
                type: 'GUIDANCE',
                url: data.url,
              },
              hash: this.generateHash(content),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('FINTRAC parsing error:', error);
    }

    return updates;
  }

  private async parseAUSTRACData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse AUSTRAC Guidance
        $('.austrac-item, .guidance-item').each((index, element) => {
          const $item = $(element);
          const title = $item.find('h3, .item-title').first().text().trim();
          const content = $item.find('.item-content, .content').text().trim();
          
          if (title && content) {
            const update: RegulatoryUpdate = {
              id: `austrac-${index}`,
              sourceId: source.id,
              title: title,
              content: content,
              jurisdiction: source.jurisdiction,
              regulation: 'AUSTRAC_GUIDANCE',
              section: $item.attr('data-guidance-type'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'AUSTRAC',
                type: 'GUIDANCE',
                url: data.url,
              },
              hash: this.generateHash(content),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('AUSTRAC parsing error:', error);
    }

    return updates;
  }

  private async parseMASAMLData(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      const $ = data.$;
      if ($) {
        // Parse MAS AML Guidelines
        $('.mas-item, .guideline-item').each((index, element) => {
          const $item = $(element);
          const title = $item.find('h3, .item-title').first().text().trim();
          const content = $item.find('.item-content, .content').text().trim();
          
          if (title && content) {
            const update: RegulatoryUpdate = {
              id: `mas-${index}`,
              sourceId: source.id,
              title: title,
              content: content,
              jurisdiction: source.jurisdiction,
              regulation: 'MAS_AML_GUIDELINES',
              section: $item.attr('data-guideline-type'),
              version: '1.0',
              lastUpdated: new Date(),
              changeType: 'NEW',
              metadata: {
                source: 'MAS',
                type: 'GUIDELINE',
                url: data.url,
              },
              hash: this.generateHash(content),
            };
            updates.push(update);
          }
        });
      }
    } catch (error) {
      logger.error('MAS AML parsing error:', error);
    }

    return updates;
  }

  // New API-based parser implementations
  private async parseFCARegDataAPI(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      if (data && data.regulatoryData) {
        for (const item of data.regulatoryData) {
          const update: RegulatoryUpdate = {
            id: `fca-regdata-${item.id}`,
            sourceId: source.id,
            title: item.title || 'FCA Regulatory Data',
            content: item.content || item.description || '',
            jurisdiction: source.jurisdiction,
            regulation: 'FCA_REGDATA',
            section: item.section,
            version: item.version || '1.0',
            effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : undefined,
            lastUpdated: new Date(),
            changeType: 'NEW',
            metadata: {
              source: 'FCA_REGDATA',
              type: 'REGULATORY_DATA',
              originalData: item,
            },
            hash: this.generateHash(item.content || item.description || ''),
          };
          updates.push(update);
        }
      }
    } catch (error) {
      logger.error('FCA RegData API parsing error:', error);
    }

    return updates;
  }

  private async parseEBAAMLAPI(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      if (data && data.guidelines) {
        for (const guideline of data.guidelines) {
          const update: RegulatoryUpdate = {
            id: `eba-aml-api-${guideline.id}`,
            sourceId: source.id,
            title: guideline.title || 'EBA AML Guideline',
            content: guideline.content || guideline.text || '',
            jurisdiction: source.jurisdiction,
            regulation: 'EBA_AML_GUIDELINES',
            section: guideline.section,
            version: guideline.version || '1.0',
            effectiveDate: guideline.effectiveDate ? new Date(guideline.effectiveDate) : undefined,
            lastUpdated: new Date(),
            changeType: 'NEW',
            metadata: {
              source: 'EBA_API',
              type: 'AML_GUIDELINE',
              originalData: guideline,
            },
            hash: this.generateHash(guideline.content || guideline.text || ''),
          };
          updates.push(update);
        }
      }
    } catch (error) {
      logger.error('EBA AML API parsing error:', error);
    }

    return updates;
  }

  private async parseTreasuryOFACAPI(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      if (data && data.sanctions) {
        for (const sanction of data.sanctions) {
          const update: RegulatoryUpdate = {
            id: `treasury-ofac-api-${sanction.id}`,
            sourceId: source.id,
            title: `OFAC Sanction: ${sanction.name}`,
            content: sanction.details || sanction.description || '',
            jurisdiction: source.jurisdiction,
            regulation: 'OFAC_SANCTIONS',
            section: sanction.program,
            version: '1.0',
            effectiveDate: sanction.effectiveDate ? new Date(sanction.effectiveDate) : undefined,
            lastUpdated: new Date(),
            changeType: 'NEW',
            metadata: {
              source: 'TREASURY_OFAC_API',
              type: 'SANCTIONS_ENTRY',
              entityName: sanction.name,
              originalData: sanction,
            },
            hash: this.generateHash(sanction.details || sanction.description || ''),
          };
          updates.push(update);
        }
      }
    } catch (error) {
      logger.error('Treasury OFAC API parsing error:', error);
    }

    return updates;
  }

  private async parseFinCENAPI(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      if (data && data.advisories) {
        for (const advisory of data.advisories) {
          const update: RegulatoryUpdate = {
            id: `fincen-api-${advisory.id}`,
            sourceId: source.id,
            title: advisory.title || 'FinCEN Advisory',
            content: advisory.content || advisory.text || '',
            jurisdiction: source.jurisdiction,
            regulation: 'FINCEN_ADVISORY',
            section: advisory.advisoryNumber,
            version: advisory.version || '1.0',
            effectiveDate: advisory.effectiveDate ? new Date(advisory.effectiveDate) : undefined,
            lastUpdated: new Date(),
            changeType: 'NEW',
            metadata: {
              source: 'FINCEN_API',
              type: 'ADVISORY',
              originalData: advisory,
            },
            hash: this.generateHash(advisory.content || advisory.text || ''),
          };
          updates.push(update);
        }
      }
    } catch (error) {
      logger.error('FinCEN API parsing error:', error);
    }

    return updates;
  }

  private async parseComplyAdvantageAPI(data: any, source: RegulatoryDataSource): Promise<RegulatoryUpdate[]> {
    const updates: RegulatoryUpdate[] = [];
    
    try {
      if (data && data.sanctions) {
        for (const sanction of data.sanctions) {
          const update: RegulatoryUpdate = {
            id: `complyadvantage-api-${sanction.id}`,
            sourceId: source.id,
            title: `Global Sanction: ${sanction.name}`,
            content: sanction.details || sanction.description || '',
            jurisdiction: source.jurisdiction,
            regulation: 'GLOBAL_SANCTIONS',
            section: sanction.list,
            version: '1.0',
            effectiveDate: sanction.effectiveDate ? new Date(sanction.effectiveDate) : undefined,
            lastUpdated: new Date(),
            changeType: 'NEW',
            metadata: {
              source: 'COMPLYADVANTAGE_API',
              type: 'GLOBAL_SANCTIONS',
              entityName: sanction.name,
              originalData: sanction,
            },
            hash: this.generateHash(sanction.details || sanction.description || ''),
          };
          updates.push(update);
        }
      }
    } catch (error) {
      logger.error('ComplyAdvantage API parsing error:', error);
    }

    return updates;
  }

  private async detectChanges(newData: RegulatoryUpdate[], sourceId: string): Promise<ChangeDetectionResult> {
    try {
      const result: ChangeDetectionResult = {
        hasChanges: false,
        newDocuments: [],
        updatedDocuments: [],
        removedDocuments: [],
      };

      // Get existing documents for this source
      const existingDocs = await this.prisma.regulatoryDocument.findMany({
        where: { metadata: { path: ['sourceId'], equals: sourceId } },
      });

      const existingHashes = new Map(existingDocs.map(doc => [doc.id, doc.metadata?.hash]));

      // Check for new and updated documents
      for (const newDoc of newData) {
        const existingHash = existingHashes.get(newDoc.id);
        
        if (!existingHash) {
          // New document
          result.newDocuments.push(newDoc);
          result.hasChanges = true;
        } else if (existingHash !== newDoc.hash) {
          // Updated document
          result.updatedDocuments.push(newDoc);
          result.hasChanges = true;
        }
      }

      // Check for removed documents
      const newDocIds = new Set(newData.map(doc => doc.id));
      for (const existingDoc of existingDocs) {
        if (!newDocIds.has(existingDoc.id)) {
          result.removedDocuments.push(existingDoc.id);
          result.hasChanges = true;
        }
      }

      return result;
    } catch (error) {
      logger.error('Change detection failed:', error);
      throw error;
    }
  }

  private async updateKnowledgeBase(changeResult: ChangeDetectionResult, sourceId: string): Promise<void> {
    try {
      // Add new documents
      for (const newDoc of changeResult.newDocuments) {
        await knowledgeService.addRegulatoryDocument({
          id: newDoc.id,
          title: newDoc.title,
          content: newDoc.content,
          jurisdiction: newDoc.jurisdiction,
          regulation: newDoc.regulation,
          section: newDoc.section,
          version: newDoc.version,
          lastUpdated: newDoc.lastUpdated,
          metadata: {
            ...newDoc.metadata,
            sourceId: sourceId,
            hash: newDoc.hash,
            changeType: newDoc.changeType,
          },
        });
      }

      // Update existing documents
      for (const updatedDoc of changeResult.updatedDocuments) {
        await knowledgeService.updateRegulatoryDocument(updatedDoc.id, {
          title: updatedDoc.title,
          content: updatedDoc.content,
          version: updatedDoc.version,
          lastUpdated: updatedDoc.lastUpdated,
          metadata: {
            ...updatedDoc.metadata,
            sourceId: sourceId,
            hash: updatedDoc.hash,
            changeType: updatedDoc.changeType,
          },
        });
      }

      // Remove deleted documents
      for (const removedDocId of changeResult.removedDocuments) {
        await knowledgeService.deleteRegulatoryDocument(removedDocId);
      }

      logger.info(`Knowledge base updated: ${changeResult.newDocuments.length} new, ${changeResult.updatedDocuments.length} updated, ${changeResult.removedDocuments.length} removed`);
    } catch (error) {
      logger.error('Failed to update knowledge base:', error);
      throw error;
    }
  }

  private async retrainModels(jurisdiction: string): Promise<void> {
    try {
      logger.info(`Retraining models for jurisdiction: ${jurisdiction}`);
      
      // Publish retraining event to data pipeline
      await dataPipelineService.ingestComplianceCheck({
        id: `retrain-${jurisdiction}-${Date.now()}`,
        type: 'KYC', // Using valid type
        entityId: jurisdiction,
        entityType: 'CUSTOMER', // Using valid type
        status: 'PENDING',
        data: {
          jurisdiction,
          trigger: 'REGULATORY_UPDATE',
          timestamp: new Date(),
        },
        timestamp: new Date(),
      });

      logger.info(`Model retraining initiated for jurisdiction: ${jurisdiction}`);
    } catch (error) {
      logger.error(`Failed to retrain models for jurisdiction ${jurisdiction}:`, error);
    }
  }

  private generateHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private async applyRateLimit(source: RegulatoryDataSource): Promise<void> {
    const rateLimit = source.metadata?.rateLimit;
    if (!rateLimit) return;

    // Simple rate limiting implementation
    // In production, you might want to use Redis or a more sophisticated rate limiter
    const [limit, period] = rateLimit.split('/');
    const limitNum = parseInt(limit);
    const periodMs = this.parsePeriodToMs(period);

    // Check if we need to wait
    const now = Date.now();
    const lastCall = this.getLastCallTime(source.id);
    
    if (lastCall && (now - lastCall) < periodMs) {
      const waitTime = periodMs - (now - lastCall);
      logger.info(`Rate limiting ${source.id}: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.setLastCallTime(source.id, now);
  }

  private parsePeriodToMs(period: string): number {
    switch (period) {
      case 'second': return 1000;
      case 'minute': return 60 * 1000;
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      default: return 1000; // Default to 1 second
    }
  }

  private lastCallTimes: Map<string, number> = new Map();

  private getLastCallTime(sourceId: string): number | undefined {
    return this.lastCallTimes.get(sourceId);
  }

  private setLastCallTime(sourceId: string, time: number): void {
    this.lastCallTimes.set(sourceId, time);
  }

  private async handleRateLimitError(source: RegulatoryDataSource): Promise<void> {
    // Exponential backoff for rate limit errors
    const backoffTime = Math.min(30000, 1000 * Math.pow(2, this.getRetryCount(source.id)));
    logger.info(`Rate limit backoff for ${source.id}: waiting ${backoffTime}ms`);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    this.incrementRetryCount(source.id);
  }

  private retryCounts: Map<string, number> = new Map();

  private getRetryCount(sourceId: string): number {
    return this.retryCounts.get(sourceId) || 0;
  }

  private incrementRetryCount(sourceId: string): void {
    const current = this.getRetryCount(sourceId);
    this.retryCounts.set(sourceId, current + 1);
  }

  private resetRetryCount(sourceId: string): void {
    this.retryCounts.delete(sourceId);
  }

  private async updateSourceLastChecked(sourceId: string): Promise<void> {
    try {
      await this.prisma.regulatoryDataSource.update({
        where: { id: sourceId },
        data: { lastChecked: new Date() },
      });
    } catch (error) {
      logger.error(`Failed to update last checked for source ${sourceId}:`, error);
    }
  }

  private async updateSourceLastUpdated(sourceId: string): Promise<void> {
    try {
      await this.prisma.regulatoryDataSource.update({
        where: { id: sourceId },
        data: { lastUpdated: new Date() },
      });
    } catch (error) {
      logger.error(`Failed to update last updated for source ${sourceId}:`, error);
    }
  }

  public async getIngestionStats(): Promise<{
    totalSources: number;
    activeSources: number;
    lastIngestion: Date | null;
    totalDocuments: number;
    jurisdictions: string[];
  }> {
    try {
      const [sources, documents, lastIngestion] = await Promise.all([
        this.prisma.regulatoryDataSource.findMany(),
        this.prisma.regulatoryDocument.count(),
        this.prisma.regulatoryDataSource.findFirst({
          orderBy: { lastUpdated: 'desc' },
          select: { lastUpdated: true },
        }),
      ]);

      const activeSources = sources.filter(s => s.isActive).length;
      const jurisdictions = [...new Set(sources.map(s => s.jurisdiction as string))];

      return {
        totalSources: sources.length,
        activeSources,
        lastIngestion: lastIngestion?.lastUpdated || null,
        totalDocuments: documents,
        jurisdictions,
      };
    } catch (error) {
      logger.error('Failed to get ingestion stats:', error);
      return {
        totalSources: 0,
        activeSources: 0,
        lastIngestion: null,
        totalDocuments: 0,
        jurisdictions: [],
      };
    }
  }

  public async stopScheduledIngestion(): Promise<void> {
    try {
      for (const [sourceId, job] of this.scheduledJobs) {
        job.destroy();
        logger.info(`Stopped scheduled ingestion for source: ${sourceId}`);
      }
      this.scheduledJobs.clear();
    } catch (error) {
      logger.error('Failed to stop scheduled ingestion:', error);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await this.stopScheduledIngestion();
      await this.prisma.$disconnect();
      logger.info('Regulatory Data Ingestion Service shutdown complete');
    } catch (error) {
      logger.error('Failed to shutdown Regulatory Data Ingestion Service:', error);
    }
  }
}

export const regulatoryDataIngestionService = RegulatoryDataIngestionService.getInstance();
