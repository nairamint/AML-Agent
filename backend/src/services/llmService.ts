import { QdrantClient } from '@qdrant/js-client-rest';
import { Ollama } from 'ollama';
import { OpenAI } from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Brief, Evidence, FollowUpSuggestion } from '../types/advisory';
import { knowledgeService } from './knowledgeService';
import { auditService } from './auditService';

export interface LLMResponse {
  content: string;
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
  evidence: Evidence[];
  followUpSuggestions: FollowUpSuggestion[];
  assumptions: string[];
}

export interface MultiAgentContext {
  userQuery: string;
  conversationHistory: Brief[];
  userContext: {
    jurisdiction: string;
    role: string;
    organization: string;
  };
  regulatoryContext: {
    applicableRegulations: string[];
    recentUpdates: string[];
    enforcementActions: string[];
  };
}

export class LLMService {
  private static instance: LLMService;
  private qdrant: QdrantClient;
  private ollama: Ollama;
  private openai?: OpenAI;
  private isInitialized = false;

  private constructor() {
    this.qdrant = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
    
    this.ollama = new Ollama({
      host: config.llm.ollamaBaseUrl,
    });

    if (config.llm.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: config.llm.openaiApiKey,
      });
    }
  }

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test connections
      await this.testConnections();
      
      // Load regulatory knowledge base
      await this.loadRegulatoryKnowledge();
      
      this.isInitialized = true;
      logger.info('LLM Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize LLM Service:', error);
      throw error;
    }
  }

  private async testConnections(): Promise<void> {
    // Test Qdrant connection
    try {
      await this.qdrant.getCollections();
      logger.info('Qdrant connection successful');
    } catch (error) {
      logger.error('Qdrant connection failed:', error);
      throw error;
    }

    // Test Ollama connection
    try {
      await this.ollama.list();
      logger.info('Ollama connection successful');
    } catch (error) {
      logger.error('Ollama connection failed:', error);
      throw error;
    }

    // Test OpenAI connection (if configured)
    if (this.openai) {
      try {
        await this.openai.models.list();
        logger.info('OpenAI connection successful');
      } catch (error) {
        logger.warn('OpenAI connection failed:', error);
      }
    }
  }

  private async loadRegulatoryKnowledge(): Promise<void> {
    try {
      // Check if regulatory knowledge collection exists
      const collections = await this.qdrant.getCollections();
      const regulatoryCollection = collections.collections.find(
        c => c.name === 'regulatory_knowledge'
      );

      if (!regulatoryCollection) {
        // Create regulatory knowledge collection
        await this.qdrant.createCollection('regulatory_knowledge', {
          vectors: {
            size: 1536, // OpenAI embedding size
            distance: 'Cosine',
          },
        });
        logger.info('Created regulatory knowledge collection');
      }

      // Load initial regulatory data if collection is empty
      const collectionInfo = await this.qdrant.getCollection('regulatory_knowledge');
      if (collectionInfo.points_count === 0) {
        await this.seedRegulatoryKnowledge();
      }
    } catch (error) {
      logger.error('Failed to load regulatory knowledge:', error);
      throw error;
    }
  }

  private async seedRegulatoryKnowledge(): Promise<void> {
    // This would typically load from a comprehensive regulatory database
    // For now, we'll create some sample regulatory content
    const sampleRegulations = [
      {
        id: 'reg-001',
        content: 'Customer Due Diligence (CDD) requirements under the Bank Secrecy Act require financial institutions to verify customer identity and assess risk.',
        jurisdiction: 'US',
        regulation: 'BSA',
        section: '31 CFR 1020.220',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'reg-002',
        content: 'Enhanced Due Diligence (EDD) is required for high-risk customers including PEPs, high-risk countries, and complex ownership structures.',
        jurisdiction: 'US',
        regulation: 'BSA',
        section: '31 CFR 1020.220(b)',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'reg-003',
        content: 'Suspicious Activity Reports (SARs) must be filed within 30 days of detecting suspicious activity exceeding $5,000.',
        jurisdiction: 'US',
        regulation: 'BSA',
        section: '31 CFR 1020.320',
        lastUpdated: new Date().toISOString(),
      },
    ];

    // Generate embeddings and store in Qdrant
    for (const regulation of sampleRegulations) {
      try {
        // Generate embedding (using OpenAI or local model)
        const embedding = await this.generateEmbedding(regulation.content);
        
        await this.qdrant.upsert('regulatory_knowledge', {
          points: [{
            id: regulation.id,
            vector: embedding,
            payload: regulation,
          }],
        });
      } catch (error) {
        logger.error(`Failed to seed regulation ${regulation.id}:`, error);
      }
    }

    logger.info(`Seeded ${sampleRegulations.length} regulatory documents`);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (this.openai) {
      // Use OpenAI embeddings
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      return response.data[0].embedding;
    } else {
      // Use local embedding model (simplified - would need actual implementation)
      // For now, return a mock embedding
      return Array(1536).fill(0).map(() => Math.random());
    }
  }

  public async generateAdvisory(context: MultiAgentContext): Promise<LLMResponse> {
    if (!this.isInitialized) {
      throw new Error('LLM Service not initialized');
    }

    try {
      // Log the advisory request
      await auditService.logAdvisoryRequest(context);

      // Multi-agent processing
      const regulatoryAgent = await this.regulatoryInterpretationAgent(context);
      const riskAgent = await this.riskAssessmentAgent(context);
      const advisoryAgent = await this.advisorySynthesisAgent(context, regulatoryAgent, riskAgent);
      const confidenceAgent = await this.confidenceScoringAgent(advisoryAgent);

      // Generate evidence from regulatory knowledge base
      const evidence = await this.retrieveRegulatoryEvidence(context.userQuery);

      // Generate follow-up suggestions
      const followUpSuggestions = await this.generateFollowUpSuggestions(context, advisoryAgent);

      const response: LLMResponse = {
        content: advisoryAgent.content,
        reasoning: advisoryAgent.reasoning,
        confidence: confidenceAgent.confidence,
        evidence,
        followUpSuggestions,
        assumptions: advisoryAgent.assumptions,
      };

      // Log the advisory response
      await auditService.logAdvisoryResponse(response);

      return response;
    } catch (error) {
      logger.error('Failed to generate advisory:', error);
      await auditService.logAdvisoryError(error);
      throw error;
    }
  }

  private async regulatoryInterpretationAgent(context: MultiAgentContext): Promise<any> {
    const prompt = `
    As a regulatory interpretation agent, analyze the following query in the context of AML/CFT regulations:
    
    Query: ${context.userQuery}
    Jurisdiction: ${context.userContext.jurisdiction}
    Role: ${context.userContext.role}
    
    Applicable Regulations: ${context.regulatoryContext.applicableRegulations.join(', ')}
    
    Provide a structured analysis of:
    1. Relevant regulatory requirements
    2. Key compliance obligations
    3. Risk factors to consider
    4. Jurisdictional variations
    `;

    const response = await this.ollama.generate({
      model: config.llm.model,
      prompt,
      stream: false,
    });

    return {
      regulatoryAnalysis: response.response,
      applicableRegulations: context.regulatoryContext.applicableRegulations,
    };
  }

  private async riskAssessmentAgent(context: MultiAgentContext): Promise<any> {
    const prompt = `
    As a risk assessment agent, evaluate the AML/CFT risks associated with this scenario:
    
    Query: ${context.userQuery}
    Organization: ${context.userContext.organization}
    Jurisdiction: ${context.userContext.jurisdiction}
    
    Consider:
    1. Customer risk factors
    2. Product/service risk factors
    3. Geographic risk factors
    4. Transaction risk factors
    5. Overall risk rating (Low/Medium/High)
    `;

    const response = await this.ollama.generate({
      model: config.llm.model,
      prompt,
      stream: false,
    });

    return {
      riskAssessment: response.response,
      riskFactors: ['Customer', 'Product', 'Geographic', 'Transaction'],
      overallRisk: 'Medium', // This would be calculated based on the analysis
    };
  }

  private async advisorySynthesisAgent(
    context: MultiAgentContext,
    regulatoryAgent: any,
    riskAgent: any
  ): Promise<any> {
    const prompt = `
    As an advisory synthesis agent, combine the regulatory and risk analysis to provide comprehensive guidance:
    
    Original Query: ${context.userQuery}
    
    Regulatory Analysis: ${regulatoryAgent.regulatoryAnalysis}
    Risk Assessment: ${riskAgent.riskAssessment}
    
    Provide:
    1. Executive summary
    2. Detailed recommendations
    3. Implementation steps
    4. Key considerations
    5. Assumptions made
    `;

    const response = await this.ollama.generate({
      model: config.llm.model,
      prompt,
      stream: false,
    });

    return {
      content: response.response,
      reasoning: 'Based on regulatory analysis and risk assessment',
      assumptions: [
        'Current regulatory framework applies',
        'Standard risk factors are applicable',
        'No exceptional circumstances present',
      ],
    };
  }

  private async confidenceScoringAgent(advisoryAgent: any): Promise<any> {
    // Analyze the quality and completeness of the advisory
    const contentLength = advisoryAgent.content.length;
    const hasReasoning = advisoryAgent.reasoning.length > 0;
    const hasAssumptions = advisoryAgent.assumptions.length > 0;

    let confidence: 'low' | 'medium' | 'high' = 'low';

    if (contentLength > 500 && hasReasoning && hasAssumptions) {
      confidence = 'high';
    } else if (contentLength > 200 && (hasReasoning || hasAssumptions)) {
      confidence = 'medium';
    }

    return {
      confidence,
      reasoning: `Confidence based on content completeness: ${contentLength} chars, reasoning: ${hasReasoning}, assumptions: ${hasAssumptions}`,
    };
  }

  private async retrieveRegulatoryEvidence(query: string): Promise<Evidence[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Search regulatory knowledge base
      const searchResults = await this.qdrant.search('regulatory_knowledge', {
        vector: queryEmbedding,
        limit: 5,
        with_payload: true,
      });

      // Convert to Evidence format
      const evidence: Evidence[] = searchResults.map((result, index) => ({
        id: `ev-${result.id}`,
        source: result.payload?.regulation || 'Regulatory Framework',
        snippet: result.payload?.content || '',
        jurisdiction: result.payload?.jurisdiction || 'Global',
        timestamp: result.payload?.lastUpdated || new Date().toISOString(),
        trustScore: 0.9, // High trust for regulatory sources
        relevanceScore: result.score || 0.8,
        url: `#regulation-${result.id}`,
      }));

      return evidence;
    } catch (error) {
      logger.error('Failed to retrieve regulatory evidence:', error);
      return [];
    }
  }

  private async generateFollowUpSuggestions(
    context: MultiAgentContext,
    advisoryAgent: any
  ): Promise<FollowUpSuggestion[]> {
    const suggestions: FollowUpSuggestion[] = [
      {
        id: 'fs-001',
        text: 'Can you provide more specific guidance on implementation?',
        type: 'clarification',
        confidence: 'high',
      },
      {
        id: 'fs-002',
        text: 'What are the key risks I should monitor?',
        type: 'analysis',
        confidence: 'high',
      },
      {
        id: 'fs-003',
        text: 'How does this apply to other jurisdictions?',
        type: 'analysis',
        confidence: 'medium',
      },
    ];

    return suggestions;
  }

  public async streamAdvisory(
    context: MultiAgentContext,
    onChunk: (chunk: any) => void,
    onComplete: (response: LLMResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Generate advisory with streaming
      const response = await this.generateAdvisory(context);
      
      // Simulate streaming by chunking the response
      const chunks = this.chunkResponse(response);
      
      for (const chunk of chunks) {
        onChunk(chunk);
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
      
      onComplete(response);
    } catch (error) {
      onError(error as Error);
    }
  }

  private chunkResponse(response: LLMResponse): any[] {
    const chunks = [];
    
    // Title chunk
    chunks.push({
      type: 'content',
      data: { type: 'title', content: 'AML/CFT Advisory Analysis' }
    });
    
    // Main content chunks
    const contentChunks = this.splitText(response.content, 100);
    contentChunks.forEach(chunk => {
      chunks.push({
        type: 'content',
        data: { type: 'main', content: chunk }
      });
    });
    
    // Reasoning chunk
    chunks.push({
      type: 'reasoning',
      data: response.reasoning
    });
    
    // Evidence chunks
    chunks.push({
      type: 'evidence',
      data: response.evidence
    });
    
    // Suggestions chunks
    chunks.push({
      type: 'suggestions',
      data: response.followUpSuggestions
    });
    
    return chunks;
  }

  private splitText(text: string, maxLength: number): string[] {
    const chunks = [];
    let currentChunk = '';
    
    const words = text.split(' ');
    
    for (const word of words) {
      if (currentChunk.length + word.length + 1 > maxLength) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + word;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}

export const llmService = LLMService.getInstance();

