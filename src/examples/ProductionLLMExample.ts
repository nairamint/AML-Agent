/**
 * Production LLM Integration Example
 * 
 * Demonstrates how to use the production-ready LLM system with OpenRouter
 * and LangChain for AML/KYC advisory queries
 */

import { LLMServiceFactory } from '../services/llm/LLMServiceFactory';
import { AgentContext } from '../services/agents/BaseAgent';

export class ProductionLLMExample {
  private factory: LLMServiceFactory;

  constructor() {
    this.factory = LLMServiceFactory.getInstance();
  }

  /**
   * Example 1: Basic regulatory query processing
   */
  async basicRegulatoryQuery(): Promise<void> {
    console.log('=== Basic Regulatory Query Example ===');
    
    try {
      // Create production LLM service
      const llmService = await this.factory.createProductionService();
      
      // Define query context
      const context: AgentContext = {
        query: "What are the enhanced due diligence requirements for politically exposed persons (PEPs) in Luxembourg?",
        conversationHistory: [],
        jurisdiction: "Luxembourg",
        complianceFrameworks: ["CSSF", "AMLD6"],
        riskTolerance: "medium",
        userRole: "compliance_officer",
        timestamp: new Date().toISOString()
      };

      // Process the query
      const response = await llmService.processRegulatoryQuery(context);
      
      console.log('Query:', context.query);
      console.log('Response:', response.content);
      console.log('Confidence:', response.confidence);
      console.log('Evidence Count:', response.evidence.length);
      console.log('Processing Time:', response.processingTime + 'ms');
      
      // Cleanup
      await llmService.cleanup();
      
    } catch (error) {
      console.error('Error in basic regulatory query:', error);
    }
  }

  /**
   * Example 2: Multi-agent system for complex queries
   */
  async multiAgentQuery(): Promise<void> {
    console.log('\n=== Multi-Agent System Example ===');
    
    try {
      // Create multi-agent system
      const multiAgentSystem = await this.factory.createMultiAgentSystem();
      
      // Define complex query context
      const context: AgentContext = {
        query: "I need a comprehensive risk assessment for a new client who is a PEP from a high-risk country, wants to open multiple accounts, and has complex ownership structures. What are the regulatory requirements and risk mitigation strategies?",
        conversationHistory: [],
        jurisdiction: "Luxembourg",
        complianceFrameworks: ["CSSF", "AMLD6", "FATF"],
        riskTolerance: "low",
        userRole: "compliance_officer",
        timestamp: new Date().toISOString()
      };

      // Process with multi-agent system
      const response = await multiAgentSystem.processQuery(context);
      
      console.log('Complex Query:', context.query);
      console.log('Response:', response.content);
      console.log('Confidence:', response.confidence);
      console.log('Evidence Count:', response.evidence.length);
      console.log('Follow-up Suggestions:', response.followUpSuggestions.length);
      
      // Cleanup
      await multiAgentSystem.cleanup();
      
    } catch (error) {
      console.error('Error in multi-agent query:', error);
    }
  }

  /**
   * Example 3: Adaptive model selection
   */
  async adaptiveModelSelection(): Promise<void> {
    console.log('\n=== Adaptive Model Selection Example ===');
    
    try {
      // Create adaptive service for risk assessment
      const riskService = await this.factory.createAdaptiveService('risk-assessment');
      
      const context: AgentContext = {
        query: "Assess the money laundering risk for a fintech startup with international operations and cryptocurrency services",
        conversationHistory: [],
        jurisdiction: "EU",
        complianceFrameworks: ["AMLD6", "FATF"],
        riskTolerance: "medium",
        userRole: "risk_manager",
        timestamp: new Date().toISOString()
      };

      const response = await riskService.processRegulatoryQuery(context);
      
      console.log('Risk Assessment Query:', context.query);
      console.log('Selected Model: Optimized for risk assessment');
      console.log('Response:', response.content);
      console.log('Confidence:', response.confidence);
      
      // Cleanup
      await riskService.cleanup();
      
    } catch (error) {
      console.error('Error in adaptive model selection:', error);
    }
  }

