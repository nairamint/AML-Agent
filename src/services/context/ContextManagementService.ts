/**
 * Context Management Service
 * 
 * Advanced context management system for maintaining conversation state,
 * jurisdiction awareness, compliance framework tracking, and user preferences
 * across multi-turn conversations in the AML-KYC advisory system.
 */

export interface ConversationContext {
  id: string;
  userId: string;
  sessionId: string;
  jurisdiction: string;
  complianceFrameworks: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  userRole: 'analyst' | 'manager' | 'compliance_officer' | 'auditor';
  preferences: UserPreferences;
  conversationHistory: ConversationTurn[];
  activeWorkflows: ActiveWorkflow[];
  metadata: ContextMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationTurn {
  id: string;
  query: string;
  response: ConversationResponse;
  timestamp: string;
  context: Partial<ConversationContext>;
  feedback?: UserFeedback;
}

export interface ConversationResponse {
  id: string;
  content: string;
  confidence: number;
  evidence: Evidence[];
  recommendations: Recommendation[];
  followUpSuggestions: FollowUpSuggestion[];
  processingTime: number;
  agentContributions: AgentContribution[];
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

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'immediate' | 'short_term' | 'long_term';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  dependencies: string[];
  timeline: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface FollowUpSuggestion {
  id: string;
  text: string;
  type: 'clarification' | 'workflow' | 'analysis' | 'recommendation' | 'escalation';
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  context: string[];
}

export interface AgentContribution {
  agentType: string;
  confidence: number;
  processingTime: number;
  evidenceCount: number;
  contribution: string;
}

export interface UserFeedback {
  type: 'positive' | 'negative' | 'neutral';
  rating: number; // 1-5 scale
  comments?: string;
  timestamp: string;
  responseId: string;
}

export interface ActiveWorkflow {
  id: string;
  name: string;
  type: 'compliance_check' | 'risk_assessment' | 'due_diligence' | 'monitoring_setup';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  progress: number; // 0-100
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies: string[];
  estimatedTime: number;
  actualTime?: number;
  output?: any;
  error?: string;
}

export interface UserPreferences {
  defaultJurisdiction: string;
  preferredFrameworks: string[];
  riskTolerance: 'low' | 'medium' | 'high';
  notificationSettings: NotificationSettings;
  displaySettings: DisplaySettings;
  language: string;
  timezone: string;
}

export interface NotificationSettings {
  email: boolean;
  inApp: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  categories: string[];
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'comfortable' | 'spacious';
  showConfidenceScores: boolean;
  showEvidenceDetails: boolean;
  showProcessingTime: boolean;
}

export interface ContextMetadata {
  version: string;
  lastRegulatoryUpdate: string;
  knowledgeBaseVersion: string;
  modelVersion: string;
  systemCapabilities: string[];
  limitations: string[];
}

export class ContextManagementService {
  private contexts: Map<string, ConversationContext> = new Map();
  private currentContextId: string | null = null;
  private isInitialized: boolean = false;

  constructor() {}

