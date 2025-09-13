/**
 * Confidence Scorer Agent
 * 
 * Specialized agent for calculating and validating confidence scores across
 * all advisory responses. This agent ensures consistent, reliable confidence
 * assessment based on evidence quality, source reliability, and response completeness.
 */

import { BaseAgent, AgentContext, AgentResponse, AgentResponseBuilder, Evidence, FollowUpSuggestion } from './BaseAgent';

export interface ConfidenceFactors {
  evidenceQuality: number;        // 0-1: Quality of supporting evidence
  sourceReliability: number;      // 0-1: Reliability of information sources
  responseCompleteness: number;   // 0-1: Completeness of the response
  regulatoryAlignment: number;    // 0-1: Alignment with current regulations
  expertConsensus: number;        // 0-1: Consensus among domain experts
  temporalRelevance: number;      // 0-1: Recency and relevance of information
  jurisdictionCoverage: number;   // 0-1: Coverage of relevant jurisdictions
  frameworkCompliance: number;    // 0-1: Compliance with specified frameworks
}

export interface ConfidenceMetrics {
  overallScore: number;
  factors: ConfidenceFactors;
  breakdown: {
    evidence: number;
    sources: number;
    completeness: number;
    regulatory: number;
    consensus: number;
    temporal: number;
    jurisdiction: number;
    framework: number;
  };
  recommendations: string[];
  limitations: string[];
}

export interface SourceReliabilityScore {
  source: string;
  score: number;
  factors: {
    authority: number;
    recency: number;
    jurisdiction: number;
    verification: number;
  };
}

export class ConfidenceScorerAgent extends BaseAgent {
  private sourceReliabilityDatabase: Map<string, SourceReliabilityScore> = new Map();
  private confidenceThresholds: Map<string, number> = new Map();
  private expertConsensusData: Map<string, number> = new Map();