  /**
   * Example 4: RAG system for document search
   */
  async ragDocumentSearch(): Promise<void> {
    console.log('\n=== RAG Document Search Example ===');
    
    try {
      // Create RAG system
      const ragSystem = await this.factory.createRAGSystem();
      
      // Search for relevant documents
      const context: AgentContext = {
        query: "PEP due diligence requirements",
        conversationHistory: [],
        jurisdiction: "Luxembourg",
        complianceFrameworks: ["CSSF"],
        riskTolerance: "medium",
        userRole: "analyst",
        timestamp: new Date().toISOString()
      };

      const results = await ragSystem.searchRelevantDocuments(
        "enhanced due diligence for politically exposed persons",
        context,
        {
          topK: 3,
          jurisdictionFilter: "Luxembourg"
        }
      );
      
      console.log('Search Query: enhanced due diligence for politically exposed persons');
      console.log('Found Documents:', results.length);
      
      results.forEach((result, index) => {
        console.log(`\nDocument ${index + 1}:`);
        console.log('Source:', result.metadata.source);
        console.log('Score:', result.score.toFixed(3));
        console.log('Relevance:', result.relevance);
        console.log('Snippet:', result.document.pageContent.substring(0, 200) + '...');
      });
      
      // Cleanup
      await ragSystem.cleanup();
      
    } catch (error) {
      console.error('Error in RAG document search:', error);
    }
  }

  /**
   * Example 5: Cost estimation and monitoring
   */
  async costEstimation(): Promise<void> {
    console.log('\n=== Cost Estimation Example ===');
    
    try {
      // Get available models
      const models = this.factory.getAvailableModels();
      
      console.log('Available Models:');
      Object.entries(models).forEach(([key, model]) => {
        console.log(`- ${key}: ${model.name} (${model.provider})`);
      });
      
      // Estimate costs for different models
      const inputTokens = 1000;
      const outputTokens = 500;
      
      console.log(`\nCost Estimation for ${inputTokens} input + ${outputTokens} output tokens:`);
      
      Object.keys(models).forEach(modelName => {
        const cost = this.factory.estimateCost(modelName, inputTokens, outputTokens);
        console.log(`- ${modelName}: $${cost.toFixed(6)}`);
      });
      
    } catch (error) {
      console.error('Error in cost estimation:', error);
    }
  }

  /**
   * Example 6: Health monitoring
   */
  async healthMonitoring(): Promise<void> {
    console.log('\n=== Health Monitoring Example ===');
    
    try {
      // Check system health
      const health = await this.factory.healthCheck();
      
      console.log('System Health Status:');
      console.log('- Configuration Valid:', health.configValid);
      console.log('- OpenRouter Accessible:', health.openrouterAccessible);
      console.log('- Pinecone Accessible:', health.pineconeAccessible);
      console.log('- Overall Health:', health.overall ? 'HEALTHY' : 'UNHEALTHY');
      
      if (!health.overall) {
        console.log('\n⚠️  System health issues detected. Please check configuration and connectivity.');
      } else {
        console.log('\n✅ All systems operational.');
      }
      
    } catch (error) {
      console.error('Error in health monitoring:', error);
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    console.log('🚀 Starting Production LLM Integration Examples\n');
    
    try {
      await this.healthMonitoring();
      await this.costEstimation();
      await this.basicRegulatoryQuery();
      await this.multiAgentQuery();
      await this.adaptiveModelSelection();
      await this.ragDocumentSearch();
      
      console.log('\n✅ All examples completed successfully!');
      
    } catch (error) {
      console.error('❌ Error running examples:', error);
    }
  }
}

// Example usage
if (require.main === module) {
  const example = new ProductionLLMExample();
  example.runAllExamples().catch(console.error);
}