  /**
   * Initialize the context management service
   */
  async initialize(): Promise<void> {
    try {
      // Load existing contexts from storage
      await this.loadContexts();
      
      this.isInitialized = true;
      console.log('ContextManagementService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ContextManagementService:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation context
   */
  async createContext(
    userId: string,
    sessionId: string,
    initialPreferences?: Partial<UserPreferences>
  ): Promise<ConversationContext> {
    const contextId = this.generateContextId();
    const now = new Date().toISOString();
    
    const context: ConversationContext = {
      id: contextId,
      userId,
      sessionId,
      jurisdiction: initialPreferences?.defaultJurisdiction || 'Luxembourg',
      complianceFrameworks: initialPreferences?.preferredFrameworks || ['AML', 'KYC'],
      riskTolerance: initialPreferences?.riskTolerance || 'medium',
      userRole: 'compliance_officer', // Default role
      preferences: this.getDefaultPreferences(initialPreferences),
      conversationHistory: [],
      activeWorkflows: [],
      metadata: this.getDefaultMetadata(),
      createdAt: now,
      updatedAt: now
    };

    this.contexts.set(contextId, context);
    this.currentContextId = contextId;
    
    await this.saveContext(context);
    
    return context;
  }

  /**
   * Get current conversation context
   */
  getCurrentContext(): ConversationContext | null {
    if (!this.currentContextId) return null;
    return this.contexts.get(this.currentContextId) || null;
  }

  /**
   * Set current context
   */
  setCurrentContext(contextId: string): boolean {
    if (this.contexts.has(contextId)) {
      this.currentContextId = contextId;
      return true;
    }
    return false;
  }

  /**
   * Add conversation turn to current context
   */
  async addConversationTurn(
    query: string,
    response: ConversationResponse,
    feedback?: UserFeedback
  ): Promise<void> {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error('No active conversation context');
    }

    const turn: ConversationTurn = {
      id: this.generateTurnId(),
      query,
      response,
      timestamp: new Date().toISOString(),
      context: {
        jurisdiction: context.jurisdiction,
        complianceFrameworks: context.complianceFrameworks,
        riskTolerance: context.riskTolerance,
        userRole: context.userRole
      },
      feedback
    };

    context.conversationHistory.push(turn);
    context.updatedAt = new Date().toISOString();

    await this.saveContext(context);
  }

  /**
   * Update context preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error('No active conversation context');
    }

    context.preferences = { ...context.preferences, ...preferences };
    context.updatedAt = new Date().toISOString();

    await this.saveContext(context);
  }

  /**
   * Update jurisdiction
   */
  async updateJurisdiction(jurisdiction: string): Promise<void> {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error('No active conversation context');
    }

    context.jurisdiction = jurisdiction;
    context.updatedAt = new Date().toISOString();

    await this.saveContext(context);
  }

  /**
   * Update compliance frameworks
   */
  async updateComplianceFrameworks(frameworks: string[]): Promise<void> {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error('No active conversation context');
    }

    context.complianceFrameworks = frameworks;
    context.updatedAt = new Date().toISOString();

    await this.saveContext(context);
  }

  /**
   * Update risk tolerance
   */
  async updateRiskTolerance(riskTolerance: 'low' | 'medium' | 'high'): Promise<void> {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error('No active conversation context');
    }

    context.riskTolerance = riskTolerance;
    context.updatedAt = new Date().toISOString();

    await this.saveContext(context);
  }

  /**
   * Add active workflow
   */
  async addActiveWorkflow(workflow: Omit<ActiveWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error('No active conversation context');
    }

    const workflowId = this.generateWorkflowId();
    const now = new Date().toISOString();
    
    const activeWorkflow: ActiveWorkflow = {
      ...workflow,
      id: workflowId,
      createdAt: now,
      updatedAt: now
    };

    context.activeWorkflows.push(activeWorkflow);
    context.updatedAt = now;

    await this.saveContext(context);
    
    return workflowId;
  }

