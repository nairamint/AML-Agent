import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as xml2js from 'xml2js';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface EntityData {
  name: string;
  address?: string;
  country?: string;
  dateOfBirth?: string;
  nationality?: string;
  entityType?: 'INDIVIDUAL' | 'CORPORATE' | 'VESSEL' | 'AIRCRAFT';
  additionalInfo?: any;
}

export interface SanctionsMatch {
  id: string;
  name: string;
  type: string;
  jurisdiction: string;
  matchScore: number;
  matchDetails: {
    field: string;
    value: string;
    confidence: number;
  }[];
  source: string;
  lastUpdated: Date;
  aliases?: string[];
  dateOfBirth?: string;
  nationality?: string;
}

export interface ScreeningResult {
  requestId: string;
  entityName: string;
  matchesFound: boolean;
  matches: SanctionsMatch[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
  timestamp: Date;
  sources: {
    [key: string]: {
      status: 'success' | 'error' | 'timeout';
      matches: number;
      error?: string;
    };
  };
}

export interface MoovWatchmanCredentials {
  publicKey: string;
  privateKey: string;
  endpoint: string;
}

export interface SanctionsAPIConfig {
  ofac: {
    endpoint: string;
    apiKey?: string;
  };
  eu: {
    endpoint: string;
    apiKey?: string;
  };
  un: {
    endpoint: string;
    apiKey?: string;
  };
  uk: {
    endpoint: string;
    apiKey?: string;
  };
}

export class ProductionSanctionsScreening {
  private static instance: ProductionSanctionsScreening;
  private moovCredentials: MoovWatchmanCredentials;
  private sanctionsAPIs: SanctionsAPIConfig;
  private httpClient: AxiosInstance;
  private isInitialized = false;

