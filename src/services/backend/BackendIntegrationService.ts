/**
 * Backend Integration Service
 * 
 * Production-ready service that integrates real backend components
 * with the frontend streaming service, replacing mock implementations
 */

import { RealLLMService, LLMConfig } from '../llm/RealLLMService';
import { DatabaseService, DatabaseConfig } from '../database/DatabaseService';
import { RealAuthService, AuthConfig } from '../auth/RealAuthService';
import { MultiAgentOrchestrator, AgentContext } from '../agents/MultiAgentOrchestrator';
import { ContextManagementService } from '../context/ContextManagementService';
import { Brief, StreamingChunk, Evidence, FollowUpSuggestion } from '../../types/advisory';

export interface BackendConfig {
  llm: LLMConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
}

export interface StreamingResponse {
  conversationId: string;
  brief: Brief;
  chunks: StreamingChunk[];
  processingTime: number;
  agentContributions: any;
}

export class BackendIntegrationService {
  private static instance: BackendIntegrationService;
  private llmService: RealLLMService;
  private databaseService: DatabaseService;
  private authService: RealAuthService;
  private orchestrator: MultiAgentOrchestrator;
  private contextManager: ContextManagementService;
  private isInitialized: boolean = false;
  private config: BackendConfig;

  private constructor(config: BackendConfig) {
    this.config = config;
    this.llmService = new RealLLMService(config.llm);
    this.databaseService = new DatabaseService(config.database);
    this.authService = new RealAuthService(config.auth);
    this.orchestrator = new MultiAgentOrchestrator();
    this.contextManager = new ContextManagementService();
  }

