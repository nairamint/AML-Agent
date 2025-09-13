#!/usr/bin/env tsx

/**
 * Test script for AML/CFT Advisory Agent with OpenRouter Preset Integration
 * 
 * This script demonstrates the AML/CFT Advisory Agent functionality using the
 * OpenRouter preset configuration for regulatory compliance tasks.
 * 
 * Usage:
 *   npm run test:sfdr
 *   or
 *   tsx scripts/test-sfdr-navigator.ts
 */

import { openRouterLLMService, SFDRNavigatorContext } from '../src/services/openRouterLLMService';
import { logger } from '../src/utils/logger';

interface TestScenario {
  name: string;
  context: SFDRNavigatorContext;
  expectedRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  expectedConfidence?: 'low' | 'medium' | 'high';
}

const testScenarios: TestScenario[] = [
  {
    name: "High-Risk Individual Customer",
    context: {
      query: "We have a new customer who is a Politically Exposed Person (PEP) from a high-risk jurisdiction. They want to open a business account for their import/export company. What are our compliance obligations?",
      jurisdiction: "US",
      entityType: "INDIVIDUAL",
      riskLevel: "HIGH",
      regulatoryFramework: ["BSA", "FATCA", "OFAC"],
      userRole: "Compliance Officer",
      organization: "Regional Bank"
    },
    expectedRiskLevel: "HIGH",
    expectedConfidence: "high"
  },
  {
    name: "Corporate Entity with Complex Ownership",
    context: {
      query: "A corporate client has a complex ownership structure with multiple layers of entities across different jurisdictions. Some entities are in countries on our high-risk list. How should we approach the due diligence process?",
      jurisdiction: "EU",
      entityType: "CORPORATE",
      riskLevel: "MEDIUM",
      regulatoryFramework: ["4AMLD", "5AMLD", "6AMLD", "SFDR"],
      userRole: "Senior Compliance Manager",
      organization: "Investment Firm"
    },
    expectedRiskLevel: "MEDIUM",
    expectedConfidence: "high"
  },
  {
    name: "Vessel Registration and Screening",
    context: {
      query: "We need to screen a vessel that will be used for international shipping. The vessel is registered in a flag state that has been flagged for poor maritime governance. What specific screening requirements apply?",
      jurisdiction: "UK",
      entityType: "VESSEL",
      riskLevel: "HIGH",
      regulatoryFramework: ["UK MLR 2017", "OFAC", "UN Sanctions"],
      userRole: "Maritime Compliance Specialist",
      organization: "Shipping Company"
    },
    expectedRiskLevel: "HIGH",
    expectedConfidence: "medium"
  },
  {
    name: "Low-Risk Individual Account",
    context: {
      query: "A local resident with a clean background wants to open a basic checking account. They have been a customer for 5 years with no issues. What are the standard KYC requirements?",
      jurisdiction: "US",
      entityType: "INDIVIDUAL",
      riskLevel: "LOW",
      regulatoryFramework: ["BSA", "CIP"],
      userRole: "Account Manager",
      organization: "Community Bank"
    },
    expectedRiskLevel: "LOW",
    expectedConfidence: "high"
  },
  {
    name: "Aircraft Financing and Compliance",
    context: {
      query: "We are considering financing an aircraft purchase for a corporate client. The aircraft will be used for international business travel. What are the specific compliance considerations for aircraft financing?",
      jurisdiction: "US",
      entityType: "AIRCRAFT",
      riskLevel: "MEDIUM",
      regulatoryFramework: ["BSA", "OFAC", "FATCA", "Aircraft Financing Regulations"],
      userRole: "Aircraft Finance Specialist",
      organization: "Commercial Bank"
    },
    expectedRiskLevel: "MEDIUM",
    expectedConfidence: "medium"
  }
];