  /**
   * Update workflow status
   */
  async updateWorkflowStatus(workflowId: string, status: ActiveWorkflow['status'], progress?: number): Promise<void> {
    const context = this.getCurrentContext();
    if (!context) {
      throw new Error('No active conversation context');
    }

    const workflow = context.activeWorkflows.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    workflow.status = status;
    if (progress !== undefined) {
      workflow.progress = progress;
    }
    workflow.updatedAt = new Date().toISOString();
    context.updatedAt = new Date().toISOString();

    await this.saveContext(context);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(limit?: number): ConversationTurn[] {
    const context = this.getCurrentContext();
    if (!context) return [];

    const history = context.conversationHistory;
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): ActiveWorkflow[] {
    const context = this.getCurrentContext();
    if (!context) return [];

    return context.activeWorkflows.filter(w => w.status === 'active');
  }

  /**
   * Get context summary for agent processing
   */
  getContextSummary(): any {
    const context = this.getCurrentContext();
    if (!context) return null;

    return {
      jurisdiction: context.jurisdiction,
      complianceFrameworks: context.complianceFrameworks,
      riskTolerance: context.riskTolerance,
      userRole: context.userRole,
      recentQueries: context.conversationHistory.slice(-5).map(turn => turn.query),
      activeWorkflows: context.activeWorkflows.filter(w => w.status === 'active').length,
      preferences: context.preferences
    };
  }

  /**
   * Search conversation history
   */
  searchConversationHistory(query: string, limit: number = 10): ConversationTurn[] {
    const context = this.getCurrentContext();
    if (!context) return [];

    const searchTerm = query.toLowerCase();
    return context.conversationHistory
      .filter(turn => 
        turn.query.toLowerCase().includes(searchTerm) ||
        turn.response.content.toLowerCase().includes(searchTerm)
      )
      .slice(-limit);
  }

  /**
   * Get context analytics
   */
  getContextAnalytics(): any {
    const context = this.getCurrentContext();
    if (!context) return null;

    const history = context.conversationHistory;
    const totalTurns = history.length;
    const avgConfidence = history.length > 0 
      ? history.reduce((sum, turn) => sum + turn.response.confidence, 0) / history.length 
      : 0;
    
    const evidenceCount = history.reduce((sum, turn) => sum + turn.response.evidence.length, 0);
    const recommendationCount = history.reduce((sum, turn) => sum + turn.response.recommendations.length, 0);
    
    const feedbackCount = history.filter(turn => turn.feedback).length;
    const positiveFeedback = history.filter(turn => turn.feedback?.type === 'positive').length;
    const satisfactionRate = feedbackCount > 0 ? positiveFeedback / feedbackCount : 0;

    return {
      totalTurns,
      avgConfidence,
      evidenceCount,
      recommendationCount,
      feedbackCount,
      satisfactionRate,
      activeWorkflows: context.activeWorkflows.length,
      contextAge: Date.now() - new Date(context.createdAt).getTime()
    };
  }

  /**
   * Export context data
   */
  exportContext(): ConversationContext | null {
    return this.getCurrentContext();
  }

  /**
   * Import context data
   */
  async importContext(contextData: ConversationContext): Promise<void> {
    this.contexts.set(contextData.id, contextData);
    await this.saveContext(contextData);
  }

  /**
   * Clear current context
   */
  async clearCurrentContext(): Promise<void> {
    if (this.currentContextId) {
      this.contexts.delete(this.currentContextId);
      this.currentContextId = null;
    }
  }

  /**
   * Get default user preferences
   */
  private getDefaultPreferences(overrides?: Partial<UserPreferences>): UserPreferences {
    return {
      defaultJurisdiction: 'Luxembourg',
      preferredFrameworks: ['AML', 'KYC'],
      riskTolerance: 'medium',
      notificationSettings: {
        email: true,
        inApp: true,
        push: false,
        frequency: 'immediate',
        categories: ['critical', 'high']
      },
      displaySettings: {
        theme: 'light',
        fontSize: 'medium',
        density: 'comfortable',
        showConfidenceScores: true,
        showEvidenceDetails: true,
        showProcessingTime: false
      },
      language: 'en',
      timezone: 'Europe/Luxembourg',
      ...overrides
    };
  }

  /**
   * Get default metadata
   */
  private getDefaultMetadata(): ContextMetadata {
    return {
      version: '1.0.0',
      lastRegulatoryUpdate: new Date().toISOString(),
      knowledgeBaseVersion: '1.0.0',
      modelVersion: '1.0.0',
      systemCapabilities: [
        'regulatory_analysis',
        'risk_assessment',
        'compliance_advisory',
        'evidence_generation',
        'workflow_automation'
      ],
      limitations: [
        'Limited to available regulatory sources',
        'May not cover all edge cases',
        'Requires human validation for critical decisions'
      ]
    };
  }

  /**
   * Generate unique context ID
   */
  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique turn ID
   */
  private generateTurnId(): string {
    return `turn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique workflow ID
   */
  private generateWorkflowId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load contexts from storage
   */
  private async loadContexts(): Promise<void> {
    try {
      // In production, this would load from a database
      const stored = localStorage.getItem('conversation_contexts');
      if (stored) {
        const contexts = JSON.parse(stored);
        Object.entries(contexts).forEach(([id, context]) => {
          this.contexts.set(id, context as ConversationContext);
        });
      }
    } catch (error) {
      console.warn('Failed to load contexts:', error);
    }
  }

  /**
   * Save context to storage
   */
  private async saveContext(context: ConversationContext): Promise<void> {
    try {
      // In production, this would save to a database
      const stored = localStorage.getItem('conversation_contexts') || '{}';
      const contexts = JSON.parse(stored);
      contexts[context.id] = context;
      localStorage.setItem('conversation_contexts', JSON.stringify(contexts));
    } catch (error) {
      console.warn('Failed to save context:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      return this.isInitialized;
    } catch (error) {
      console.error('ContextManagementService health check failed:', error);
      return false;
    }
  }
}