  public static getInstance(config?: BackendConfig): BackendIntegrationService {
    if (!BackendIntegrationService.instance) {
      if (!config) {
        throw new Error('BackendIntegrationService requires configuration on first initialization');
      }
      BackendIntegrationService.instance = new BackendIntegrationService(config);
    }
    return BackendIntegrationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Backend Integration Service...');
      
      // Initialize all services in parallel
      await Promise.all([
        this.llmService.initialize(),
        this.databaseService.initialize(),
        this.authService.initialize(),
        this.orchestrator.initialize(),
        this.contextManager.initialize()
      ]);

      this.isInitialized = true;
      console.log('Backend Integration Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Backend Integration Service:', error);
      throw error;
    }
  }

  // Authentication Methods
  async authenticateUser(email: string, password: string): Promise<{
    user: any;
    tokens: any;
    session: any;
  }> {
    if (!this.isInitialized) {
      throw new Error('Backend Integration Service not initialized');
    }

    try {
      const authResult = await this.authService.authenticateUser(email, password);
      
      // Log authentication event
      await this.databaseService.logAuditEvent({
        timestamp: new Date().toISOString(),
        userId: authResult.user.id,
        sessionId: authResult.session.sessionId,
        eventType: 'user_login',
        category: 'authentication',
        severity: 'medium',
        description: 'User successfully authenticated',
        resource: 'auth_service',
        action: 'login',
        result: 'success',
        metadata: {
          email: email,
          ipAddress: '127.0.0.1', // Should be passed from request
          userAgent: navigator.userAgent
        },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent
      });

      return authResult;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Backend Integration Service not initialized');
    }

    try {
      return await this.authService.validateToken(token);
    } catch (error) {
      console.error('Token validation failed:', error);
      throw error;
    }
  }

  // Advisory Processing Methods
  async processAdvisoryQuery(
    query: string,
    userId: string,
    sessionId: string,
    context?: {
      jurisdiction?: string;
      role?: string;
      organization?: string;
    }
  ): Promise<StreamingResponse> {
    if (!this.isInitialized) {
      throw new Error('Backend Integration Service not initialized');
    }

    const startTime = Date.now();
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get or create conversation context
      const conversationContext = await this.contextManager.getCurrentContext() || 
        await this.contextManager.createContext({
          userId,
          sessionId,
          jurisdiction: context?.jurisdiction || 'Luxembourg',
          complianceFrameworks: ['AML', 'KYC'],
          riskTolerance: 'medium',
          userRole: context?.role || 'compliance_officer'
        });

      // Create agent context
      const agentContext: AgentContext = {
        query,
        conversationHistory: await this.contextManager.getConversationHistory(),
        jurisdiction: context?.jurisdiction || 'Luxembourg',
        complianceFrameworks: ['AML', 'KYC'],
        riskTolerance: 'medium',
        userRole: context?.role || 'compliance_officer',
        timestamp: new Date().toISOString()
      };

      // Process query through orchestrator
      const orchestrationResult = await this.orchestrator.processQuery(agentContext);

      // Create streaming response
      const brief = this.convertToBrief(orchestrationResult.finalResponse, conversationId);
      const chunks = this.createStreamingChunks(orchestrationResult.finalResponse);

      // Store conversation turn
      await this.databaseService.storeConversationTurn({
        userId,
        sessionId,
        query,
        response: brief.content,
        confidence: brief.confidence,
        evidence: brief.evidence,
        processingTime: orchestrationResult.processingTime
      });

      // Add to context manager
      await this.contextManager.addConversationTurn({
        id: conversationId,
        query,
        response: {
          id: brief.id,
          content: brief.content,
          confidence: brief.confidence,
          evidence: brief.evidence,
          recommendations: brief.recommendations || [],
          followUpSuggestions: brief.followUpSuggestions,
          processingTime: orchestrationResult.processingTime,
          agentContributions: orchestrationResult.agentContributions
        },
        timestamp: new Date().toISOString(),
        context: agentContext
      });

      // Log advisory generation event
      await this.databaseService.logAuditEvent({
        timestamp: new Date().toISOString(),
        userId,
        sessionId,
        eventType: 'advisory_generated',
        category: 'advisory',
        severity: 'low',
        description: 'Advisory response generated successfully',
        resource: 'advisory_service',
        action: 'generate',
        result: 'success',
        metadata: {
          query: query.substring(0, 100),
          confidence: brief.confidence,
          processingTime: orchestrationResult.processingTime,
          conversationId
        }
      });

      const processingTime = Date.now() - startTime;

      return {
        conversationId,
        brief,
        chunks,
        processingTime,
        agentContributions: orchestrationResult.agentContributions
      };

    } catch (error) {
      console.error('Advisory processing failed:', error);
      
      // Log error event
      await this.databaseService.logAuditEvent({
        timestamp: new Date().toISOString(),
        userId,
        sessionId,
        eventType: 'advisory_error',
        category: 'advisory',
        severity: 'high',
        description: 'Advisory generation failed',
        resource: 'advisory_service',
        action: 'generate',
        result: 'failure',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          query: query.substring(0, 100)
        }
      });

      throw error;
    }
  }

  // Streaming Methods
  async streamAdvisoryResponse(
    query: string,
    userId: string,
    sessionId: string,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete: (brief: Brief) => void,
    onError: (error: string) => void,
    context?: {
      jurisdiction?: string;
      role?: string;
      organization?: string;
    }
  ): Promise<void> {
    try {
      // Process the query
      const response = await this.processAdvisoryQuery(query, userId, sessionId, context);

      // Stream chunks
      for (const chunk of response.chunks) {
        onChunk(chunk);
        // Simulate streaming delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Complete with final brief
      onComplete(response.brief);

    } catch (error) {
      console.error('Streaming error:', error);
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  // Feedback Methods
  async submitFeedback(
    briefId: string,
    userId: string,
    sessionId: string,
    type: 'advisory_quality' | 'system_usability' | 'feature_request' | 'bug_report',
    rating: number,
    comment?: string
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Backend Integration Service not initialized');
    }

    try {
      // Store feedback in database
      await this.databaseService.logAuditEvent({
        timestamp: new Date().toISOString(),
        userId,
        sessionId,
        eventType: 'feedback_submitted',
        category: 'feedback',
        severity: 'low',
        description: `Feedback submitted: ${type}`,
        resource: 'feedback_service',
        action: 'submit',
        result: 'success',
        metadata: {
          briefId,
          type,
          rating,
          comment: comment?.substring(0, 500) // Limit comment length
        }
      });

    } catch (error) {
      console.error('Feedback submission failed:', error);
      throw error;
    }
  }

  // Conversation Management
  async createConversation(
    userId: string,
    title?: string,
    context?: {
      jurisdiction?: string;
      role?: string;
      organization?: string;
    }
  ): Promise<{ id: string; title: string; context?: any; createdAt: string }> {
    if (!this.isInitialized) {
      throw new Error('Backend Integration Service not initialized');
    }

    try {
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create context
      await this.contextManager.createContext({
        userId,
        sessionId: conversationId,
        jurisdiction: context?.jurisdiction || 'Luxembourg',
        complianceFrameworks: ['AML', 'KYC'],
        riskTolerance: 'medium',
        userRole: context?.role || 'compliance_officer'
      });

      return {
        id: conversationId,
        title: title || 'New Conversation',
        context,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Conversation creation failed:', error);
      throw error;
    }
  }

  async getConversation(conversationId: string, userId: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Backend Integration Service not initialized');
    }

    try {
      const history = await this.databaseService.getConversationHistory(userId, conversationId);
      const context = await this.contextManager.getCurrentContext();

      return {
        id: conversationId,
        history,
        context,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Get conversation failed:', error);
      throw error;
    }
  }

  // Utility Methods
  private convertToBrief(agentResponse: any, conversationId: string): Brief {
    return {
      id: `brief_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'recommendation',
      confidence: this.convertConfidenceLevel(agentResponse.confidence),
      evidence: agentResponse.evidence || [],
      followUpSuggestions: agentResponse.followUpSuggestions || [],
      reasoning: agentResponse.reasoning,
      assumptions: agentResponse.assumptions || [],
      timestamp: new Date().toISOString(),
      status: 'completed',
      version: '1.0',
      content: agentResponse.content,
      recommendations: agentResponse.recommendations || []
    };
  }

  private createStreamingChunks(agentResponse: any): StreamingChunk[] {
    const chunks: StreamingChunk[] = [];
    const content = agentResponse.content;
    const words = content.split(' ');
    const chunkSize = 5; // Words per chunk

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      chunks.push({
        id: `chunk_${i}`,
        type: 'content',
        content: chunkWords.join(' '),
        timestamp: new Date().toISOString(),
        isComplete: i + chunkSize >= words.length
      });
    }

    return chunks;
  }

  private convertConfidenceLevel(confidence: number): 'low' | 'medium' | 'high' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized) return false;

      const checks = await Promise.all([
        this.llmService.healthCheck(),
        this.databaseService.healthCheck(),
        this.authService.healthCheck()
      ]);

      return checks.every(check => check === true);
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      await Promise.all([
        this.llmService.cleanup(),
        this.databaseService.cleanup(),
        this.authService.cleanup(),
        this.orchestrator.cleanup(),
        this.contextManager.clearContext()
      ]);

      this.isInitialized = false;
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}
