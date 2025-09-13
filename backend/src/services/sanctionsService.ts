import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { auditService } from './auditService';
import { productionSanctionsScreening, EntityData, ScreeningResult } from './productionSanctionsService';

export interface SanctionsCheckRequest {
  entityName: string;
  entityType: 'INDIVIDUAL' | 'CORPORATE' | 'VESSEL' | 'AIRCRAFT';
  jurisdiction?: string;
  dateOfBirth?: string;
  nationality?: string;
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
}

export interface SanctionsCheckResult {
  requestId: string;
  entityName: string;
  matchesFound: boolean;
  matches: SanctionsMatch[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
  timestamp: Date;
}

export class SanctionsService {
  private static instance: SanctionsService;
  private prisma: PrismaClient;
  private isInitialized = false;
  private useProductionScreening = false;

  // Mock sanctions data - in production, this would come from external APIs
  private sanctionsLists = {
    OFAC: [
      {
        id: 'ofac-001',
        name: 'John Doe',
        type: 'INDIVIDUAL',
        jurisdiction: 'US',
        aliases: ['Johnny Doe', 'J. Doe'],
        dateOfBirth: '1980-01-01',
        nationality: 'US',
        source: 'OFAC',
        lastUpdated: new Date('2024-01-01'),
      },
      {
        id: 'ofac-002',
        name: 'XYZ Corporation',
        type: 'CORPORATE',
        jurisdiction: 'US',
        aliases: ['XYZ Corp', 'XYZ Inc'],
        source: 'OFAC',
        lastUpdated: new Date('2024-01-01'),
      },
    ],
    EU: [
      {
        id: 'eu-001',
        name: 'Jane Smith',
        type: 'INDIVIDUAL',
        jurisdiction: 'EU',
        aliases: ['J. Smith', 'Jane S.'],
        dateOfBirth: '1975-05-15',
        nationality: 'UK',
        source: 'EU',
        lastUpdated: new Date('2024-01-01'),
      },
    ],
    UN: [
      {
        id: 'un-001',
        name: 'ABC Trading Ltd',
        type: 'CORPORATE',
        jurisdiction: 'Global',
        aliases: ['ABC Trading', 'ABC Ltd'],
        source: 'UN',
        lastUpdated: new Date('2024-01-01'),
      },
    ],
  };

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): SanctionsService {
    if (!SanctionsService.instance) {
      SanctionsService.instance = new SanctionsService();
    }
    return SanctionsService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if production screening is available
      this.useProductionScreening = await this.checkProductionScreeningAvailability();
      
      if (this.useProductionScreening) {
        // Initialize production screening service
        await productionSanctionsScreening.initialize();
        logger.info('Sanctions Service initialized with production screening');
      } else {
        // Fallback to mock data
        await this.loadSanctionsData();
        logger.info('Sanctions Service initialized with mock data (production screening not available)');
      }
      
      this.isInitialized = true;
      logger.info('Sanctions Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Sanctions Service:', error);
      throw error;
    }
  }

  private async checkProductionScreeningAvailability(): Promise<boolean> {
    try {
      // Check if required environment variables are set
      const hasMoovCredentials = !!(process.env.MOOV_PUBLIC_KEY && process.env.MOOV_PRIVATE_KEY);
      const hasAtLeastOneAPI = !!(
        process.env.OFAC_API_KEY || 
        process.env.EU_SANCTIONS_API_KEY || 
        process.env.UN_SANCTIONS_API_KEY || 
        process.env.UK_SANCTIONS_API_KEY
      );
      
      return hasMoovCredentials || hasAtLeastOneAPI;
    } catch (error) {
      logger.warn('Error checking production screening availability:', error);
      return false;
    }
  }

  private async loadSanctionsData(): Promise<void> {
    try {
      // Clear existing data
      await this.prisma.sanctionsCheck.deleteMany({
        where: { userId: 'system' },
      });

      // Load sanctions from all sources
      for (const [source, sanctions] of Object.entries(this.sanctionsLists)) {
        for (const sanction of sanctions) {
          await this.prisma.sanctionsCheck.create({
            data: {
              id: sanction.id,
              userId: 'system',
              entityName: sanction.name,
              entityType: sanction.type,
              jurisdiction: sanction.jurisdiction,
              matchFound: false,
              matchDetails: {
                aliases: sanction.aliases || [],
                dateOfBirth: sanction.dateOfBirth,
                nationality: sanction.nationality,
                source: sanction.source,
                lastUpdated: sanction.lastUpdated,
              },
              checkDate: new Date(),
              metadata: sanction,
            },
          });
        }
      }

      logger.info('Sanctions data loaded successfully');
    } catch (error) {
      logger.error('Failed to load sanctions data:', error);
      throw error;
    }
  }

  public async checkSanctions(request: SanctionsCheckRequest): Promise<SanctionsCheckResult> {
    try {
      const requestId = `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      let result: SanctionsCheckResult;

      if (this.useProductionScreening) {
        // Use production screening
        result = await this.performProductionScreening(request, requestId);
      } else {
        // Use mock screening
        result = await this.performMockScreening(request, requestId);
      }

      // Store check result
      await this.storeSanctionsCheck(request, result);

      // Log audit trail
      await auditService.logDataAccess(
        'system',
        'sanctions_check',
        requestId,
        'READ',
        { matchesFound: result.matches.length, riskLevel: result.riskLevel }
      );

      logger.info(`Sanctions check completed: ${requestId}`, {
        entityName: request.entityName,
        matchesFound: result.matches.length,
        riskLevel: result.riskLevel,
        screeningType: this.useProductionScreening ? 'production' : 'mock'
      });

      return result;
    } catch (error) {
      logger.error('Failed to check sanctions:', error);
      throw error;
    }
  }

  private async performProductionScreening(request: SanctionsCheckRequest, requestId: string): Promise<SanctionsCheckResult> {
    try {
      // Convert request to EntityData format
      const entityData: EntityData = {
        name: request.entityName,
        entityType: request.entityType,
        country: request.jurisdiction,
        dateOfBirth: request.dateOfBirth,
        nationality: request.nationality,
        additionalInfo: request.additionalInfo
      };

      // Perform comprehensive screening
      const screeningResult: ScreeningResult = await productionSanctionsScreening.comprehensiveScreening(entityData);

      // Convert to SanctionsCheckResult format
      const result: SanctionsCheckResult = {
        requestId,
        entityName: request.entityName,
        matchesFound: screeningResult.matchesFound,
        matches: screeningResult.matches,
        riskLevel: screeningResult.riskLevel,
        recommendations: screeningResult.recommendations,
        timestamp: screeningResult.timestamp
      };

      return result;
    } catch (error) {
      logger.error('Production screening failed, falling back to mock screening:', error);
      return await this.performMockScreening(request, requestId);
    }
  }

  private async performMockScreening(request: SanctionsCheckRequest, requestId: string): Promise<SanctionsCheckResult> {
    // Perform sanctions screening using mock data
    const matches = await this.performSanctionsScreening(request);
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(matches);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(matches, riskLevel);
    
    const result: SanctionsCheckResult = {
      requestId,
      entityName: request.entityName,
      matchesFound: matches.length > 0,
      matches,
      riskLevel,
      recommendations,
      timestamp: new Date(),
    };

    return result;
  }

  private async performSanctionsScreening(request: SanctionsCheckRequest): Promise<SanctionsMatch[]> {
    const matches: SanctionsMatch[] = [];

    // Get all sanctions data
    const sanctionsData = await this.prisma.sanctionsCheck.findMany({
      where: { userId: 'system' },
    });

    for (const sanction of sanctionsData) {
      const matchScore = this.calculateMatchScore(request, sanction);
      
      if (matchScore > 0.6) { // Threshold for potential match
        const matchDetails = this.getMatchDetails(request, sanction);
        
        matches.push({
          id: sanction.id,
          name: sanction.entityName,
          type: sanction.entityType,
          jurisdiction: sanction.jurisdiction,
          matchScore,
          matchDetails,
          source: sanction.matchDetails?.source || 'Unknown',
          lastUpdated: sanction.matchDetails?.lastUpdated || new Date(),
        });
      }
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculateMatchScore(request: SanctionsCheckRequest, sanction: any): number {
    let score = 0;
    let factors = 0;

    // Name matching (primary factor)
    const nameScore = this.calculateNameSimilarity(request.entityName, sanction.entityName);
    score += nameScore * 0.4;
    factors += 0.4;

    // Check aliases
    if (sanction.matchDetails?.aliases) {
      const aliasScore = Math.max(
        ...sanction.matchDetails.aliases.map((alias: string) =>
          this.calculateNameSimilarity(request.entityName, alias)
        )
      );
      score += aliasScore * 0.2;
      factors += 0.2;
    }

    // Entity type matching
    if (request.entityType === sanction.entityType) {
      score += 0.2;
      factors += 0.2;
    }

    // Jurisdiction matching
    if (request.jurisdiction && sanction.jurisdiction) {
      if (request.jurisdiction === sanction.jurisdiction || sanction.jurisdiction === 'Global') {
        score += 0.1;
        factors += 0.1;
      }
    }

    // Date of birth matching (for individuals)
    if (request.entityType === 'INDIVIDUAL' && request.dateOfBirth && sanction.matchDetails?.dateOfBirth) {
      if (request.dateOfBirth === sanction.matchDetails.dateOfBirth) {
        score += 0.1;
        factors += 0.1;
      }
    }

    // Nationality matching (for individuals)
    if (request.entityType === 'INDIVIDUAL' && request.nationality && sanction.matchDetails?.nationality) {
      if (request.nationality === sanction.matchDetails.nationality) {
        score += 0.1;
        factors += 0.1;
      }
    }

    return factors > 0 ? score / factors : 0;
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

  private getMatchDetails(request: SanctionsCheckRequest, sanction: any): {
    field: string;
    value: string;
    confidence: number;
  }[] {
    const details = [];

    // Name match
    const nameScore = this.calculateNameSimilarity(request.entityName, sanction.entityName);
    if (nameScore > 0.5) {
      details.push({
        field: 'name',
        value: sanction.entityName,
        confidence: nameScore,
      });
    }

    // Alias matches
    if (sanction.matchDetails?.aliases) {
      for (const alias of sanction.matchDetails.aliases) {
        const aliasScore = this.calculateNameSimilarity(request.entityName, alias);
        if (aliasScore > 0.5) {
          details.push({
            field: 'alias',
            value: alias,
            confidence: aliasScore,
          });
        }
      }
    }

    // Entity type match
    if (request.entityType === sanction.entityType) {
      details.push({
        field: 'entity_type',
        value: sanction.entityType,
        confidence: 1.0,
      });
    }

    // Jurisdiction match
    if (request.jurisdiction && sanction.jurisdiction) {
      if (request.jurisdiction === sanction.jurisdiction || sanction.jurisdiction === 'Global') {
        details.push({
          field: 'jurisdiction',
          value: sanction.jurisdiction,
          confidence: 1.0,
        });
      }
    }

    return details;
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
    } else if (riskLevel === 'HIGH') {
      recommendations.push('Block transaction pending manual review');
      recommendations.push('Conduct additional verification');
      recommendations.push('Document decision rationale');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('Flag for manual review');
      recommendations.push('Request additional documentation');
      recommendations.push('Monitor for similar patterns');
    } else {
      recommendations.push('Proceed with standard due diligence');
      recommendations.push('Monitor for any changes in sanctions status');
    }

    return recommendations;
  }

  private async storeSanctionsCheck(request: SanctionsCheckRequest, result: SanctionsCheckResult): Promise<void> {
    try {
      await this.prisma.sanctionsCheck.create({
        data: {
          id: result.requestId,
          userId: 'system',
          entityName: request.entityName,
          entityType: request.entityType,
          jurisdiction: request.jurisdiction || 'Unknown',
          matchFound: result.matchesFound,
          matchDetails: {
            matches: result.matches,
            riskLevel: result.riskLevel,
            recommendations: result.recommendations,
            request: request,
          },
          checkDate: result.timestamp,
          metadata: {
            request,
            result,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to store sanctions check:', error);
    }
  }

  public async getSanctionsStats(): Promise<{
    totalChecks: number;
    matchesFound: number;
    riskLevelDistribution: Record<string, number>;
    topSources: Record<string, number>;
    screeningType: 'production' | 'mock';
    productionStats?: any;
  }> {
    try {
      const [totalChecks, matchesFound, checks] = await Promise.all([
        this.prisma.sanctionsCheck.count(),
        this.prisma.sanctionsCheck.count({ where: { matchFound: true } }),
        this.prisma.sanctionsCheck.findMany({
          select: {
            matchDetails: true,
          },
        }),
      ]);

      const riskLevelDistribution: Record<string, number> = {};
      const topSources: Record<string, number> = {};

      for (const check of checks) {
        if (check.matchDetails) {
          const riskLevel = check.matchDetails.riskLevel || 'LOW';
          riskLevelDistribution[riskLevel] = (riskLevelDistribution[riskLevel] || 0) + 1;

          if (check.matchDetails.matches) {
            for (const match of check.matchDetails.matches) {
              topSources[match.source] = (topSources[match.source] || 0) + 1;
            }
          }
        }
      }

      const stats = {
        totalChecks,
        matchesFound,
        riskLevelDistribution,
        topSources,
        screeningType: this.useProductionScreening ? 'production' as const : 'mock' as const
      };

      // Add production stats if available
      if (this.useProductionScreening) {
        try {
          const productionStats = await productionSanctionsScreening.getScreeningStats();
          return { ...stats, productionStats };
        } catch (error) {
          logger.warn('Failed to get production screening stats:', error);
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get sanctions stats:', error);
      return {
        totalChecks: 0,
        matchesFound: 0,
        riskLevelDistribution: {},
        topSources: {},
        screeningType: this.useProductionScreening ? 'production' as const : 'mock' as const
      };
    }
  }

  public async updateSanctionsList(source: string, sanctions: any[]): Promise<void> {
    try {
      // Clear existing sanctions for this source
      await this.prisma.sanctionsCheck.deleteMany({
        where: {
          userId: 'system',
          matchDetails: {
            path: ['source'],
            equals: source,
          },
        },
      });

      // Add new sanctions
      for (const sanction of sanctions) {
        await this.prisma.sanctionsCheck.create({
          data: {
            id: `${source.toLowerCase()}-${sanction.id}`,
            userId: 'system',
            entityName: sanction.name,
            entityType: sanction.type,
            jurisdiction: sanction.jurisdiction,
            matchFound: false,
            matchDetails: {
              aliases: sanction.aliases || [],
              dateOfBirth: sanction.dateOfBirth,
              nationality: sanction.nationality,
              source: source,
              lastUpdated: new Date(),
            },
            checkDate: new Date(),
            metadata: sanction,
          },
        });
      }

      logger.info(`Updated sanctions list for ${source}: ${sanctions.length} entries`);
    } catch (error) {
      logger.error(`Failed to update sanctions list for ${source}:`, error);
      throw error;
    }
  }
}

export const sanctionsService = SanctionsService.getInstance();