  private constructor() {
    this.moovCredentials = {
      publicKey: process.env.MOOV_PUBLIC_KEY || '',
      privateKey: process.env.MOOV_PRIVATE_KEY || '',
      endpoint: process.env.MOOV_WATCHMAN_ENDPOINT || 'https://api.moov.io/watchman'
    };

    this.sanctionsAPIs = {
      ofac: {
        endpoint: process.env.OFAC_API_ENDPOINT || 'https://api.ofac-api.com/v4/search',
        apiKey: process.env.OFAC_API_KEY
      },
      eu: {
        endpoint: process.env.EU_SANCTIONS_ENDPOINT || 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content',
        apiKey: process.env.EU_SANCTIONS_API_KEY
      },
      un: {
        endpoint: process.env.UN_SANCTIONS_ENDPOINT || 'https://scsanctions.un.org/resources/xml/en/consolidated.xml',
        apiKey: process.env.UN_SANCTIONS_API_KEY
      },
      uk: {
        endpoint: process.env.UK_SANCTIONS_ENDPOINT || 'https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.json',
        apiKey: process.env.UK_SANCTIONS_API_KEY
      }
    };

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'AML-KYC-Agent/1.0',
        'Accept': 'application/json, application/xml, text/xml'
      }
    });
  }

  public static getInstance(): ProductionSanctionsScreening {
    if (!ProductionSanctionsScreening.instance) {
      ProductionSanctionsScreening.instance = new ProductionSanctionsScreening();
    }
    return ProductionSanctionsScreening.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Validate credentials
      await this.validateCredentials();
      
      this.isInitialized = true;
      logger.info('Production Sanctions Screening initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Production Sanctions Screening:', error);
      throw error;
    }
  }

  private async validateCredentials(): Promise<void> {
    if (!this.moovCredentials.publicKey || !this.moovCredentials.privateKey) {
      throw new Error('Moov Watchman credentials are required');
    }

    // Test Moov Watchman connection
    try {
      await this.testMoovConnection();
    } catch (error) {
      logger.warn('Moov Watchman connection test failed:', error);
      // Continue with other APIs even if Moov fails
    }
  }

  private async testMoovConnection(): Promise<void> {
    const testPayload = {
      name: 'Test Entity',
      address: 'Test Address',
      country: 'US'
    };

    try {
      await this.screenWithMoovWatchman(testPayload);
      logger.info('Moov Watchman connection test successful');
    } catch (error) {
      logger.error('Moov Watchman connection test failed:', error);
      throw error;
    }
  }

  public async comprehensiveScreening(entityData: EntityData): Promise<ScreeningResult> {
    const requestId = `screening-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const results: { [key: string]: SanctionsMatch[] } = {};
    const sourceStatus: { [key: string]: { status: 'success' | 'error' | 'timeout'; matches: number; error?: string } } = {};

    logger.info(`Starting comprehensive sanctions screening for entity: ${entityData.name}`, { requestId });

    try {
      // Screen with Moov Watchman
      try {
        const moovResults = await this.screenWithMoovWatchman(entityData);
        results.moov = moovResults;
        sourceStatus.moov = { status: 'success', matches: moovResults.length };
      } catch (error) {
        logger.error('Moov Watchman screening failed:', error);
        sourceStatus.moov = { status: 'error', matches: 0, error: error.message };
      }

      // Screen with multiple sanctions APIs
      const apiPromises = Object.entries(this.sanctionsAPIs).map(async ([source, config]) => {
        try {
          const apiResults = await this.screenAgainstSource(entityData, source, config);
          results[source] = apiResults;
          sourceStatus[source] = { status: 'success', matches: apiResults.length };
        } catch (error) {
          logger.error(`${source} screening failed:`, error);
          sourceStatus[source] = { status: 'error', matches: 0, error: error.message };
        }
      });

      await Promise.allSettled(apiPromises);

      // Consolidate results
      const allMatches = this.consolidateScreeningResults(results);
      const riskLevel = this.determineRiskLevel(allMatches);
      const recommendations = this.generateRecommendations(allMatches, riskLevel);

      const screeningResult: ScreeningResult = {
        requestId,
        entityName: entityData.name,
        matchesFound: allMatches.length > 0,
        matches: allMatches,
        riskLevel,
        recommendations,
        timestamp: new Date(),
        sources: sourceStatus
      };

      logger.info(`Comprehensive screening completed: ${requestId}`, {
        entityName: entityData.name,
        matchesFound: allMatches.length,
        riskLevel,
        sources: Object.keys(sourceStatus).length
      });

      return screeningResult;
    } catch (error) {
      logger.error('Comprehensive screening failed:', error);
      throw error;
    }
  }

  private async screenWithMoovWatchman(entityData: EntityData): Promise<SanctionsMatch[]> {
    try {
      const payload = {
        name: entityData.name,
        address: entityData.address,
        country: entityData.country,
        dateOfBirth: entityData.dateOfBirth,
        nationality: entityData.nationality
      };

      const response = await this.httpClient.post(
        `${this.moovCredentials.endpoint}/search`,
        payload,
        {
          auth: {
            username: this.moovCredentials.publicKey,
            password: this.moovCredentials.privateKey
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseMoovWatchmanResponse(response.data);
    } catch (error) {
      logger.error('Moov Watchman screening error:', error);
      throw error;
    }
  }

  private parseMoovWatchmanResponse(data: any): SanctionsMatch[] {
    const matches: SanctionsMatch[] = [];

    if (data.matches && Array.isArray(data.matches)) {
      for (const match of data.matches) {
        matches.push({
          id: match.id || `moov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: match.name || 'Unknown',
          type: match.type || 'UNKNOWN',
          jurisdiction: match.jurisdiction || 'Unknown',
          matchScore: match.score || 0.5,
          matchDetails: match.details || [],
          source: 'Moov Watchman',
          lastUpdated: new Date(),
          aliases: match.aliases || [],
          dateOfBirth: match.dateOfBirth,
          nationality: match.nationality
        });
      }
    }

    return matches;
  }

  private async screenAgainstSource(entityData: EntityData, source: string, config: any): Promise<SanctionsMatch[]> {
    try {
      switch (source) {
        case 'ofac':
          return await this.screenWithOFAC(entityData, config);
        case 'eu':
          return await this.screenWithEU(entityData, config);
        case 'un':
          return await this.screenWithUN(entityData, config);
        case 'uk':
          return await this.screenWithUK(entityData, config);
        default:
          throw new Error(`Unknown sanctions source: ${source}`);
      }
    } catch (error) {
      logger.error(`Error screening with ${source}:`, error);
      throw error;
    }
  }

  private async screenWithOFAC(entityData: EntityData, config: any): Promise<SanctionsMatch[]> {
    try {
      const params = {
        name: entityData.name,
        type: entityData.entityType || 'INDIVIDUAL'
      };

      const headers: any = {};
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await this.httpClient.get(config.endpoint, {
        params,
        headers
      });

      return this.parseOFACResponse(response.data);
    } catch (error) {
      logger.error('OFAC screening error:', error);
      throw error;
    }
  }

  private parseOFACResponse(data: any): SanctionsMatch[] {
    const matches: SanctionsMatch[] = [];

    if (data.results && Array.isArray(data.results)) {
      for (const result of data.results) {
        matches.push({
          id: result.id || `ofac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: result.name || 'Unknown',
          type: result.type || 'UNKNOWN',
          jurisdiction: result.jurisdiction || 'US',
          matchScore: result.matchScore || 0.5,
          matchDetails: result.matchDetails || [],
          source: 'OFAC',
          lastUpdated: new Date(),
          aliases: result.aliases || [],
          dateOfBirth: result.dateOfBirth,
          nationality: result.nationality
        });
      }
    }

    return matches;
  }

  private async screenWithEU(entityData: EntityData, config: any): Promise<SanctionsMatch[]> {
    try {
      const response = await this.httpClient.get(config.endpoint, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });

      return this.parseEUResponse(response.data, entityData);
    } catch (error) {
      logger.error('EU sanctions screening error:', error);
      throw error;
    }
  }

  private async parseEUResponse(xmlData: string, entityData: EntityData): Promise<SanctionsMatch[]> {
    const matches: SanctionsMatch[] = [];

    try {
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      // Parse EU sanctions XML structure
      if (result.sanctions && result.sanctions.entity) {
        for (const entity of result.sanctions.entity) {
          const entityName = entity.name?.[0] || '';
          const matchScore = this.calculateNameSimilarity(entityData.name, entityName);
          
          if (matchScore > 0.6) {
            matches.push({
              id: entity.id?.[0] || `eu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: entityName,
              type: entity.type?.[0] || 'UNKNOWN',
              jurisdiction: 'EU',
              matchScore,
              matchDetails: [{
                field: 'name',
                value: entityName,
                confidence: matchScore
              }],
              source: 'EU Sanctions',
              lastUpdated: new Date(),
              aliases: entity.aliases || [],
              dateOfBirth: entity.dateOfBirth?.[0],
              nationality: entity.nationality?.[0]
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error parsing EU sanctions XML:', error);
    }

    return matches;
  }

  private async screenWithUN(entityData: EntityData, config: any): Promise<SanctionsMatch[]> {
    try {
      const response = await this.httpClient.get(config.endpoint, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });

      return this.parseUNResponse(response.data, entityData);
    } catch (error) {
      logger.error('UN sanctions screening error:', error);
      throw error;
    }
  }

  private async parseUNResponse(xmlData: string, entityData: EntityData): Promise<SanctionsMatch[]> {
    const matches: SanctionsMatch[] = [];

    try {
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlData);
      
      // Parse UN sanctions XML structure
      if (result.consolidatedList && result.consolidatedList.individual) {
        for (const individual of result.consolidatedList.individual) {
          const individualName = individual.firstName?.[0] + ' ' + individual.lastName?.[0] || '';
          const matchScore = this.calculateNameSimilarity(entityData.name, individualName);
          
          if (matchScore > 0.6) {
            matches.push({
              id: individual.id?.[0] || `un-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: individualName,
              type: 'INDIVIDUAL',
              jurisdiction: 'Global',
              matchScore,
              matchDetails: [{
                field: 'name',
                value: individualName,
                confidence: matchScore
              }],
              source: 'UN Sanctions',
              lastUpdated: new Date(),
              aliases: individual.aliases || [],
              dateOfBirth: individual.dateOfBirth?.[0],
              nationality: individual.nationality?.[0]
            });
          }
        }
      }

      if (result.consolidatedList && result.consolidatedList.entity) {
        for (const entity of result.consolidatedList.entity) {
          const entityName = entity.name?.[0] || '';
          const matchScore = this.calculateNameSimilarity(entityData.name, entityName);
          
          if (matchScore > 0.6) {
            matches.push({
              id: entity.id?.[0] || `un-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: entityName,
              type: 'CORPORATE',
              jurisdiction: 'Global',
              matchScore,
              matchDetails: [{
                field: 'name',
                value: entityName,
                confidence: matchScore
              }],
              source: 'UN Sanctions',
              lastUpdated: new Date(),
              aliases: entity.aliases || []
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error parsing UN sanctions XML:', error);
    }

    return matches;
  }

  private async screenWithUK(entityData: EntityData, config: any): Promise<SanctionsMatch[]> {
    try {
      const response = await this.httpClient.get(config.endpoint, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });

      return this.parseUKResponse(response.data, entityData);
    } catch (error) {
      logger.error('UK sanctions screening error:', error);
      throw error;
    }
  }

  private parseUKResponse(data: any, entityData: EntityData): SanctionsMatch[] {
    const matches: SanctionsMatch[] = [];

    try {
      if (data.Results && Array.isArray(data.Results)) {
        for (const result of data.Results) {
          const entityName = result.Name || '';
          const matchScore = this.calculateNameSimilarity(entityData.name, entityName);
          
          if (matchScore > 0.6) {
            matches.push({
              id: result.Id || `uk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: entityName,
              type: result.Type || 'UNKNOWN',
              jurisdiction: 'UK',
              matchScore,
              matchDetails: [{
                field: 'name',
                value: entityName,
                confidence: matchScore
              }],
              source: 'UK Sanctions',
              lastUpdated: new Date(),
              aliases: result.Aliases || [],
              dateOfBirth: result.DateOfBirth,
              nationality: result.Nationality
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error parsing UK sanctions response:', error);
    }

    return matches;
  }

  private consolidateScreeningResults(results: { [key: string]: SanctionsMatch[] }): SanctionsMatch[] {
    const consolidatedMatches: SanctionsMatch[] = [];
    const seenMatches = new Set<string>();

    for (const [source, matches] of Object.entries(results)) {
      for (const match of matches) {
        // Create a unique key for deduplication
        const matchKey = `${match.name.toLowerCase()}-${match.type}-${match.jurisdiction}`;
        
        if (!seenMatches.has(matchKey)) {
          seenMatches.add(matchKey);
          consolidatedMatches.push(match);
        } else {
          // Update existing match with higher score if applicable
          const existingMatch = consolidatedMatches.find(m => 
            m.name.toLowerCase() === match.name.toLowerCase() &&
            m.type === match.type &&
            m.jurisdiction === match.jurisdiction
          );
          
          if (existingMatch && match.matchScore > existingMatch.matchScore) {
            existingMatch.matchScore = match.matchScore;
            existingMatch.source = `${existingMatch.source}, ${match.source}`;
          }
        }
      }
    }

    // Sort by match score (highest first)
    return consolidatedMatches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const norm1 = normalize(name1);
    const norm2 = normalize(name2);

    if (norm1 === norm2) return 1.0;

    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);
    
    return maxLength > 0 ? 1 - (distance / maxLength) : 0;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private determineRiskLevel(matches: SanctionsMatch[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (matches.length === 0) return 'LOW';
    
    const maxScore = Math.max(...matches.map(m => m.matchScore));
    
    if (maxScore >= 0.9) return 'CRITICAL';
    if (maxScore >= 0.8) return 'HIGH';
    if (maxScore >= 0.7) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(matches: SanctionsMatch[], riskLevel: string): string[] {
    const recommendations = [];

    if (riskLevel === 'CRITICAL') {
      recommendations.push('IMMEDIATE ACTION REQUIRED: Block transaction and escalate to compliance team');
      recommendations.push('Conduct enhanced due diligence review');
      recommendations.push('Consider filing Suspicious Activity Report (SAR)');
      recommendations.push('Notify senior management and legal team');
    } else if (riskLevel === 'HIGH') {
      recommendations.push('Block transaction pending manual review');
      recommendations.push('Conduct additional verification');
      recommendations.push('Document decision rationale');
      recommendations.push('Escalate to compliance team for review');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('Flag for manual review');
      recommendations.push('Request additional documentation');
      recommendations.push('Monitor for similar patterns');
      recommendations.push('Conduct enhanced due diligence');
    } else {
      recommendations.push('Proceed with standard due diligence');
      recommendations.push('Monitor for any changes in sanctions status');
      recommendations.push('Maintain regular screening schedule');
    }

    return recommendations;
  }

  public async getScreeningStats(): Promise<{
    totalScreenings: number;
    matchesFound: number;
    riskLevelDistribution: Record<string, number>;
    topSources: Record<string, number>;
    averageResponseTime: number;
  }> {
    // This would typically query a database for historical screening data
    // For now, return mock stats
    return {
      totalScreenings: 0,
      matchesFound: 0,
      riskLevelDistribution: {},
      topSources: {},
      averageResponseTime: 0
    };
  }
}

export const productionSanctionsScreening = ProductionSanctionsScreening.getInstance();
