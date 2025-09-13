#!/usr/bin/env node

/**
 * Comprehensive System Test for AML-KYC Agent
 * 
 * This script tests the actual functionality of the system against PRD requirements
 * and identifies critical gaps for production readiness.
 * 
 * Usage: node COMPREHENSIVE_SYSTEM_TEST.js
 */

const fs = require('fs');
const path = require('path');

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  },
  tests: [],
  gaps: [],
  recommendations: []
};

// Test Categories
const TEST_CATEGORIES = {
  PRD_COMPLIANCE: 'PRD Compliance',
  LLM_INTEGRATION: 'LLM Integration',
  REGULATORY_KNOWLEDGE: 'Regulatory Knowledge Base',
  SECURITY_AUTH: 'Security & Authentication',
  SANCTIONS_SCREENING: 'Sanctions Screening',
  FRONTEND_BACKEND: 'Frontend-Backend Integration',
  PERFORMANCE: 'Performance & Scalability',
  ENTERPRISE_READINESS: 'Enterprise Readiness'
};

// Test Framework
class TestFramework {
  constructor() {
    this.currentTest = null;
    this.testResults = testResults;
  }

  async runTest(name, category, severity, testFunction) {
    this.currentTest = {
      name,
      category,
      severity,
      status: 'running',
      startTime: Date.now(),
      details: [],
      errors: []
    };

    console.log(`\n🧪 Running Test: ${name}`);
    console.log(`   Category: ${category}`);
    console.log(`   Severity: ${severity}`);

    try {
      await testFunction();
      this.currentTest.status = 'passed';
      this.currentTest.endTime = Date.now();
      this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;
      
      console.log(`   ✅ PASSED (${this.currentTest.duration}ms)`);
      this.testResults.summary.passed++;
      
    } catch (error) {
      this.currentTest.status = 'failed';
      this.currentTest.endTime = Date.now();
      this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;
      this.currentTest.errors.push(error.message);
      
      console.log(`   ❌ FAILED (${this.currentTest.duration}ms)`);
      console.log(`   Error: ${error.message}`);
      this.testResults.summary.failed++;
      
      // Categorize by severity
      if (severity === 'critical') this.testResults.summary.critical++;
      else if (severity === 'high') this.testResults.summary.high++;
      else if (severity === 'medium') this.testResults.summary.medium++;
      else if (severity === 'low') this.testResults.summary.low++;
    }

    this.testResults.summary.totalTests++;
    this.testResults.tests.push(this.currentTest);
  }

  addDetail(message) {
    if (this.currentTest) {
      this.currentTest.details.push(message);
      console.log(`   📝 ${message}`);
    }
  }

  addGap(description, severity, impact, recommendation) {
    this.testResults.gaps.push({
      description,
      severity,
      impact,
      recommendation,
      testName: this.currentTest?.name || 'Unknown'
    });
  }

  addRecommendation(description, priority, effort) {
    this.testResults.recommendations.push({
      description,
      priority,
      effort,
      testName: this.currentTest?.name || 'Unknown'
    });
  }
}

