/**
 * Multi-Agent Orchestrator
 * 
 * Central coordination system that manages the interaction between specialized agents,
 * routes queries to appropriate agents, and synthesizes responses into comprehensive
 * advisory outputs. This orchestrator ensures optimal agent utilization and response quality.
 */

import { BaseAgent, AgentContext, AgentResponse, Evidence, FollowUpSuggestion } from './BaseAgent';
import { RegulatoryParserAgent } from './RegulatoryParserAgent';
import { AdvisoryGeneratorAgent } from './AdvisoryGeneratorAgent';
import { ConfidenceScorerAgent } from './ConfidenceScorerAgent';

export interface OrchestrationStrategy {
  name: string;
  description: string;
  agentSequence: string[];
  parallelExecution: boolean;
  synthesisMethod: 'weighted_average' | 'consensus' | 'hierarchical' | 'hybrid';
  confidenceThreshold: number;
}

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  estimatedDuration: number;
  successCriteria: string[];
}

export interface WorkflowStep {
  id: string;
  agentType: string;
  input: any;
  output: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface SynthesisResult {
  finalResponse: AgentResponse;
  agentContributions: Map<string, AgentResponse>;
  confidenceMetrics: any;
  synthesisMethod: string;
  processingTime: number;
  qualityScore: number;
}

export class MultiAgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private strategies: Map<string, OrchestrationStrategy> = new Map();
  private workflows: Map<string, AgentWorkflow> = new Map();
  private isInitialized: boolean = false;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    this.initializeAgents();
    this.initializeStrategies();
    this.initializeWorkflows();
  }

  private initializeAgents(): void {
    this.agents.set('regulatory_parser', new RegulatoryParserAgent());
    this.agents.set('advisory_generator', new AdvisoryGeneratorAgent());
    this.agents.set('confidence_scorer', new ConfidenceScorerAgent());
  }

  private initializeStrategies(): void {
    // Standard advisory strategy
    this.strategies.set('standard_advisory', {
      name: 'Standard Advisory',
      description: 'Standard workflow for general compliance advisory queries',
      agentSequence: ['regulatory_parser', 'advisory_generator', 'confidence_scorer'],
      parallelExecution: false,
      synthesisMethod: 'hierarchical',
      confidenceThreshold: 0.75
    });

    // High-confidence strategy for critical queries
    this.strategies.set('high_confidence', {
      name: 'High Confidence Advisory',
      description: 'Enhanced workflow for critical compliance decisions',
      agentSequence: ['regulatory_parser', 'advisory_generator', 'confidence_scorer'],
      parallelExecution: true,
      synthesisMethod: 'consensus',
      confidenceThreshold: 0.85
    });

    // Regulatory analysis strategy
    this.strategies.set('regulatory_analysis', {
      name: 'Regulatory Analysis',
      description: 'Focused on regulatory requirement analysis',
      agentSequence: ['regulatory_parser', 'confidence_scorer'],
      parallelExecution: false,
      synthesisMethod: 'weighted_average',
      confidenceThreshold: 0.8
    });

    // Risk assessment strategy
    this.strategies.set('risk_assessment', {
      name: 'Risk Assessment',
      description: 'Comprehensive risk assessment workflow',
      agentSequence: ['advisory_generator', 'confidence_scorer'],
      parallelExecution: false,
      synthesisMethod: 'hybrid',
      confidenceThreshold: 0.8
    });
  }

  private initializeWorkflows(): void {
    // Standard advisory workflow
    this.workflows.set('standard_advisory', {
      id: 'standard_advisory',
      name: 'Standard Advisory Workflow',
      description: 'Complete advisory generation with regulatory analysis and confidence scoring',
      steps: [
        {
          id: 'step_1',
          agentType: 'regulatory_parser',
          input: {},
          output: {},
          status: 'pending'
        },
        {
          id: 'step_2',
          agentType: 'advisory_generator',
          input: {},
          output: {},
          status: 'pending'
        },
        {
          id: 'step_3',
          agentType: 'confidence_scorer',
          input: {},
          output: {},
          status: 'pending'
        }
      ],
      estimatedDuration: 10000, // 10 seconds
      successCriteria: [
        'All agents complete successfully',
        'Final confidence score > 0.75',
        'Response includes evidence and recommendations'
      ]
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Multi-Agent Orchestrator...');
      
      // Initialize all agents
      const initPromises = Array.from(this.agents.values()).map(agent => agent.initialize());
      await Promise.all(initPromises);
      
      // Verify all agents are healthy
      const healthChecks = Array.from(this.agents.values()).map(agent => agent.healthCheck());
      const healthResults = await Promise.all(healthChecks);
      
      if (!healthResults.every(healthy => healthy)) {
        throw new Error('One or more agents failed health check');
      }
      
      this.isInitialized = true;
      console.log('Multi-Agent Orchestrator initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Multi-Agent Orchestrator:', error);
      throw error;
    }
  }

  async processQuery(context: AgentContext): Promise<SynthesisResult> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }

    const startTime = Date.now();
    
    try {
      // Determine the best strategy for this query
      const strategy = this.selectStrategy(context);
      
      // Execute the workflow
      const workflow = this.workflows.get(strategy.name.toLowerCase().replace(' ', '_'));
      if (!workflow) {
        throw new Error(`No workflow found for strategy: ${strategy.name}`);
      }
      
      const result = await this.executeWorkflow(workflow, context, strategy);
      
      const processingTime = Date.now() - startTime;
      result.processingTime = processingTime;
      
      // Update performance metrics
      this.updatePerformanceMetrics(strategy.name, processingTime);
      
      return result;
      
    } catch (error) {
      console.error('Error processing query through orchestrator:', error);
      throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private selectStrategy(context: AgentContext): OrchestrationStrategy {
    const queryLower = context.query.toLowerCase();
    
    // High confidence strategy for critical queries
    if (queryLower.includes('critical') || queryLower.includes('urgent') || 
        context.riskTolerance === 'low' || context.userRole === 'compliance_officer') {
      return this.strategies.get('high_confidence')!;
    }
    
    // Regulatory analysis strategy for regulatory queries
    if (queryLower.includes('regulation') || queryLower.includes('requirement') || 
        queryLower.includes('compliance') || queryLower.includes('obligation')) {
      return this.strategies.get('regulatory_analysis')!;
    }
    
    // Risk assessment strategy for risk queries
    if (queryLower.includes('risk') || queryLower.includes('assessment') || 
        queryLower.includes('evaluation') || queryLower.includes('analysis')) {
      return this.strategies.get('risk_assessment')!;
    }
    
    // Default to standard advisory
    return this.strategies.get('standard_advisory')!;
  }

  private async executeWorkflow(
    workflow: AgentWorkflow, 
    context: AgentContext, 
    strategy: OrchestrationStrategy
  ): Promise<SynthesisResult> {
    const agentContributions = new Map<string, AgentResponse>();
    const workflowSteps = [...workflow.steps];
    
    if (strategy.parallelExecution) {
      // Execute agents in parallel
      const promises = workflowSteps.map(step => this.executeAgentStep(step, context));
      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        if (response) {
          const step = workflowSteps[index];
          step.status = 'completed';
          step.output = response;
          agentContributions.set(step.agentType, response);
        }
      });
    } else {
      // Execute agents sequentially
      for (const step of workflowSteps) {
        const response = await this.executeAgentStep(step, context);
        if (response) {
          step.status = 'completed';
          step.output = response;
          agentContributions.set(step.agentType, response);
        } else {
          step.status = 'failed';
          throw new Error(`Agent ${step.agentType} failed to produce response`);
        }
      }
    }
    
    // Synthesize responses
    const finalResponse = await this.synthesizeResponses(agentContributions, strategy, context);
    
    // Calculate confidence metrics
    const confidenceMetrics = await this.calculateConfidenceMetrics(agentContributions, finalResponse);
    
    // Calculate quality score
    const qualityScore = this.calculateQualityScore(agentContributions, finalResponse);
    
    return {
      finalResponse,
      agentContributions,
      confidenceMetrics,
      synthesisMethod: strategy.synthesisMethod,
      processingTime: 0, // Will be set by caller
      qualityScore
    };
  }

  private async executeAgentStep(step: WorkflowStep, context: AgentContext): Promise<AgentResponse | null> {
    try {
      step.status = 'running';
      step.startTime = Date.now();
      
      const agent = this.agents.get(step.agentType);
      if (!agent) {
        throw new Error(`Agent ${step.agentType} not found`);
      }
      
      if (!agent.canHandle(context)) {
        console.warn(`Agent ${step.agentType} cannot handle this context`);
        return null;
      }
      
      const response = await agent.processQuery(context);
      step.endTime = Date.now();
      
      return response;
      
    } catch (error) {
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      step.endTime = Date.now();
      console.error(`Agent ${step.agentType} failed:`, error);
      return null;
    }
  }

  private async synthesizeResponses(
    agentContributions: Map<string, AgentResponse>,
    strategy: OrchestrationStrategy,
    context: AgentContext
  ): Promise<AgentResponse> {
    switch (strategy.synthesisMethod) {
      case 'hierarchical':
        return this.hierarchicalSynthesis(agentContributions, context);
      case 'consensus':
        return this.consensusSynthesis(agentContributions, context);
      case 'weighted_average':
        return this.weightedAverageSynthesis(agentContributions, context);
      case 'hybrid':
        return this.hybridSynthesis(agentContributions, context);
      default:
        return this.hierarchicalSynthesis(agentContributions, context);
    }
  }

  private hierarchicalSynthesis(agentContributions: Map<string, AgentResponse>, context: AgentContext): AgentResponse {
    // Use advisory generator as primary, others as supporting
    const advisoryResponse = agentContributions.get('advisory_generator');
    const regulatoryResponse = agentContributions.get('regulatory_parser');
    const confidenceResponse = agentContributions.get('confidence_scorer');
    
    if (!advisoryResponse) {
      throw new Error('Primary advisory response not available');
    }
    
    // Enhance advisory response with regulatory insights
    let enhancedContent = advisoryResponse.content;
    let enhancedEvidence = [...advisoryResponse.evidence];
    let enhancedSuggestions = [...advisoryResponse.followUpSuggestions];
    
    if (regulatoryResponse) {
      enhancedContent += '\n\n## Regulatory Analysis\n\n' + regulatoryResponse.content;
      enhancedEvidence.push(...regulatoryResponse.evidence);
      enhancedSuggestions.push(...regulatoryResponse.followUpSuggestions);
    }
    
    // Adjust confidence based on confidence scorer
    let finalConfidence = advisoryResponse.confidence;
    if (confidenceResponse) {
      finalConfidence = Math.min(advisoryResponse.confidence, confidenceResponse.confidence);
    }
    
    return {
      ...advisoryResponse,
      content: enhancedContent,
      evidence: enhancedEvidence,
      followUpSuggestions: enhancedSuggestions,
      confidence: finalConfidence,
      reasoning: this.combineReasoning(agentContributions)
    };
  }

  private consensusSynthesis(agentContributions: Map<string, AgentResponse>, context: AgentContext): AgentResponse {
    const responses = Array.from(agentContributions.values());
    if (responses.length === 0) {
      throw new Error('No agent responses available for consensus synthesis');
    }
    
    // Find the response with highest confidence as base
    const baseResponse = responses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    // Combine evidence from all responses
    const allEvidence = responses.flatMap(r => r.evidence);
    const allSuggestions = responses.flatMap(r => r.followUpSuggestions);
    
    // Calculate consensus confidence
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    
    return {
      ...baseResponse,
      evidence: allEvidence,
      followUpSuggestions: allSuggestions,
      confidence: avgConfidence,
      reasoning: this.combineReasoning(agentContributions)
    };
  }

  private weightedAverageSynthesis(agentContributions: Map<string, AgentResponse>, context: AgentContext): AgentResponse {
    const responses = Array.from(agentContributions.values());
    if (responses.length === 0) {
      throw new Error('No agent responses available for weighted average synthesis');
    }
    
    // Weight responses by their confidence
    const totalWeight = responses.reduce((sum, r) => sum + r.confidence, 0);
    
    // Combine content proportionally
    let combinedContent = '';
    responses.forEach(response => {
      const weight = response.confidence / totalWeight;
      combinedContent += `[${(weight * 100).toFixed(0)}%] ${response.content}\n\n`;
    });
    
    // Combine evidence and suggestions
    const allEvidence = responses.flatMap(r => r.evidence);
    const allSuggestions = responses.flatMap(r => r.followUpSuggestions);
    
    // Weighted average confidence
    const weightedConfidence = responses.reduce((sum, r) => sum + (r.confidence * r.confidence), 0) / totalWeight;
    
    return {
      ...responses[0], // Use first response as template
      content: combinedContent,
      evidence: allEvidence,
      followUpSuggestions: allSuggestions,
      confidence: weightedConfidence,
      reasoning: this.combineReasoning(agentContributions)
    };
  }

  private hybridSynthesis(agentContributions: Map<string, AgentResponse>, context: AgentContext): AgentResponse {
    // Combine hierarchical and consensus approaches
    const hierarchicalResult = this.hierarchicalSynthesis(agentContributions, context);
    const consensusResult = this.consensusSynthesis(agentContributions, context);
    
    // Use consensus for evidence and suggestions, hierarchical for content
    return {
      ...hierarchicalResult,
      evidence: consensusResult.evidence,
      followUpSuggestions: consensusResult.followUpSuggestions,
      confidence: (hierarchicalResult.confidence + consensusResult.confidence) / 2,
      reasoning: this.combineReasoning(agentContributions)
    };
  }

  private combineReasoning(agentContributions: Map<string, AgentResponse>): string {
    const reasoningParts: string[] = [];
    
    agentContributions.forEach((response, agentType) => {
      reasoningParts.push(`${agentType}: ${response.reasoning}`);
    });
    
    return reasoningParts.join(' | ');
  }

  private async calculateConfidenceMetrics(
    agentContributions: Map<string, AgentResponse>,
    finalResponse: AgentResponse
  ): Promise<any> {
    const metrics = {
      individualConfidences: Object.fromEntries(
        Array.from(agentContributions.entries()).map(([agent, response]) => [agent, response.confidence])
      ),
      averageConfidence: Array.from(agentContributions.values()).reduce((sum, r) => sum + r.confidence, 0) / agentContributions.size,
      finalConfidence: finalResponse.confidence,
      confidenceVariance: this.calculateVariance(Array.from(agentContributions.values()).map(r => r.confidence)),
      evidenceCount: finalResponse.evidence.length,
      suggestionCount: finalResponse.followUpSuggestions.length
    };
    
    return metrics;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }

  private calculateQualityScore(
    agentContributions: Map<string, AgentResponse>,
    finalResponse: AgentResponse
  ): number {
    let score = 0;
    
    // Base score from final confidence
    score += finalResponse.confidence * 0.4;
    
    // Evidence quality
    score += Math.min(1.0, finalResponse.evidence.length / 5) * 0.2;
    
    // Suggestion quality
    score += Math.min(1.0, finalResponse.followUpSuggestions.length / 3) * 0.1;
    
    // Agent participation
    score += Math.min(1.0, agentContributions.size / 3) * 0.2;
    
    // Response completeness
    const completeness = this.calculateResponseCompleteness(finalResponse);
    score += completeness * 0.1;
    
    return Math.min(1.0, score);
  }

  private calculateResponseCompleteness(response: AgentResponse): number {
    let completeness = 0;
    
    if (response.content && response.content.length > 100) completeness += 0.3;
    if (response.reasoning && response.reasoning.length > 50) completeness += 0.2;
    if (response.evidence && response.evidence.length > 0) completeness += 0.2;
    if (response.assumptions && response.assumptions.length > 0) completeness += 0.1;
    if (response.limitations && response.limitations.length > 0) completeness += 0.1;
    if (response.followUpSuggestions && response.followUpSuggestions.length > 0) completeness += 0.1;
    
    return Math.min(1.0, completeness);
  }

  private updatePerformanceMetrics(strategyName: string, processingTime: number): void {
    if (!this.performanceMetrics.has(strategyName)) {
      this.performanceMetrics.set(strategyName, []);
    }
    
    const metrics = this.performanceMetrics.get(strategyName)!;
    metrics.push(processingTime);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getPerformanceMetrics(): Map<string, { average: number; min: number; max: number; count: number }> {
    const result = new Map();
    
    this.performanceMetrics.forEach((times, strategy) => {
      if (times.length > 0) {
        result.set(strategy, {
          average: times.reduce((sum, time) => sum + time, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length
        });
      }
    });
    
    return result;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isInitialized) return false;
    
    try {
      const healthChecks = Array.from(this.agents.values()).map(agent => agent.healthCheck());
      const results = await Promise.all(healthChecks);
      return results.every(healthy => healthy);
    } catch (error) {
      console.error('Orchestrator health check failed:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.agents.values()).map(agent => agent.cleanup());
    await Promise.all(cleanupPromises);
    
    this.agents.clear();
    this.strategies.clear();
    this.workflows.clear();
    this.performanceMetrics.clear();
    this.isInitialized = false;
  }
}

