/**
 * Regulatory Parser Agent
 * 
 * Specialized agent for parsing and interpreting regulatory documents,
 * extracting relevant requirements, and identifying compliance obligations.
 * This agent serves as the foundation for regulatory knowledge extraction.
 */

import { BaseAgent, AgentContext, AgentResponse, AgentResponseBuilder, Evidence, FollowUpSuggestion } from './BaseAgent';

export interface RegulatoryDocument {
  id: string;
  title: string;
  jurisdiction: string;
  type: 'regulation' | 'directive' | 'guidance' | 'circular' | 'case_law';
  content: string;
  effectiveDate: string;
  lastUpdated: string;
  authority: string;
  url: string;
  trustScore: number;
}

export interface ParsedRequirement {
  id: string;
  text: string;
  category: 'obligation' | 'prohibition' | 'condition' | 'procedure' | 'timeline';
  severity: 'mandatory' | 'recommended' | 'optional';
  applicability: string[];
  effectiveDate: string;
  source: string;
}

export class RegulatoryParserAgent extends BaseAgent {
  private regulatoryDatabase: Map<string, RegulatoryDocument[]> = new Map();
  private parsingCache: Map<string, ParsedRequirement[]> = new Map();

  constructor() {
    super('regulatory_parser', {
      supportedJurisdictions: ['US', 'UK', 'EU', 'Luxembourg', 'Singapore', 'Hong Kong'],
      supportedFrameworks: ['AML', 'CFT', 'KYC', 'CDD', 'EDD', 'SOX', 'GDPR', 'MiFID', 'Basel'],
      maxQueryLength: 2000,
      responseTimeMs: 3000,
      confidenceThreshold: 0.7
    });
  }

  async initialize(): Promise<void> {
    try {
      // Initialize regulatory database
      await this.loadRegulatoryDatabase();
      this.isInitialized = true;
      console.log('RegulatoryParserAgent initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RegulatoryParserAgent:', error);
      throw error;
    }
  }

  async processQuery(context: AgentContext): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      const builder = new AgentResponseBuilder('regulatory_parser');
      
      // Parse the query to identify regulatory requirements
      const requirements = await this.parseRegulatoryRequirements(context);
      
      // Generate evidence from regulatory sources
      const evidence = await this.generateEvidence(context, requirements);
      
      // Build response content
      const content = this.buildResponseContent(requirements, evidence);
      
      // Calculate confidence based on evidence quality and source reliability
      const confidence = this.calculateConfidence(evidence, requirements);
      
      // Generate reasoning
      const reasoning = this.generateReasoning(requirements, evidence);
      
      // Add assumptions and limitations
      this.addAssumptionsAndLimitations(builder, context, evidence);
      
      // Generate follow-up suggestions
      this.generateFollowUpSuggestions(builder, requirements, context);
      
      const processingTime = Date.now() - startTime;
      