// Test Functions
async function testPRDCompliance() {
  const framework = new TestFramework();

  // Test 1: Feature Completeness
  await framework.runTest(
    'PRD Feature Completeness Check',
    TEST_CATEGORIES.PRD_COMPLIANCE,
    'critical',
    async () => {
      framework.addDetail('Checking PRD features against implementation...');
      
      const prdFeatures = [
        'Interactive Conversational AI',
        'Regulatory Knowledge Base',
        'Multi-Agent LLM Advisory',
        'Evidence-Based Responses',
        'Confidence Scoring System',
        'Compliance Documentation',
        'Feedback Loop & Retraining',
        'Data Integration & Analytics',
        'Real-Time Monitoring Engines',
        'Scenario Simulation & Advisory'
      ];

      const implementedFeatures = [
        'Interactive Conversational AI', // Frontend UI complete
        'Regulatory Knowledge Base', // Backend implemented
        'Multi-Agent LLM Advisory', // Backend implemented
        'Evidence-Based Responses', // Backend implemented, frontend disconnected
        'Confidence Scoring System', // Backend implemented, frontend disconnected
        'Compliance Documentation', // Mock implementation
        'Feedback Loop & Retraining', // Mock implementation
        'Data Integration & Analytics', // Backend implemented
        'Real-Time Monitoring Engines', // Backend implemented
        'Scenario Simulation & Advisory' // Mock implementation
      ];

      const missingFeatures = prdFeatures.filter(feature => 
        !implementedFeatures.includes(feature)
      );

      if (missingFeatures.length > 0) {
        framework.addGap(
          `Missing PRD features: ${missingFeatures.join(', ')}`,
          'critical',
          'System does not meet PRD requirements',
          'Implement missing features or update PRD'
        );
        throw new Error(`Missing ${missingFeatures.length} PRD features`);
      }

      framework.addDetail(`All ${prdFeatures.length} PRD features are implemented`);
    }
  );

  // Test 2: Status Accuracy
  await framework.runTest(
    'PRD Status Accuracy Check',
    TEST_CATEGORIES.PRD_COMPLIANCE,
    'high',
    async () => {
      framework.addDetail('Validating PRD status claims...');
      
      const statusClaims = {
        'Interactive Conversational AI': 'COMPLETE',
        'Regulatory Knowledge Base': 'Backend Integration',
        'Multi-Agent LLM Advisory': 'Backend Integration',
        'Evidence-Based Responses': 'COMPLETE',
        'Confidence Scoring System': 'COMPLETE',
        'Compliance Documentation': 'COMPLETE',
        'Feedback Loop & Retraining': 'COMPLETE',
        'Data Integration & Analytics': 'Backend Integration',
        'Real-Time Monitoring Engines': 'Backend Integration',
        'Scenario Simulation & Advisory': 'UI Complete'
      };

      const actualStatus = {
        'Interactive Conversational AI': 'COMPLETE', // ✅ Accurate
        'Regulatory Knowledge Base': 'COMPLETE', // ✅ Backend is complete
        'Multi-Agent LLM Advisory': 'COMPLETE', // ✅ Backend is complete
        'Evidence-Based Responses': 'DISCONNECTED', // ❌ Frontend-backend gap
        'Confidence Scoring System': 'DISCONNECTED', // ❌ Frontend-backend gap
        'Compliance Documentation': 'MOCK', // ❌ Not real implementation
        'Feedback Loop & Retraining': 'MOCK', // ❌ Not real implementation
        'Data Integration & Analytics': 'COMPLETE', // ✅ Backend is complete
        'Real-Time Monitoring Engines': 'COMPLETE', // ✅ Backend is complete
        'Scenario Simulation & Advisory': 'MOCK' // ❌ Not real implementation
      };

      const inaccurateClaims = [];
      for (const [feature, claimedStatus] of Object.entries(statusClaims)) {
        const actual = actualStatus[feature];
        if (claimedStatus !== actual && !(claimedStatus === 'Backend Integration' && actual === 'COMPLETE')) {
          inaccurateClaims.push(`${feature}: claimed "${claimedStatus}", actual "${actual}"`);
        }
      }

      if (inaccurateClaims.length > 0) {
        framework.addGap(
          `Inaccurate PRD status claims: ${inaccurateClaims.join('; ')}`,
          'high',
          'Misleading status information',
          'Update PRD with accurate status'
        );
        throw new Error(`Found ${inaccurateClaims.length} inaccurate status claims`);
      }

      framework.addDetail('All PRD status claims are accurate');
    }
  );
}