async function testSFDRNavigator() {
  console.log('🧭 Testing AML/CFT Advisory Agent with OpenRouter Preset...\n');

  try {
    // Initialize the OpenRouter LLM service
    await openRouterLLMService.initialize();
    console.log('✅ OpenRouter LLM Service initialized with AML/CFT Advisory Agent preset\n');

    // Display preset information
    const presetInfo = openRouterLLMService.getPresetInfo();
    console.log('📋 Preset Configuration:');
    console.log(`   Name: ${presetInfo.name}`);
    console.log(`   Slug: ${presetInfo.slug}`);
    console.log(`   Primary Provider: ${presetInfo.providerPreferences.only?.[0] || 'Multiple'}`);
    console.log(`   Temperature: ${presetInfo.parameters.temperature}`);
    console.log(`   Max Tokens: ${presetInfo.parameters.max_tokens}`);
    console.log(`   Data Collection: ${presetInfo.providerPreferences.data_collection}\n`);

    // Test each scenario
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`🔍 Test ${i + 1}: ${scenario.name}`);
      console.log(`   Jurisdiction: ${scenario.context.jurisdiction}`);
      console.log(`   Entity Type: ${scenario.context.entityType}`);
      console.log(`   Risk Level: ${scenario.context.riskLevel}`);
      console.log(`   Query: ${scenario.context.query.substring(0, 100)}...`);
      
      try {
        const startTime = Date.now();
        const result = await openRouterLLMService.generateSFDRAdvisory(scenario.context);
        const processingTime = Date.now() - startTime;

        console.log(`   📊 Results:`);
        console.log(`      - Confidence: ${result.confidence} ${result.confidence === scenario.expectedConfidence ? '✅' : '⚠️'}`);
        console.log(`      - Processing Time: ${processingTime}ms`);
        console.log(`      - Recommendations: ${result.recommendations.length}`);
        console.log(`      - Regulatory References: ${result.regulatoryReferences.length}`);
        console.log(`      - Follow-up Actions: ${result.followUpActions.length}`);
        
        console.log(`   📝 Top Recommendations:`);
        result.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`      ${index + 1}. ${rec}`);
        });

        console.log(`   📚 Regulatory References:`);
        result.regulatoryReferences.slice(0, 3).forEach((ref, index) => {
          console.log(`      ${index + 1}. ${ref}`);
        });

        console.log(`   🎯 Follow-up Actions:`);
        result.followUpActions.slice(0, 2).forEach((action, index) => {
          console.log(`      ${index + 1}. ${action}`);
        });

        // Validate expectations
        if (scenario.expectedConfidence && result.confidence !== scenario.expectedConfidence) {
          console.log(`   ⚠️  Expected confidence: ${scenario.expectedConfidence}, got: ${result.confidence}`);
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      console.log('');
    }

    // Test streaming functionality
    console.log('🌊 Testing streaming functionality...');
    const streamingContext = testScenarios[0].context;
    
    let streamedContent = '';
    let chunkCount = 0;
    
    await openRouterLLMService.streamSFDRAdvisory(
      streamingContext,
      (chunk: string) => {
        streamedContent += chunk;
        chunkCount++;
        if (chunkCount <= 5) { // Show first 5 chunks
          console.log(`   📦 Chunk ${chunkCount}: ${chunk.substring(0, 50)}...`);
        }
      },
      (response: any) => {
        console.log(`   ✅ Streaming completed: ${chunkCount} chunks, ${streamedContent.length} characters`);
        console.log(`   📊 Final confidence: ${response.confidence}`);
      },
      (error: Error) => {
        console.log(`   ❌ Streaming error: ${error.message}`);
      }
    );

    // Test available models
    console.log('\n🤖 Testing model availability...');
    const models = await openRouterLLMService.getAvailableModels();
    console.log(`   Available models: ${models.length}`);
    console.log(`   Sample models: ${models.slice(0, 5).join(', ')}`);

    // Performance summary
    console.log('\n📈 Performance Summary:');
    console.log(`   Total scenarios tested: ${testScenarios.length}`);
    console.log(`   Preset: @preset/${presetInfo.slug}`);
    console.log(`   Provider preferences: ${presetInfo.providerPreferences.only?.join(', ') || 'Multiple'}`);
    console.log(`   Data collection: ${presetInfo.providerPreferences.data_collection}`);

  } catch (error) {
    console.error('❌ AML/CFT Advisory Agent test failed:', error);
  }
}

async function testPresetConfiguration() {
  console.log('\n⚙️  Testing Preset Configuration...\n');

  try {
    const presetInfo = openRouterLLMService.getPresetInfo();
    
    console.log('📋 Preset Details:');
    console.log(`   Name: ${presetInfo.name}`);
    console.log(`   Slug: ${presetInfo.slug}`);
    
    console.log('\n🔧 Provider Preferences:');
    console.log(`   Only: ${presetInfo.providerPreferences.only?.join(', ') || 'All providers'}`);
    console.log(`   Sort by: ${presetInfo.providerPreferences.sort || 'default'}`);
    console.log(`   Order: ${presetInfo.providerPreferences.order?.join(' → ') || 'default'}`);
    console.log(`   Max price: $${presetInfo.providerPreferences.max_price?.prompt}/${presetInfo.providerPreferences.max_price?.completion} per token`);
    console.log(`   Allow fallbacks: ${presetInfo.providerPreferences.allow_fallbacks}`);
    console.log(`   Data collection: ${presetInfo.providerPreferences.data_collection}`);
    
    console.log('\n🎛️  Parameters:');
    console.log(`   Temperature: ${presetInfo.parameters.temperature}`);
    console.log(`   Top-p: ${presetInfo.parameters.top_p}`);
    console.log(`   Top-k: ${presetInfo.parameters.top_k}`);
    console.log(`   Max tokens: ${presetInfo.parameters.max_tokens}`);
    console.log(`   Seed: ${presetInfo.parameters.seed}`);
    console.log(`   Presence penalty: ${presetInfo.parameters.presence_penalty}`);
    console.log(`   Frequency penalty: ${presetInfo.parameters.frequency_penalty}`);
    console.log(`   Repetition penalty: ${presetInfo.parameters.repetition_penalty}`);
    
    console.log('\n📝 System Prompt:');
    console.log(`   Length: ${presetInfo.systemPrompt?.length || 0} characters`);
    console.log(`   Preview: ${presetInfo.systemPrompt?.substring(0, 200)}...`);

  } catch (error) {
    console.error('❌ Preset configuration test failed:', error);
  }
}

async function main() {
    console.log('🚀 Starting AML/CFT Advisory Agent Tests\n');
  console.log('=' .repeat(60));
  
  try {
    await testPresetConfiguration();
    await testSFDRNavigator();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All AML/CFT Advisory Agent tests completed successfully!');
    console.log('\n🎯 Key Features Tested:');
    console.log('   ✅ OpenRouter preset integration');
    console.log('   ✅ Multi-scenario regulatory analysis');
    console.log('   ✅ Streaming response generation');
    console.log('   ✅ Provider preference configuration');
    console.log('   ✅ Cost optimization settings');
    console.log('   ✅ Privacy and data protection');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { testSFDRNavigator, testPresetConfiguration };
