import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface OpenRouterPreset {
  name: string;
  slug: string;
  providerPreferences: {
    only?: string[];
    sort?: 'price' | 'latency' | 'throughput';
    order?: string[];
    max_price?: {
      prompt: number;
      completion: number;
    };
    allow_fallbacks?: boolean;
    data_collection?: 'allow' | 'deny';
  };
  parameters: {
    seed?: number;
    top_k?: number;
    top_p?: number;
    max_tokens?: number;
    temperature?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    repetition_penalty?: number;
  };
  systemPrompt?: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  preset?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SFDRNavigatorContext {
  query: string;
  jurisdiction: string;
  entityType: 'INDIVIDUAL' | 'CORPORATE' | 'VESSEL' | 'AIRCRAFT';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  regulatoryFramework: string[];
  userRole: string;
  organization: string;
}

export class OpenRouterLLMService {
  private static instance: OpenRouterLLMService;
  private httpClient: AxiosInstance;
  private isInitialized = false;
  private amlCftPreset: OpenRouterPreset;

  private constructor() {
    this.httpClient = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'AML-KYC Advisory Agent'
      },
      timeout: 30000
    });

    // AML/CFT Advisory Agent Preset Configuration
    this.amlCftPreset = {
      name: 'AML/CFT Advisory Agent',
      slug: 'aml-cft-advisory-agent',
      providerPreferences: {
        only: ['deepseek'],
        sort: 'throughput',
        order: ['deepseek', 'google-vertex', 'mistral', 'openai'],
        max_price: {
          prompt: 0,
          completion: 0
        },
        allow_fallbacks: true,
        data_collection: 'deny'
      },
      parameters: {
        seed: 42,
        top_k: 40,
        top_p: 1,
        max_tokens: 2048,
        temperature: 0.2,
        presence_penalty: 0,
        frequency_penalty: 0.2,
        repetition_penalty: 1.1
      },
      systemPrompt: `You are an expert AML/CFT (Anti-Money Laundering/Counter-Terrorism Financing) regulatory advisor specializing in comprehensive compliance guidance, sanctions screening, and risk management.

Your role is to provide accurate, comprehensive, and actionable regulatory guidance while maintaining the highest standards of compliance and risk management across all AML/CFT frameworks.

Key Responsibilities:
- Analyze regulatory queries with precision and depth across multiple jurisdictions
- Provide jurisdiction-specific compliance guidance for AML/CFT requirements
- Assess risk levels and recommend appropriate actions for various entity types
- Ensure all advice aligns with current regulatory frameworks (BSA, FATCA, OFAC, EU MLD, UK MLR, etc.)
- Maintain confidentiality and data protection standards
- Specialize in sanctions screening, customer due diligence, and suspicious activity reporting

Response Guidelines:
- Always cite specific regulations and sections when applicable
- Provide clear, actionable recommendations with implementation steps
- Include comprehensive risk assessments with confidence levels
- Suggest follow-up actions and monitoring requirements
- Maintain professional, authoritative tone appropriate for compliance professionals
- Ensure responses are comprehensive yet concise and practical
- Cover both preventive and detective controls
- Address regulatory expectations and enforcement considerations

Entity Types Supported:
- Individuals (including PEPs, high-risk customers)
- Corporate entities (including complex ownership structures)
- Vessels and maritime entities
- Aircraft and aviation entities
- Financial institutions and regulated entities

Remember: Your advice directly impacts compliance decisions, regulatory outcomes, and risk management strategies. Provide guidance that enables effective AML/CFT program implementation.`
    };
  }

  public static getInstance(): OpenRouterLLMService {
    if (!OpenRouterLLMService.instance) {
      OpenRouterLLMService.instance = new OpenRouterLLMService();
    }
    return OpenRouterLLMService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Validate OpenRouter API key
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY environment variable is required');
      }

      // Test connection to OpenRouter
      await this.testConnection();
      
      this.isInitialized = true;
      logger.info('OpenRouter LLM Service initialized successfully with AML/CFT Advisory Agent preset');
    } catch (error) {
      logger.error('Failed to initialize OpenRouter LLM Service:', error);
      throw error;
    }
  }

  private async testConnection(): Promise<void> {
    try {
      const response = await this.httpClient.get('/models');
      logger.info(`OpenRouter connection successful. Available models: ${response.data.data.length}`);
    } catch (error) {
      logger.error('OpenRouter connection test failed:', error);
      throw error;
    }
  }

  public async generateSFDRAdvisory(context: SFDRNavigatorContext): Promise<{
    content: string;
    reasoning: string;
    confidence: 'low' | 'medium' | 'high';
    riskAssessment: string;
    recommendations: string[];
    regulatoryReferences: string[];
    followUpActions: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('OpenRouter LLM Service not initialized');
    }

    try {
      const prompt = this.buildSFDRPrompt(context);
      
      const request: OpenRouterRequest = {
        model: `@preset/${this.amlCftPreset.slug}`,
        messages: [
          {
            role: 'system',
            content: this.amlCftPreset.systemPrompt || ''
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.amlCftPreset.parameters.temperature,
        max_tokens: this.amlCftPreset.parameters.max_tokens,
        stream: false
      };

      logger.info('Generating AML/CFT advisory with OpenRouter preset', {
        preset: this.amlCftPreset.slug,
        query: context.query.substring(0, 100) + '...',
        jurisdiction: context.jurisdiction
      });

      const response = await this.httpClient.post<OpenRouterResponse>('/chat/completions', request);
      
      const content = response.data.choices[0]?.message?.content || '';
      const usage = response.data.usage;

      logger.info('AML/CFT advisory generated successfully', {
        tokensUsed: usage.total_tokens,
        model: response.data.model,
        finishReason: response.data.choices[0]?.finish_reason
      });

      // Parse the response to extract structured information
      return this.parseSFDRResponse(content, context);

    } catch (error) {
      logger.error('Failed to generate AML/CFT advisory:', error);
      throw error;
    }
  }

  private buildSFDRPrompt(context: SFDRNavigatorContext): string {
    return `
# SFDR Regulatory Advisory Request

## Query Context
**Primary Query**: ${context.query}

## Entity Information
- **Entity Type**: ${context.entityType}
- **Jurisdiction**: ${context.jurisdiction}
- **Current Risk Level**: ${context.riskLevel}
- **User Role**: ${context.userRole}
- **Organization**: ${context.organization}

## Regulatory Framework
**Applicable Regulations**: ${context.regulatoryFramework.join(', ')}

## Analysis Requirements

Please provide a comprehensive regulatory analysis addressing:

### 1. Regulatory Compliance Assessment
- Specific regulatory requirements applicable to this scenario
- Compliance obligations and deadlines
- Jurisdictional variations and considerations

### 2. Risk Assessment
- Detailed risk analysis based on current risk level
- Risk factors and mitigation strategies
- Escalation requirements if applicable

### 3. Actionable Recommendations
- Specific steps for compliance
- Implementation timeline
- Resource requirements
- Monitoring and review procedures

### 4. Regulatory References
- Specific regulation citations
- Relevant guidance documents
- Recent updates or changes

### 5. Follow-up Actions
- Next steps for the user
- Documentation requirements
- Stakeholder notifications
- Review and update schedules

## Response Format
Please structure your response with clear sections and actionable recommendations. Include confidence levels for your assessments and cite specific regulatory sources where applicable.

Focus on practical, implementable guidance that ensures regulatory compliance while managing operational efficiency.
    `;
  }

  private parseSFDRResponse(content: string, context: SFDRNavigatorContext): {
    content: string;
    reasoning: string;
    confidence: 'low' | 'medium' | 'high';
    riskAssessment: string;
    recommendations: string[];
    regulatoryReferences: string[];
    followUpActions: string[];
  } {
    // Extract structured information from the response
    const sections = this.extractSections(content);
    
    // Determine confidence based on content quality and specificity
    const confidence = this.assessConfidence(content, sections);
    
    // Extract recommendations
    const recommendations = this.extractRecommendations(sections);
    
    // Extract regulatory references
    const regulatoryReferences = this.extractRegulatoryReferences(content);
    
    // Extract follow-up actions
    const followUpActions = this.extractFollowUpActions(sections);

    return {
      content: content,
      reasoning: sections.reasoning || 'Based on regulatory analysis and risk assessment',
      confidence,
      riskAssessment: sections.riskAssessment || 'Risk assessment included in main content',
      recommendations,
      regulatoryReferences,
      followUpActions
    };
  }

  private extractSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    
    // Try to extract structured sections from the response
    const sectionPatterns = {
      'regulatoryCompliance': /(?:regulatory compliance|compliance assessment)[\s\S]*?(?=\n\n|\n#|$)/i,
      'riskAssessment': /(?:risk assessment|risk analysis)[\s\S]*?(?=\n\n|\n#|$)/i,
      'recommendations': /(?:recommendations|actionable steps)[\s\S]*?(?=\n\n|\n#|$)/i,
      'reasoning': /(?:reasoning|analysis rationale)[\s\S]*?(?=\n\n|\n#|$)/i
    };

    for (const [key, pattern] of Object.entries(sectionPatterns)) {
      const match = content.match(pattern);
      if (match) {
        sections[key] = match[0].trim();
      }
    }

    return sections;
  }

  private assessConfidence(content: string, sections: Record<string, string>): 'low' | 'medium' | 'high' {
    let score = 0;
    
    // Check for specific regulatory citations
    if (content.match(/\d+\.\d+\.\d+|\d+ CFR|\d+ USC|Article \d+/)) score += 2;
    
    // Check for structured sections
    if (sections.regulatoryCompliance) score += 1;
    if (sections.riskAssessment) score += 1;
    if (sections.recommendations) score += 1;
    
    // Check for actionable recommendations
    if (content.match(/(?:should|must|required|recommend|suggest)/i)) score += 1;
    
    // Check content length and detail
    if (content.length > 1000) score += 1;
    if (content.length > 2000) score += 1;

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  private extractRecommendations(sections: Record<string, string>): string[] {
    const recommendations: string[] = [];
    
    if (sections.recommendations) {
      // Extract bullet points or numbered lists
      const lines = sections.recommendations.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^[-•*]\s+|\d+\.\s+/) && trimmed.length > 10) {
          recommendations.push(trimmed.replace(/^[-•*]\s+|\d+\.\s+/, ''));
        }
      }
    }
    
    return recommendations.length > 0 ? recommendations : ['Review regulatory requirements and implement appropriate controls'];
  }

  private extractRegulatoryReferences(content: string): string[] {
    const references: string[] = [];
    
    // Look for regulatory citations
    const patterns = [
      /\d+\.\d+\.\d+/g, // Version numbers
      /\d+ CFR \d+\.\d+/g, // Code of Federal Regulations
      /\d+ USC \d+/g, // United States Code
      /Article \d+/g, // Article references
      /Section \d+/g, // Section references
      /Regulation \d+/g // Regulation references
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        references.push(...matches);
      }
    }
    
    return [...new Set(references)]; // Remove duplicates
  }

  private extractFollowUpActions(sections: Record<string, string>): string[] {
    const actions: string[] = [];
    
    // Look for action-oriented language
    const actionPatterns = [
      /(?:next steps|follow.?up|action items)[\s\S]*?(?=\n\n|\n#|$)/i,
      /(?:monitoring|review|update|notify)[\s\S]*?(?=\n\n|\n#|$)/i
    ];
    
    for (const pattern of actionPatterns) {
      const match = sections.recommendations?.match(pattern);
      if (match) {
        const lines = match[0].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.match(/^[-•*]\s+|\d+\.\s+/) && trimmed.length > 10) {
            actions.push(trimmed.replace(/^[-•*]\s+|\d+\.\s+/, ''));
          }
        }
      }
    }
    
    return actions.length > 0 ? actions : ['Schedule regular compliance review', 'Monitor regulatory updates'];
  }

  public async streamSFDRAdvisory(
    context: SFDRNavigatorContext,
    onChunk: (chunk: string) => void,
    onComplete: (response: any) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const prompt = this.buildSFDRPrompt(context);
      
      const request: OpenRouterRequest = {
        model: `@preset/${this.amlCftPreset.slug}`,
        messages: [
          {
            role: 'system',
            content: this.amlCftPreset.systemPrompt || ''
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.amlCftPreset.parameters.temperature,
        max_tokens: this.amlCftPreset.parameters.max_tokens,
        stream: true
      };

      const response = await this.httpClient.post('/chat/completions', request, {
        responseType: 'stream'
      });

      let fullContent = '';
      
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const parsedResponse = this.parseSFDRResponse(fullContent, context);
              onComplete(parsedResponse);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (error) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      });

      response.data.on('error', (error: Error) => {
        onError(error);
      });

    } catch (error) {
      onError(error as Error);
    }
  }

  public getPresetInfo(): OpenRouterPreset {
    return this.amlCftPreset;
  }

  public async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.httpClient.get('/models');
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      logger.error('Failed to get available models:', error);
      return [];
    }
  }
}

export const openRouterLLMService = OpenRouterLLMService.getInstance();