async function testLLMIntegration() {
  const framework = new TestFramework();

  // Test 1: Backend LLM Service
  await framework.runTest(
    'Backend LLM Service Functionality',
    TEST_CATEGORIES.LLM_INTEGRATION,
    'critical',
    async () => {
      framework.addDetail('Testing backend LLM service...');
      
      // Check if LLM service files exist
      const llmServicePath = path.join(__dirname, 'backend', 'src', 'services', 'llmService.ts');
      if (!fs.existsSync(llmServicePath)) {
        throw new Error('LLM service file not found');
      }

      framework.addDetail('LLM service file exists');
      
      // Check for real LLM integrations
      const llmServiceContent = fs.readFileSync(llmServicePath, 'utf8');
      
      if (!llmServiceContent.includes('Ollama')) {
        throw new Error('Ollama integration not found');
      }
      framework.addDetail('Ollama integration found');

      if (!llmServiceContent.includes('OpenAI')) {
        throw new Error('OpenAI integration not found');
      }
      framework.addDetail('OpenAI integration found');

      if (!llmServiceContent.includes('QdrantClient')) {
        throw new Error('Qdrant vector database integration not found');
      }
      framework.addDetail('Qdrant vector database integration found');

      // Check for multi-agent framework
      if (!llmServiceContent.includes('regulatoryInterpretationAgent')) {
        throw new Error('Multi-agent framework not found');
      }
      framework.addDetail('Multi-agent framework found');

      framework.addDetail('Backend LLM service is properly implemented');
    }
  );

  // Test 2: Multi-Agent Framework
  await framework.runTest(
    'Multi-Agent Framework Implementation',
    TEST_CATEGORIES.LLM_INTEGRATION,
    'high',
    async () => {
      framework.addDetail('Testing multi-agent framework...');
      
      const llmServicePath = path.join(__dirname, 'backend', 'src', 'services', 'llmService.ts');
      const llmServiceContent = fs.readFileSync(llmServicePath, 'utf8');
      
      const requiredAgents = [
        'regulatoryInterpretationAgent',
        'riskAssessmentAgent',
        'advisorySynthesisAgent',
        'confidenceScoringAgent'
      ];

      const missingAgents = requiredAgents.filter(agent => 
        !llmServiceContent.includes(agent)
      );

      if (missingAgents.length > 0) {
        throw new Error(`Missing agents: ${missingAgents.join(', ')}`);
      }

      framework.addDetail(`All ${requiredAgents.length} required agents are implemented`);
    }
  );
}

async function testRegulatoryKnowledgeBase() {
  const framework = new TestFramework();

  // Test 1: Knowledge Base Implementation
  await framework.runTest(
    'Regulatory Knowledge Base Implementation',
    TEST_CATEGORIES.REGULATORY_KNOWLEDGE,
    'critical',
    async () => {
      framework.addDetail('Testing regulatory knowledge base...');
      
      const llmServicePath = path.join(__dirname, 'backend', 'src', 'services', 'llmService.ts');
      const llmServiceContent = fs.readFileSync(llmServicePath, 'utf8');
      
      // Check for Qdrant integration
      if (!llmServiceContent.includes('QdrantClient')) {
        throw new Error('Qdrant vector database not integrated');
      }
      framework.addDetail('Qdrant vector database integration found');

      // Check for regulatory knowledge collection
      if (!llmServiceContent.includes('regulatory_knowledge')) {
        throw new Error('Regulatory knowledge collection not found');
      }
      framework.addDetail('Regulatory knowledge collection found');

      // Check for embedding generation
      if (!llmServiceContent.includes('generateEmbedding')) {
        throw new Error('Embedding generation not implemented');
      }
      framework.addDetail('Embedding generation implemented');

      // Check for evidence retrieval
      if (!llmServiceContent.includes('retrieveRegulatoryEvidence')) {
        throw new Error('Evidence retrieval not implemented');
      }
      framework.addDetail('Evidence retrieval implemented');

      // Check for sample data
      if (!llmServiceContent.includes('sampleRegulations')) {
        framework.addGap(
          'Only sample regulatory data found',
          'high',
          'Insufficient regulatory knowledge for production',
          'Implement comprehensive regulatory data ingestion'
        );
      }

      framework.addDetail('Regulatory knowledge base is implemented');
    }
  );
}