      return builder
        .setContent(content)
        .setConfidence(confidence)
        .setReasoning(reasoning)
        .setProcessingTime(processingTime)
        .build();
        
    } catch (error) {
      console.error('Error processing regulatory query:', error);
      throw new Error(`Regulatory parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadRegulatoryDatabase(): Promise<void> {
    // In production, this would load from a real regulatory database
    // For now, we'll create sample regulatory documents
    const sampleDocuments: RegulatoryDocument[] = [
      {
        id: 'cssf-12-02',
        title: 'CSSF Regulation 12-02 on AML/CFT',
        jurisdiction: 'Luxembourg',
        type: 'regulation',
        content: 'Financial institutions shall implement enhanced due diligence measures for higher risk categories including politically exposed persons, high-risk countries, and complex structures.',
        effectiveDate: '2020-01-01',
        lastUpdated: '2024-01-15',
        authority: 'CSSF',
        url: 'https://cssf.lu/regulation-12-02',
        trustScore: 0.95
      },
      {
        id: 'amld6-directive',
        title: 'AMLD6 Directive',
        jurisdiction: 'EU',
        type: 'directive',
        content: 'Member States shall ensure that obliged entities apply customer due diligence measures when establishing a business relationship or carrying out occasional transactions.',
        effectiveDate: '2021-12-01',
        lastUpdated: '2024-02-20',
        authority: 'European Commission',
        url: 'https://eur-lex.europa.eu/amld6',
        trustScore: 0.92
      },
      {
        id: 'fatf-40-recommendations',
        title: 'FATF 40 Recommendations',
        jurisdiction: 'Global',
        type: 'guidance',
        content: 'Countries should ensure that financial institutions are subject to adequate regulation and supervision and are effectively implementing the FATF Recommendations.',
        effectiveDate: '2012-02-01',
        lastUpdated: '2023-10-01',
        authority: 'FATF',
        url: 'https://www.fatf-gafi.org/40-recommendations',
        trustScore: 0.98
      }
    ];

    // Group by jurisdiction
    sampleDocuments.forEach(doc => {
      if (!this.regulatoryDatabase.has(doc.jurisdiction)) {
        this.regulatoryDatabase.set(doc.jurisdiction, []);
      }
      this.regulatoryDatabase.get(doc.jurisdiction)!.push(doc);
    });
  }

  private async parseRegulatoryRequirements(context: AgentContext): Promise<ParsedRequirement[]> {
    const cacheKey = `${context.jurisdiction}-${context.query}`;
    
    if (this.parsingCache.has(cacheKey)) {
      return this.parsingCache.get(cacheKey)!;
    }

    const documents = this.regulatoryDatabase.get(context.jurisdiction) || [];
    const requirements: ParsedRequirement[] = [];

    // Parse documents for relevant requirements
    for (const doc of documents) {
      if (this.isRelevantToQuery(doc, context.query)) {
        const parsed = this.extractRequirements(doc, context);
        requirements.push(...parsed);
      }
    }

    // Sort by relevance and severity
    requirements.sort((a, b) => {
      if (a.severity === 'mandatory' && b.severity !== 'mandatory') return -1;
      if (b.severity === 'mandatory' && a.severity !== 'mandatory') return 1;
      return 0;
    });

    this.parsingCache.set(cacheKey, requirements);
    return requirements;
  }

  private isRelevantToQuery(doc: RegulatoryDocument, query: string): boolean {
    const queryLower = query.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    
    // Simple relevance check - in production, this would use semantic similarity
    const keywords = ['aml', 'kyc', 'cdd', 'edd', 'compliance', 'due diligence', 'risk'];
    return keywords.some(keyword => 
      queryLower.includes(keyword) && contentLower.includes(keyword)
    );
  }

  private extractRequirements(doc: RegulatoryDocument, context: AgentContext): ParsedRequirement[] {
    const requirements: ParsedRequirement[] = [];
    
    // Extract key requirements from document content
    const sentences = doc.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach((sentence, index) => {
      const requirement: ParsedRequirement = {
        id: `${doc.id}-req-${index}`,
        text: sentence.trim(),
        category: this.categorizeRequirement(sentence),
        severity: this.determineSeverity(sentence),
        applicability: this.determineApplicability(sentence, context),
        effectiveDate: doc.effectiveDate,
        source: doc.title
      };
      
      requirements.push(requirement);
    });
    
    return requirements;
  }

  private categorizeRequirement(text: string): ParsedRequirement['category'] {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('shall') || textLower.includes('must') || textLower.includes('required')) {
      return 'obligation';
    } else if (textLower.includes('shall not') || textLower.includes('prohibited') || textLower.includes('forbidden')) {
      return 'prohibition';
    } else if (textLower.includes('if') || textLower.includes('when') || textLower.includes('provided that')) {
      return 'condition';
    } else if (textLower.includes('procedure') || textLower.includes('process') || textLower.includes('steps')) {
      return 'procedure';
    } else if (textLower.includes('within') || textLower.includes('days') || textLower.includes('timeline')) {
      return 'timeline';
    }
    
    return 'obligation';
  }

  private determineSeverity(text: string): ParsedRequirement['severity'] {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('shall') || textLower.includes('must') || textLower.includes('required')) {
      return 'mandatory';
    } else if (textLower.includes('should') || textLower.includes('recommended') || textLower.includes('best practice')) {
      return 'recommended';
    } else {
      return 'optional';
    }
  }

  private determineApplicability(text: string, context: AgentContext): string[] {
    const applicability: string[] = [];
    
    if (context.complianceFrameworks.includes('AML')) {
      applicability.push('AML');
    }
    if (context.complianceFrameworks.includes('KYC')) {
      applicability.push('KYC');
    }
    if (context.complianceFrameworks.includes('CDD')) {
      applicability.push('CDD');
    }
    
    return applicability;
  }

  private async generateEvidence(context: AgentContext, requirements: ParsedRequirement[]): Promise<Evidence[]> {
    const evidence: Evidence[] = [];
    
    for (const req of requirements) {
      const doc = this.findDocumentByRequirement(req);
      if (doc) {
        const evidenceItem: Evidence = {
          id: `ev-${req.id}`,
          source: doc.title,
          snippet: req.text,
          jurisdiction: doc.jurisdiction,
          timestamp: doc.lastUpdated,
          trustScore: doc.trustScore,
          relevanceScore: this.calculateRelevanceScore(req, context),
          url: doc.url,
          sourceType: this.mapDocumentTypeToSourceType(doc.type),
          citation: `${doc.authority} ${doc.title}`,
          lastUpdated: doc.lastUpdated
        };
        
        evidence.push(evidenceItem);
      }
    }
    
    return evidence;
  }

  private findDocumentByRequirement(req: ParsedRequirement): RegulatoryDocument | null {
    for (const docs of this.regulatoryDatabase.values()) {
      const doc = docs.find(d => d.title === req.source);
      if (doc) return doc;
    }
    return null;
  }

  private calculateRelevanceScore(req: ParsedRequirement, context: AgentContext): number {
    let score = 0.5; // Base score
    
    // Boost for mandatory requirements
    if (req.severity === 'mandatory') score += 0.3;
    
    // Boost for applicable frameworks
    if (req.applicability.some(app => context.complianceFrameworks.includes(app))) {
      score += 0.2;
    }
    
    return Math.min(1.0, score);
  }

  private mapDocumentTypeToSourceType(docType: RegulatoryDocument['type']): Evidence['sourceType'] {
    switch (docType) {
      case 'regulation':
      case 'directive':
        return 'regulation';
      case 'guidance':
        return 'guidance';
      case 'case_law':
        return 'case_law';
      default:
        return 'industry_standard';
    }
  }

  private buildResponseContent(requirements: ParsedRequirement[], evidence: Evidence[]): string {
    if (requirements.length === 0) {
      return 'No specific regulatory requirements found for this query. Please provide more context or check if the jurisdiction and compliance frameworks are correctly specified.';
    }

    let content = 'Based on regulatory analysis, the following requirements apply:\n\n';
    
    const mandatoryReqs = requirements.filter(r => r.severity === 'mandatory');
    const recommendedReqs = requirements.filter(r => r.severity === 'recommended');
    
    if (mandatoryReqs.length > 0) {
      content += '**Mandatory Requirements:**\n';
      mandatoryReqs.forEach((req, index) => {
        content += `${index + 1}. ${req.text}\n`;
      });
      content += '\n';
    }
    
    if (recommendedReqs.length > 0) {
      content += '**Recommended Practices:**\n';
      recommendedReqs.forEach((req, index) => {
        content += `${index + 1}. ${req.text}\n`;
      });
      content += '\n';
    }
    
    content += `**Evidence Sources:** ${evidence.length} regulatory documents analyzed\n`;
    content += `**Jurisdictions Covered:** ${[...new Set(evidence.map(e => e.jurisdiction))].join(', ')}\n`;
    
    return content;
  }

  private calculateConfidence(evidence: Evidence[], requirements: ParsedRequirement[]): number {
    if (evidence.length === 0) return 0.1;
    
    const avgTrustScore = evidence.reduce((sum, e) => sum + e.trustScore, 0) / evidence.length;
    const avgRelevanceScore = evidence.reduce((sum, e) => sum + e.relevanceScore, 0) / evidence.length;
    const coverageScore = Math.min(1.0, evidence.length / 5); // More evidence = higher confidence
    
    return (avgTrustScore * 0.4 + avgRelevanceScore * 0.4 + coverageScore * 0.2);
  }

  private generateReasoning(requirements: ParsedRequirement[], evidence: Evidence[]): string {
    let reasoning = `Analysis based on ${evidence.length} regulatory sources across ${[...new Set(evidence.map(e => e.jurisdiction))].length} jurisdictions. `;
    
    const mandatoryCount = requirements.filter(r => r.severity === 'mandatory').length;
    const recommendedCount = requirements.filter(r => r.severity === 'recommended').length;
    
    reasoning += `Found ${mandatoryCount} mandatory requirements and ${recommendedCount} recommended practices. `;
    
    if (evidence.length > 0) {
      const avgTrust = evidence.reduce((sum, e) => sum + e.trustScore, 0) / evidence.length;
      reasoning += `Average source trust score: ${(avgTrust * 100).toFixed(1)}%. `;
    }
    
    reasoning += 'Confidence level reflects the quality and relevance of regulatory sources.';
    
    return reasoning;
  }

  private addAssumptionsAndLimitations(builder: AgentResponseBuilder, context: AgentContext, evidence: Evidence[]): void {
    // Add assumptions
    builder.addAssumption('Current regulatory framework is up-to-date');
    builder.addAssumption('Query relates to standard financial institution operations');
    builder.addAssumption('Jurisdiction and compliance frameworks are correctly specified');
    
    // Add limitations
    builder.addLimitation('Analysis limited to available regulatory sources');
    builder.addLimitation('Does not include recent regulatory changes not yet in database');
    builder.addLimitation('May not cover all edge cases or specific scenarios');
    
    if (evidence.length < 3) {
      builder.addLimitation('Limited regulatory sources available for this query');
    }
  }

  private generateFollowUpSuggestions(builder: AgentResponseBuilder, requirements: ParsedRequirement[], context: AgentContext): void {
    const suggestions: FollowUpSuggestion[] = [];
    
    if (requirements.some(r => r.severity === 'mandatory')) {
      suggestions.push({
        id: 'fs-mandatory-details',
        text: 'Get detailed implementation guidance for mandatory requirements',
        type: 'workflow',
        confidence: 0.9,
        priority: 'high',
        estimatedTime: '15-30 minutes'
      });
    }
    
    if (requirements.some(r => r.category === 'procedure')) {
      suggestions.push({
        id: 'fs-procedure-workflow',
        text: 'Create step-by-step compliance procedure',
        type: 'workflow',
        confidence: 0.8,
        priority: 'medium',
        estimatedTime: '30-45 minutes'
      });
    }
    
    suggestions.push({
      id: 'fs-additional-jurisdictions',
      text: 'Check requirements in other jurisdictions',
      type: 'analysis',
      confidence: 0.7,
      priority: 'medium',
      estimatedTime: '10-15 minutes'
    });
    
    suggestions.forEach(suggestion => {
      builder.addFollowUpSuggestion(suggestion);
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      return this.isInitialized && this.regulatoryDatabase.size > 0;
    } catch (error) {
      console.error('RegulatoryParserAgent health check failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    this.regulatoryDatabase.clear();
    this.parsingCache.clear();
    this.isInitialized = false;
  }
}

