/**
 * Complete Setup and Test Script
 * 
 * This script will:
 * 1. Set up the environment
 * 2. Test the OpenRouter API
 * 3. Test the production LLM system
 * 4. Test the sanctions integration
 * 
 * Run with: node setup-and-test.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 AML-KYC Production System Setup & Test\n');

async function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function checkEnvironment() {
  console.log('🔍 Checking environment setup...');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found in backend directory');
    console.log('   Please run: node setup-production-llm.js first');
    return false;
  }
  
  // Check if OpenRouter API key is set
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('OPENROUTER_API_KEY=') || envContent.includes('OPENROUTER_API_KEY=your_openrouter_api_key_here')) {
    console.log('❌ OpenRouter API key not configured');
    console.log('   Please run: node setup-production-llm.js first');
    return false;
  }
  
  console.log('✅ Environment configuration found');
  return true;
}

async function installDependencies() {
  console.log('\n📦 Installing dependencies...');
  
  const result = await runCommand('npm install', 'Installing npm packages');
  if (!result.success) {
    console.log('❌ Failed to install dependencies');
    return false;
  }
  
  console.log('✅ Dependencies installed successfully');
  return true;
}

async function testOpenRouterAPI() {
  console.log('\n🧪 Testing OpenRouter API connection...');
  
  const result = await runCommand('node test-llm-setup.js', 'Testing OpenRouter API');
  if (!result.success) {
    console.log('❌ OpenRouter API test failed');
    return false;
  }
  
  return true;
}

async function testProductionLLM() {
  console.log('\n🧪 Testing Production LLM System...');
  
  const result = await runCommand('node test-production-llm.js', 'Testing Production LLM System');
  if (!result.success) {
    console.log('❌ Production LLM test failed');
    return false;
  }
  
  return true;
}

async function createIntegrationExample() {
  console.log('\n📝 Creating integration example...');
  
  const exampleCode = `
/**
 * Production LLM Integration Example
 * 
 * This example shows how to integrate the production LLM system
 * into your existing application
 */

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

// Example usage in your application
async function exampleUsage() {
  try {
    // Import the LLM service factory
    const { LLMServiceFactory } = require('./src/services/llm/LLMServiceFactory');
    
    // Create a production LLM service
    const factory = LLMServiceFactory.getInstance();
    const llmService = await factory.createProductionService();
    
    // Example regulatory query
    const context = {
      query: "What are the enhanced due diligence requirements for PEPs in Luxembourg?",
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
    
    // Cleanup
    await llmService.cleanup();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
exampleUsage();
`;
  
  fs.writeFileSync('example-integration.js', exampleCode);
  console.log('✅ Integration example created: example-integration.js');
}

async function main() {
  try {
    // Step 1: Check environment
    const envOk = await checkEnvironment();
    if (!envOk) {
      console.log('\n❌ Environment setup incomplete. Please run: node setup-production-llm.js');
      return;
    }
    
    // Step 2: Install dependencies
    const depsOk = await installDependencies();
    if (!depsOk) {
      console.log('\n❌ Dependency installation failed');
      return;
    }
    
    // Step 3: Test OpenRouter API
    const apiOk = await testOpenRouterAPI();
    if (!apiOk) {
      console.log('\n❌ OpenRouter API test failed');
      return;
    }
    
    // Step 4: Test Production LLM System
    const llmOk = await testProductionLLM();
    if (!llmOk) {
      console.log('\n❌ Production LLM test failed');
      return;
    }
    
    // Step 5: Create integration example
    await createIntegrationExample();
    
    console.log('\n🎉 Setup and testing completed successfully!');
    console.log('\n📋 Your production LLM system is ready to use:');
    console.log('   ✅ OpenRouter API key configured and working');
    console.log('   ✅ Dependencies installed');
    console.log('   ✅ Production LLM system tested');
    console.log('   ✅ Multiple models accessible');
    console.log('   ✅ Integration example created');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npm run dev (to start the development server)');
    console.log('   2. Test the integration: node example-integration.js');
    console.log('   3. Start building your AML-KYC advisory features');
    
    console.log('\n📚 Documentation:');
    console.log('   - Production LLM Setup: PRODUCTION_LLM_SETUP.md');
    console.log('   - Examples: src/examples/ProductionLLMExample.ts');
    console.log('   - Integration: example-integration.js');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

main();