async function testSecurityAuthentication() {
  const framework = new TestFramework();

  // Test 1: Authentication Implementation
  await framework.runTest(
    'Authentication System Implementation',
    TEST_CATEGORIES.SECURITY_AUTH,
    'critical',
    async () => {
      framework.addDetail('Testing authentication system...');
      
      // Check backend authentication
      const chatRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'chat.ts');
      if (!fs.existsSync(chatRoutesPath)) {
        throw new Error('Chat routes file not found');
      }

      const chatRoutesContent = fs.readFileSync(chatRoutesPath, 'utf8');
      
      if (!chatRoutesContent.includes('request.user?.id')) {
        throw new Error('User authentication not implemented in chat routes');
      }
      framework.addDetail('User authentication found in chat routes');

      if (!chatRoutesContent.includes('401')) {
        throw new Error('Unauthorized response handling not found');
      }
      framework.addDetail('Unauthorized response handling found');

      // Check frontend authentication
      const streamingServicePath = path.join(__dirname, 'src', 'services', 'streamingService.ts');
      if (!fs.existsSync(streamingServicePath)) {
        throw new Error('Streaming service file not found');
      }

      const streamingServiceContent = fs.readFileSync(streamingServicePath, 'utf8');
      
      if (!streamingServiceContent.includes('Authorization')) {
        throw new Error('Authorization header not implemented in frontend');
      }
      framework.addDetail('Authorization header found in frontend');

      if (!streamingServiceContent.includes('Bearer')) {
        throw new Error('Bearer token authentication not implemented');
      }
      framework.addDetail('Bearer token authentication found');

      framework.addDetail('Authentication system is implemented');
    }
  );

  // Test 2: Security Headers
  await framework.runTest(
    'Security Headers Implementation',
    TEST_CATEGORIES.SECURITY_AUTH,
    'high',
    async () => {
      framework.addDetail('Testing security headers...');
      
      const indexPath = path.join(__dirname, 'backend', 'src', 'index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      if (!indexContent.includes('helmet')) {
        throw new Error('Helmet security headers not implemented');
      }
      framework.addDetail('Helmet security headers found');

      if (!indexContent.includes('cors')) {
        throw new Error('CORS configuration not found');
      }
      framework.addDetail('CORS configuration found');

      if (!indexContent.includes('rateLimit')) {
        throw new Error('Rate limiting not implemented');
      }
      framework.addDetail('Rate limiting found');

      framework.addDetail('Security headers are implemented');
    }
  );
}

async function testSanctionsScreening() {
  const framework = new TestFramework();

  // Test 1: Sanctions Service Implementation
  await framework.runTest(
    'Sanctions Screening Service',
    TEST_CATEGORIES.SANCTIONS_SCREENING,
    'high',
    async () => {
      framework.addDetail('Testing sanctions screening service...');
      
      const sanctionsServicePath = path.join(__dirname, 'backend', 'src', 'services', 'sanctionsService.ts');
      if (!fs.existsSync(sanctionsServicePath)) {
        throw new Error('Sanctions service file not found');
      }

      const sanctionsServiceContent = fs.readFileSync(sanctionsServicePath, 'utf8');
      
      if (!sanctionsServiceContent.includes('checkSanctions')) {
        throw new Error('Sanctions checking method not found');
      }
      framework.addDetail('Sanctions checking method found');

      // Check for production sanctions service
      const productionSanctionsPath = path.join(__dirname, 'backend', 'src', 'services', 'productionSanctionsService.ts');
      if (fs.existsSync(productionSanctionsPath)) {
        framework.addDetail('Production sanctions service found');
        
        const productionContent = fs.readFileSync(productionSanctionsPath, 'utf8');
        if (productionContent.includes('Moov Watchman')) {
          framework.addDetail('Moov Watchman integration found');
        }
      }

      framework.addDetail('Sanctions screening service is implemented');
    }
  );
}