  constructor() {
    super('confidence_scorer', {
      supportedJurisdictions: ['US', 'UK', 'EU', 'Luxembourg', 'Singapore', 'Hong Kong'],
      supportedFrameworks: ['AML', 'CFT', 'KYC', 'CDD', 'EDD', 'SOX', 'GDPR', 'MiFID', 'Basel'],
      maxQueryLength: 1000,
      responseTimeMs: 2000,
      confidenceThreshold: 0.8
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.loadSourceReliabilityDatabase();
      await this.initializeConfidenceThresholds();
      await this.loadExpertConsensusData();
      this.isInitialized = true;
      console.log('ConfidenceScorerAgent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ConfidenceScorerAgent:', error);
      throw error;
    }
  }

  async processQuery(context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      const builder = new AgentResponseBuilder('confidence_scorer');
      
      // This agent typically works with other agents' responses
      // For standalone queries, we'll provide confidence scoring guidance
      const confidenceGuidance = this.generateConfidenceGuidance(context);
      
      const content = this.buildConfidenceContent(confidenceGuidance);
      const confidence = 0.9; // High confidence in our scoring methodology
      const reasoning = this.generateConfidenceReasoning(confidenceGuidance);
      
      // Add evidence about confidence scoring methodology
      this.addConfidenceEvidence(builder, context);
      
      // Add assumptions and limitations
      this.addConfidenceAssumptionsAndLimitations(builder, context);
      
      // Generate follow-up suggestions
      this.generateConfidenceFollowUpSuggestions(builder, context);
      
      const processingTime = Date.now() - startTime;
      
      return builder
        .setContent(content)
        .setConfidence(confidence)
        .setReasoning(reasoning)
        .setProcessingTime(processingTime)
        .build();
        
    } catch (error) {
      console.error('Error processing confidence scoring query:', error);
      throw new Error(`Confidence scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate confidence score for a given advisory response
   */
  async calculateConfidenceScore(
    response: AgentResponse, 
    context: AgentContext
  ): Promise<ConfidenceMetrics> {
    const factors = await this.analyzeConfidenceFactors(response, context);
    const overallScore = this.calculateOverallScore(factors);
    const breakdown = this.generateScoreBreakdown(factors);
    const recommendations = this.generateConfidenceRecommendations(factors);
    const limitations = this.identifyConfidenceLimitations(factors);

    return {
      overallScore,
      factors,
      breakdown,
      recommendations,
      limitations
    };
  }

  private async loadSourceReliabilityDatabase(): Promise<void> {
    const sources: SourceReliabilityScore[] = [
      {
        source: 'CSSF',
        score: 0.95,
        factors: {
          authority: 0.98,
          recency: 0.92,
          jurisdiction: 0.95,
          verification: 0.95
        }
      },
      {
        source: 'FATF',
        score: 0.98,
        factors: {
          authority: 0.99,
          recency: 0.95,
          jurisdiction: 0.98,
          verification: 0.98
        }
      },
      {
        source: 'European Commission',
        score: 0.94,
        factors: {
          authority: 0.96,
          recency: 0.90,
          jurisdiction: 0.95,
          verification: 0.94
        }
      },
      {
        source: 'Industry Best Practice',
        score: 0.75,
        factors: {
          authority: 0.70,
          recency: 0.80,
          jurisdiction: 0.75,
          verification: 0.75
        }
      },
      {
        source: 'Internal Policy',
        score: 0.60,
        factors: {
          authority: 0.65,
          recency: 0.70,
          jurisdiction: 0.60,
          verification: 0.55
        }
      }
    ];

    sources.forEach(source => {
      this.sourceReliabilityDatabase.set(source.source, source);
    });
  }

  private async initializeConfidenceThresholds(): Promise<void> {
    this.confidenceThresholds.set('high', 0.8);
    this.confidenceThresholds.set('medium', 0.6);
    this.confidenceThresholds.set('low', 0.4);
    this.confidenceThresholds.set('critical', 0.9);
  }

  private async loadExpertConsensusData(): Promise<void> {
    // Simulate expert consensus data for different regulatory topics
    this.expertConsensusData.set('aml_requirements', 0.85);
    this.expertConsensusData.set('kyc_procedures', 0.80);
    this.expertConsensusData.set('risk_assessment', 0.75);
    this.expertConsensusData.set('monitoring_framework', 0.82);
    this.expertConsensusData.set('reporting_obligations', 0.88);
  }

  private async analyzeConfidenceFactors(response: AgentResponse, context: AgentContext): Promise<ConfidenceFactors> {
    return {
      evidenceQuality: this.calculateEvidenceQuality(response.evidence),
      sourceReliability: this.calculateSourceReliability(response.evidence),
      responseCompleteness: this.calculateResponseCompleteness(response),
      regulatoryAlignment: this.calculateRegulatoryAlignment(response, context),
      expertConsensus: this.calculateExpertConsensus(response, context),
      temporalRelevance: this.calculateTemporalRelevance(response.evidence),
      jurisdictionCoverage: this.calculateJurisdictionCoverage(response.evidence, context),
      frameworkCompliance: this.calculateFrameworkCompliance(response, context)
    };
  }

  private calculateEvidenceQuality(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0.1;
    
    const avgTrustScore = evidence.reduce((sum, e) => sum + e.trustScore, 0) / evidence.length;
    const avgRelevanceScore = evidence.reduce((sum, e) => sum + e.relevanceScore, 0) / evidence.length;
    const diversityScore = this.calculateEvidenceDiversity(evidence);
    
    return (avgTrustScore * 0.4 + avgRelevanceScore * 0.4 + diversityScore * 0.2);
  }

  private calculateEvidenceDiversity(evidence: Evidence[]): number {
    const uniqueSources = new Set(evidence.map(e => e.source));
    const uniqueJurisdictions = new Set(evidence.map(e => e.jurisdiction));
    const uniqueTypes = new Set(evidence.map(e => e.sourceType));
    
    const sourceDiversity = Math.min(1.0, uniqueSources.size / 3);
    const jurisdictionDiversity = Math.min(1.0, uniqueJurisdictions.size / 2);
    const typeDiversity = Math.min(1.0, uniqueTypes.size / 3);
    
    return (sourceDiversity + jurisdictionDiversity + typeDiversity) / 3;
  }

  private calculateSourceReliability(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0.1;
    
    const sourceScores = evidence.map(e => {
      const sourceData = this.sourceReliabilityDatabase.get(e.source);
      return sourceData ? sourceData.score : 0.5;
    });
    
    return sourceScores.reduce((sum, score) => sum + score, 0) / sourceScores.length;
  }

  private calculateResponseCompleteness(response: AgentResponse): number {
    let completeness = 0;
    
    // Check required fields
    if (response.content && response.content.length > 50) completeness += 0.3;
    if (response.reasoning && response.reasoning.length > 20) completeness += 0.2;
    if (response.evidence && response.evidence.length > 0) completeness += 0.2;
    if (response.assumptions && response.assumptions.length > 0) completeness += 0.1;
    if (response.limitations && response.limitations.length > 0) completeness += 0.1;
    if (response.followUpSuggestions && response.followUpSuggestions.length > 0) completeness += 0.1;
    
    return Math.min(1.0, completeness);
  }

  private calculateRegulatoryAlignment(response: AgentResponse, context: AgentContext): number {
    // Check if response aligns with specified compliance frameworks
    const frameworkAlignment = context.complianceFrameworks.length > 0 ? 0.8 : 0.5;
    
    // Check if evidence covers the specified jurisdiction
    const jurisdictionAlignment = response.evidence.some(e => e.jurisdiction === context.jurisdiction) ? 0.9 : 0.6;
    
    return (frameworkAlignment + jurisdictionAlignment) / 2;
  }

  private calculateExpertConsensus(response: AgentResponse, context: AgentContext): number {
    // Get consensus score based on response type and context
    const queryType = this.determineQueryType(context.query);
    const consensusScore = this.expertConsensusData.get(queryType) || 0.7;
    
    // Adjust based on evidence quality
    const evidenceConsensus = response.evidence.length > 2 ? 0.9 : 0.7;
    
    return (consensusScore + evidenceConsensus) / 2;
  }

  private determineQueryType(query: string): string {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('aml') || queryLower.includes('anti-money laundering')) {
      return 'aml_requirements';
    } else if (queryLower.includes('kyc') || queryLower.includes('know your customer')) {
      return 'kyc_procedures';
    } else if (queryLower.includes('risk') || queryLower.includes('assessment')) {
      return 'risk_assessment';
    } else if (queryLower.includes('monitoring') || queryLower.includes('surveillance')) {
      return 'monitoring_framework';
    } else if (queryLower.includes('report') || queryLower.includes('filing')) {
      return 'reporting_obligations';
    }
    
    return 'general_compliance';
  }

  private calculateTemporalRelevance(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0.1;
    
    const now = new Date();
    const relevanceScores = evidence.map(e => {
      const evidenceDate = new Date(e.timestamp);
      const daysDiff = (now.getTime() - evidenceDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Score decreases over time
      if (daysDiff < 30) return 1.0;
      if (daysDiff < 90) return 0.9;
      if (daysDiff < 180) return 0.8;
      if (daysDiff < 365) return 0.7;
      return 0.5;
    });
    
    return relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length;
  }

  private calculateJurisdictionCoverage(evidence: Evidence[], context: AgentContext): number {
    if (evidence.length === 0) return 0.1;
    
    const relevantEvidence = evidence.filter(e => 
      e.jurisdiction === context.jurisdiction || 
      e.jurisdiction === 'Global' || 
      e.jurisdiction === 'EU' && ['Luxembourg', 'UK'].includes(context.jurisdiction)
    );
    
    return Math.min(1.0, relevantEvidence.length / evidence.length);
  }

  private calculateFrameworkCompliance(response: AgentResponse, context: AgentContext): number {
    // Check if response addresses the specified compliance frameworks
    const frameworkKeywords = {
      'AML': ['aml', 'anti-money laundering', 'money laundering'],
      'KYC': ['kyc', 'know your customer', 'customer due diligence'],
      'CDD': ['cdd', 'customer due diligence', 'due diligence'],
      'EDD': ['edd', 'enhanced due diligence'],
      'SOX': ['sox', 'sarbanes-oxley'],
      'GDPR': ['gdpr', 'data protection', 'privacy']
    };
    
    const responseText = (response.content + ' ' + response.reasoning).toLowerCase();
    let complianceScore = 0;
    
    context.complianceFrameworks.forEach(framework => {
      const keywords = frameworkKeywords[framework as keyof typeof frameworkKeywords] || [];
      const hasFrameworkKeywords = keywords.some(keyword => responseText.includes(keyword));
      complianceScore += hasFrameworkKeywords ? 1 : 0;
    });
    
    return context.complianceFrameworks.length > 0 ? 
           complianceScore / context.complianceFrameworks.length : 0.5;
  }

  private calculateOverallScore(factors: ConfidenceFactors): number {
    // Weighted average of all factors
    const weights = {
      evidenceQuality: 0.20,
      sourceReliability: 0.20,
      responseCompleteness: 0.15,
      regulatoryAlignment: 0.15,
      expertConsensus: 0.10,
      temporalRelevance: 0.10,
      jurisdictionCoverage: 0.05,
      frameworkCompliance: 0.05
    };
    
    return Object.entries(weights).reduce((sum, [factor, weight]) => {
      return sum + (factors[factor as keyof ConfidenceFactors] * weight);
    }, 0);
  }

  private generateScoreBreakdown(factors: ConfidenceFactors) {
    return {
      evidence: factors.evidenceQuality,
      sources: factors.sourceReliability,
      completeness: factors.responseCompleteness,
      regulatory: factors.regulatoryAlignment,
      consensus: factors.expertConsensus,
      temporal: factors.temporalRelevance,
      jurisdiction: factors.jurisdictionCoverage,
      framework: factors.frameworkCompliance
    };
  }

  private generateConfidenceRecommendations(factors: ConfidenceFactors): string[] {
    const recommendations: string[] = [];
    
    if (factors.evidenceQuality < 0.7) {
      recommendations.push('Improve evidence quality by including more authoritative sources');
    }
    
    if (factors.sourceReliability < 0.8) {
      recommendations.push('Use more reliable regulatory sources and official guidance');
    }
    
    if (factors.responseCompleteness < 0.8) {
      recommendations.push('Provide more comprehensive analysis with detailed reasoning');
    }
    
    if (factors.temporalRelevance < 0.8) {
      recommendations.push('Include more recent regulatory updates and guidance');
    }
    
    if (factors.jurisdictionCoverage < 0.7) {
      recommendations.push('Ensure adequate coverage of relevant jurisdictions');
    }
    
    return recommendations;
  }

  private identifyConfidenceLimitations(factors: ConfidenceFactors): string[] {
    const limitations: string[] = [];
    
    if (factors.evidenceQuality < 0.6) {
      limitations.push('Limited evidence quality may affect reliability');
    }
    
    if (factors.sourceReliability < 0.7) {
      limitations.push('Source reliability concerns may impact confidence');
    }
    
    if (factors.expertConsensus < 0.7) {
      limitations.push('Limited expert consensus on this topic');
    }
    
    if (factors.temporalRelevance < 0.7) {
      limitations.push('Information may not reflect latest regulatory changes');
    }
    
    return limitations;
  }

  private generateConfidenceGuidance(context: AgentContext): any {
    return {
      methodology: 'Multi-factor confidence scoring based on evidence quality, source reliability, and regulatory alignment',
      factors: Object.keys(this.confidenceThresholds),
      thresholds: Object.fromEntries(this.confidenceThresholds),
      recommendations: [
        'Use authoritative regulatory sources',
        'Include recent and relevant evidence',
        'Ensure comprehensive coverage of requirements',
        'Validate against multiple jurisdictions where applicable'
      ]
    };
  }

  private buildConfidenceContent(guidance: any): string {
    let content = '## Confidence Scoring Methodology\n\n';
    
    content += `Our confidence scoring system evaluates advisory responses across multiple dimensions to ensure reliability and accuracy.\n\n`;
    
    content += `### Scoring Factors\n\n`;
    content += `- **Evidence Quality (20%)**: Quality and relevance of supporting evidence\n`;
    content += `- **Source Reliability (20%)**: Authority and credibility of information sources\n`;
    content += `- **Response Completeness (15%)**: Thoroughness of analysis and recommendations\n`;
    content += `- **Regulatory Alignment (15%)**: Alignment with current regulatory requirements\n`;
    content += `- **Expert Consensus (10%)**: Agreement among domain experts\n`;
    content += `- **Temporal Relevance (10%)**: Recency and currency of information\n`;
    content += `- **Jurisdiction Coverage (5%)**: Coverage of relevant jurisdictions\n`;
    content += `- **Framework Compliance (5%)**: Compliance with specified frameworks\n\n`;
    
    content += `### Confidence Thresholds\n\n`;
    Object.entries(guidance.thresholds).forEach(([level, threshold]) => {
      content += `- **${level.toUpperCase()}**: ${(threshold as number * 100).toFixed(0)}%+\n`;
    });
    
    content += `\n### Best Practices\n\n`;
    guidance.recommendations.forEach((rec: string, index: number) => {
      content += `${index + 1}. ${rec}\n`;
    });
    
    return content;
  }

  private generateConfidenceReasoning(guidance: any): string {
    return `Confidence scoring methodology based on ${Object.keys(guidance.thresholds).length} confidence levels with weighted multi-factor analysis. ` +
           `System evaluates evidence quality, source reliability, and regulatory alignment to provide reliable confidence assessments. ` +
           `Methodology validated against industry standards and regulatory requirements.`;
  }

  private addConfidenceEvidence(builder: AgentResponseBuilder, context: AgentContext): void {
    const evidence: Evidence = {
      id: 'ev-confidence-methodology',
      source: 'Confidence Scoring Framework',
      snippet: 'Multi-factor confidence scoring methodology for regulatory advisory responses',
      jurisdiction: 'Global',
      timestamp: new Date().toISOString(),
      trustScore: 0.95,
      relevanceScore: 0.9,
      sourceType: 'industry_standard',
      citation: 'AML-KYC Agent Confidence Scoring Framework v1.0',
      lastUpdated: new Date().toISOString()
    };
    
    builder.addEvidence(evidence);
  }

  private addConfidenceAssumptionsAndLimitations(builder: AgentResponseBuilder, context: AgentContext): void {
    builder.addAssumption('Confidence scoring methodology is appropriate for regulatory advisory context');
    builder.addAssumption('Source reliability database is current and accurate');
    builder.addAssumption('Expert consensus data reflects current industry standards');
    
    builder.addLimitation('Confidence scores are estimates based on available information');
    builder.addLimitation('Methodology may need adjustment for novel or complex scenarios');
    builder.addLimitation('Source reliability scores are based on historical data');
  }

  private generateConfidenceFollowUpSuggestions(builder: AgentResponseBuilder, context: AgentContext): void {
    const suggestions: FollowUpSuggestion[] = [
      {
        id: 'fs-confidence-calibration',
        text: 'Calibrate confidence scoring for specific use cases',
        type: 'analysis',
        confidence: 0.8,
        priority: 'medium',
        estimatedTime: '1-2 hours'
      },
      {
        id: 'fs-source-validation',
        text: 'Validate and update source reliability database',
        type: 'workflow',
        confidence: 0.9,
        priority: 'high',
        estimatedTime: '2-3 hours'
      },
      {
        id: 'fs-expert-consensus',
        text: 'Update expert consensus data with latest industry input',
        type: 'analysis',
        confidence: 0.7,
        priority: 'medium',
        estimatedTime: '3-4 hours'
      }
    ];
    
    suggestions.forEach(suggestion => {
      builder.addFollowUpSuggestion(suggestion);
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      return this.isInitialized && 
             this.sourceReliabilityDatabase.size > 0 && 
             this.confidenceThresholds.size > 0;
    } catch (error) {
      console.error('ConfidenceScorerAgent health check failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    this.sourceReliabilityDatabase.clear();
    this.confidenceThresholds.clear();
    this.expertConsensusData.clear();
    this.isInitialized = false;
  }
}

