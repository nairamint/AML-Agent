/**
 * Base Agent Interface for Multi-Agent LLM Framework
 * 
 * This defines the core contract for all specialized agents in the AML-KYC advisory system.
 * Each agent is responsible for a specific domain of expertise while maintaining
 * consistent interfaces for communication and coordination.
 */

export interface AgentContext {
  query: string;
  conversationHistory: ConversationTurn[];
  jurisdiction: string;
  complianceFrameworks: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  userRole: 'analyst' | 'manager' | 'compliance_officer' | 'auditor';
  timestamp: string;
}

export interface ConversationTurn {
  id: string;
  query: string;
  response: AgentResponse;
  timestamp: string;
  context: Partial<AgentContext>;
}

export interface AgentResponse {
  id: string;
  agentType: AgentType;
  content: string;
  confidence: number; // 0-1 scale
  reasoning: string;
  evidence: Evidence[];
  assumptions: string[];
  limitations: string[];
  followUpSuggestions: FollowUpSuggestion[];
  processingTime: number;
  timestamp: string;
}

export interface Evidence {
  id: string;
  source: string;
  snippet: string;
  jurisdiction: string;
  timestamp: string;
  trustScore: number;
  relevanceScore: number;
  url?: string;
  sourceType: 'regulation' | 'guidance' | 'case_law' | 'industry_standard' | 'internal_policy';
  citation: string;
  lastUpdated: string;
}

export interface FollowUpSuggestion {
  id: string;
  text: string;
  type: 'clarification' | 'workflow' | 'analysis' | 'recommendation' | 'escalation';
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

export type AgentType = 
  | 'regulatory_parser'
  | 'advisory_generator' 
  | 'evidence_analyzer'
  | 'confidence_scorer'
  | 'risk_assessor'
  | 'compliance_checker'
  | 'workflow_orchestrator';

export interface AgentCapabilities {
  supportedJurisdictions: string[];
  supportedFrameworks: string[];
  maxQueryLength: number;
  responseTimeMs: number;
  confidenceThreshold: number;
}

export abstract class BaseAgent {
  protected agentType: AgentType;
  protected capabilities: AgentCapabilities;
  protected isInitialized: boolean = false;

  constructor(agentType: AgentType, capabilities: AgentCapabilities) {
    this.agentType = agentType;
    this.capabilities = capabilities;
  }

  /**
   * Initialize the agent with required resources
   */
  abstract initialize(): Promise<void>;

  /**
   * Process a query and return a structured response
   */
  abstract processQuery(context: AgentContext): Promise<AgentResponse>;

  /**
   * Validate if this agent can handle the given context
   */
  canHandle(context: AgentContext): boolean {
    return (
      this.capabilities.supportedJurisdictions.includes(context.jurisdiction) &&
      context.complianceFrameworks.some(framework => 
        this.capabilities.supportedFrameworks.includes(framework)
      ) &&
      context.query.length <= this.capabilities.maxQueryLength
    );
  }

  /**
   * Get agent metadata
   */
  getMetadata() {
    return {
      agentType: this.agentType,
      capabilities: this.capabilities,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Health check for the agent
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Cleanup resources
   */
  abstract cleanup(): Promise<void>;
}

/**
 * Agent Response Builder for consistent response formatting
 */
export class AgentResponseBuilder {
  private response: Partial<AgentResponse> = {};

  constructor(agentType: AgentType) {
    this.response.agentType = agentType;
    this.response.timestamp = new Date().toISOString();
    this.response.id = `${agentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  setContent(content: string): this {
    this.response.content = content;
    return this;
  }

  setConfidence(confidence: number): this {
    this.response.confidence = Math.max(0, Math.min(1, confidence));
    return this;
  }

  setReasoning(reasoning: string): this {
    this.response.reasoning = reasoning;
    return this;
  }

  addEvidence(evidence: Evidence): this {
    if (!this.response.evidence) {
      this.response.evidence = [];
    }
    this.response.evidence.push(evidence);
    return this;
  }

  addAssumption(assumption: string): this {
    if (!this.response.assumptions) {
      this.response.assumptions = [];
    }
    this.response.assumptions.push(assumption);
    return this;
  }

  addLimitation(limitation: string): this {
    if (!this.response.limitations) {
      this.response.limitations = [];
    }
    this.response.limitations.push(limitation);
    return this;
  }

  addFollowUpSuggestion(suggestion: FollowUpSuggestion): this {
    if (!this.response.followUpSuggestions) {
      this.response.followUpSuggestions = [];
    }
    this.response.followUpSuggestions.push(suggestion);
    return this;
  }

  setProcessingTime(timeMs: number): this {
    this.response.processingTime = timeMs;
    return this;
  }

  build(): AgentResponse {
    // Validate required fields
    if (!this.response.content) {
      throw new Error('Agent response must have content');
    }
    if (this.response.confidence === undefined) {
      throw new Error('Agent response must have confidence score');
    }
    if (!this.response.reasoning) {
      throw new Error('Agent response must have reasoning');
    }

    // Set defaults
    this.response.evidence = this.response.evidence || [];
    this.response.assumptions = this.response.assumptions || [];
    this.response.limitations = this.response.limitations || [];
    this.response.followUpSuggestions = this.response.followUpSuggestions || [];
    this.response.processingTime = this.response.processingTime || 0;

    return this.response as AgentResponse;
  }
}