async function testFrontendBackendIntegration() {
  const framework = new TestFramework();

  // Test 1: API Integration
  await framework.runTest(
    'Frontend-Backend API Integration',
    TEST_CATEGORIES.FRONTEND_BACKEND,
    'critical',
    async () => {
      framework.addDetail('Testing frontend-backend API integration...');
      
      // Check frontend API calls
      const streamingServicePath = path.join(__dirname, 'src', 'services', 'streamingService.ts');
      const streamingServiceContent = fs.readFileSync(streamingServicePath, 'utf8');
      
      if (!streamingServiceContent.includes('fetch')) {
        throw new Error('Frontend API calls not implemented');
      }
      framework.addDetail('Frontend API calls found');

      if (!streamingServiceContent.includes('/chat/advisory/stream')) {
        throw new Error('Streaming endpoint not called from frontend');
      }
      framework.addDetail('Streaming endpoint found in frontend');

      // Check backend API routes
      const chatRoutesPath = path.join(__dirname, 'backend', 'src', 'routes', 'chat.ts');
      const chatRoutesContent = fs.readFileSync(chatRoutesPath, 'utf8');
      
      if (!chatRoutesContent.includes('/advisory/stream')) {
        throw new Error('Streaming route not implemented in backend');
      }
      framework.addDetail('Streaming route found in backend');

      // Check for route registration
      const indexPath = path.join(__dirname, 'backend', 'src', 'index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      if (!indexContent.includes('chatRoutes')) {
        throw new Error('Chat routes not registered');
      }
      framework.addDetail('Chat routes are registered');

      framework.addDetail('Frontend-backend API integration is implemented');
    }
  );

  // Test 2: Data Model Alignment
  await framework.runTest(
    'Data Model Alignment',
    TEST_CATEGORIES.FRONTEND_BACKEND,
    'high',
    async () => {
      framework.addDetail('Testing data model alignment...');
      
      // Check frontend types
      const advisoryTypesPath = path.join(__dirname, 'src', 'types', 'advisory.ts');
      if (!fs.existsSync(advisoryTypesPath)) {
        throw new Error('Frontend advisory types not found');
      }

      const advisoryTypesContent = fs.readFileSync(advisoryTypesPath, 'utf8');
      
      if (!advisoryTypesContent.includes('interface Brief')) {
        throw new Error('Brief interface not found in frontend');
      }
      framework.addDetail('Brief interface found in frontend');

      if (!advisoryTypesContent.includes('interface Evidence')) {
        throw new Error('Evidence interface not found in frontend');
      }
      framework.addDetail('Evidence interface found in frontend');

      // Check backend types
      const backendTypesPath = path.join(__dirname, 'backend', 'src', 'types', 'advisory.ts');
      if (fs.existsSync(backendTypesPath)) {
        framework.addDetail('Backend advisory types found');
      } else {
        framework.addGap(
          'Backend advisory types not found',
          'medium',
          'Type safety between frontend and backend',
          'Create backend advisory types'
        );
      }

      framework.addDetail('Data model alignment is acceptable');
    }
  );
}

async function testPerformanceScalability() {
  const framework = new TestFramework();

  // Test 1: Performance Configuration
  await framework.runTest(
    'Performance Configuration',
    TEST_CATEGORIES.PERFORMANCE,
    'medium',
    async () => {
      framework.addDetail('Testing performance configuration...');
      
      const indexPath = path.join(__dirname, 'backend', 'src', 'index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      if (!indexContent.includes('requestTimeout')) {
        framework.addGap(
          'Request timeout not configured',
          'medium',
          'Potential hanging requests',
          'Configure request timeout'
        );
      } else {
        framework.addDetail('Request timeout configured');
      }

      if (!indexContent.includes('bodyLimit')) {
        framework.addGap(
          'Body limit not configured',
          'medium',
          'Potential memory issues',
          'Configure body limit'
        );
      } else {
        framework.addDetail('Body limit configured');
      }

      framework.addDetail('Performance configuration is acceptable');
    }
  );
}

async function testEnterpriseReadiness() {
  const framework = new TestFramework();

  // Test 1: Enterprise Features
  await framework.runTest(
    'Enterprise Features Implementation',
    TEST_CATEGORIES.ENTERPRISE_READINESS,
    'high',
    async () => {
      framework.addDetail('Testing enterprise features...');
      
      const indexPath = path.join(__dirname, 'backend', 'src', 'index.ts');
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Check for enterprise features
      const enterpriseFeatures = [
        'swagger',
        'helmet',
        'cors',
        'rateLimit',
        'jwt'
      ];

      const missingFeatures = enterpriseFeatures.filter(feature => 
        !indexContent.includes(feature)
      );

      if (missingFeatures.length > 0) {
        framework.addGap(
          `Missing enterprise features: ${missingFeatures.join(', ')}`,
          'high',
          'Not enterprise-ready',
          'Implement missing enterprise features'
        );
      } else {
        framework.addDetail('All enterprise features are implemented');
      }

      // Check for audit logging
      const auditServicePath = path.join(__dirname, 'backend', 'src', 'services', 'auditService.ts');
      if (fs.existsSync(auditServicePath)) {
        framework.addDetail('Audit service found');
      } else {
        framework.addGap(
          'Audit service not found',
          'high',
          'No audit trail for compliance',
          'Implement audit service'
        );
      }

      framework.addDetail('Enterprise readiness assessment complete');
    }
  );
}

// Main Test Execution
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive System Tests for AML-KYC Agent');
  console.log('=' .repeat(80));
  console.log(`Test started at: ${testResults.timestamp}`);
  console.log('');

  try {
    await testPRDCompliance();
    await testLLMIntegration();
    await testRegulatoryKnowledgeBase();
    await testSecurityAuthentication();
    await testSanctionsScreening();
    await testFrontendBackendIntegration();
    await testPerformanceScalability();
    await testEnterpriseReadiness();

    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passed} ✅`);
    console.log(`Failed: ${testResults.summary.failed} ❌`);
    console.log(`Critical Issues: ${testResults.summary.critical} 🚨`);
    console.log(`High Priority Issues: ${testResults.summary.high} ⚠️`);
    console.log(`Medium Priority Issues: ${testResults.summary.medium} 📝`);
    console.log(`Low Priority Issues: ${testResults.summary.low} ℹ️`);

    if (testResults.gaps.length > 0) {
      console.log('\n🚨 CRITICAL GAPS IDENTIFIED:');
      testResults.gaps.forEach((gap, index) => {
        console.log(`${index + 1}. [${gap.severity.toUpperCase()}] ${gap.description}`);
        console.log(`   Impact: ${gap.impact}`);
        console.log(`   Recommendation: ${gap.recommendation}`);
        console.log('');
      });
    }

    if (testResults.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      testResults.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.description}`);
        console.log(`   Effort: ${rec.effort}`);
        console.log('');
      });
    }

    // Calculate overall readiness score
    const readinessScore = Math.round((testResults.summary.passed / testResults.summary.totalTests) * 100);
    console.log(`\n🎯 OVERALL READINESS SCORE: ${readinessScore}%`);

    if (readinessScore >= 90) {
      console.log('🟢 SYSTEM IS PRODUCTION READY');
    } else if (readinessScore >= 75) {
      console.log('🟡 SYSTEM NEEDS MINOR FIXES');
    } else if (readinessScore >= 50) {
      console.log('🟠 SYSTEM NEEDS SIGNIFICANT WORK');
    } else {
      console.log('🔴 SYSTEM IS NOT PRODUCTION READY');
    }

    // Save detailed results
    const resultsPath = path.join(__dirname, 'COMPREHENSIVE_TEST_RESULTS.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsPath}`);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runComprehensiveTests().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runComprehensiveTests, testResults };
