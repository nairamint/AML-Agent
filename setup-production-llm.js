/**
 * Production LLM Setup Script
 * 
 * Interactive setup script for configuring the production LLM system
 * Run with: node setup-production-llm.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 AML-KYC Production LLM Setup\n');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, 'backend', '.env');
  const envExamplePath = path.join(__dirname, 'backend', 'env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created from template');
    } else {
      console.log('❌ env.example file not found');
      return;
    }
  }
  
  // Read current .env content
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Get OpenRouter API key
  console.log('\n🔑 OpenRouter API Key Setup');
  const openrouterKey = await question('Enter your OpenRouter API key: ');
  
  if (openrouterKey && openrouterKey.trim()) {
    envContent = envContent.replace(
      /OPENROUTER_API_KEY=.*/,
      `OPENROUTER_API_KEY=${openrouterKey.trim()}`
    );
    console.log('✅ OpenRouter API key configured');
  }
  
  // Ask about Pinecone (optional)
  console.log('\n🌲 Pinecone Vector Database (Optional)');
  const usePinecone = await question('Do you want to set up Pinecone for vector database? (y/n): ');
  
  if (usePinecone.toLowerCase() === 'y' || usePinecone.toLowerCase() === 'yes') {
    const pineconeKey = await question('Enter your Pinecone API key: ');
    const pineconeEnv = await question('Enter Pinecone environment (default: us-east-1-aws): ') || 'us-east-1-aws';
    const pineconeIndex = await question('Enter Pinecone index name (default: aml-regulatory-knowledge): ') || 'aml-regulatory-knowledge';
    
    if (pineconeKey && pineconeKey.trim()) {
      envContent = envContent.replace(
        /PINECONE_API_KEY=.*/,
        `PINECONE_API_KEY=${pineconeKey.trim()}`
      );
      envContent = envContent.replace(
        /PINECONE_ENVIRONMENT=.*/,
        `PINECONE_ENVIRONMENT=${pineconeEnv.trim()}`
      );
      envContent = envContent.replace(
        /PINECONE_INDEX_NAME=.*/,
        `PINECONE_INDEX_NAME=${pineconeIndex.trim()}`
      );
      console.log('✅ Pinecone configuration added');
    }
  }
  
  // Ask about model preferences
  console.log('\n🤖 Model Configuration');
  const defaultModel = await question('Default model (default: openai/gpt-4-turbo-preview): ') || 'openai/gpt-4-turbo-preview';
  const fallbackModel = await question('Fallback model (default: anthropic/claude-3-sonnet): ') || 'anthropic/claude-3-sonnet';
  
  envContent = envContent.replace(
    /DEFAULT_MODEL=.*/,
    `DEFAULT_MODEL=${defaultModel.trim()}`
  );
  envContent = envContent.replace(
    /FALLBACK_MODEL=.*/,
    `FALLBACK_MODEL=${fallbackModel.trim()}`
  );
  
  // Write updated .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment configuration saved');
  
  // Create a simple test script
  console.log('\n🧪 Creating test script...');
  const testScript = `#!/usr/bin/env node
/**
 * Quick test script for your production LLM setup
 */

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

async function quickTest() {
  console.log('🔍 Testing your production LLM setup...');
  
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ OpenRouter API key found');
  console.log('✅ Default model:', process.env.DEFAULT_MODEL || 'openai/gpt-4-turbo-preview');
  console.log('✅ Fallback model:', process.env.FALLBACK_MODEL || 'anthropic/claude-3-sonnet');
  
  if (process.env.PINECONE_API_KEY) {
    console.log('✅ Pinecone configuration found');
  } else {
    console.log('ℹ️  Pinecone not configured (optional)');
  }
  
  console.log('\\n🎉 Setup complete! You can now run:');
  console.log('   npm install');
  console.log('   npm run dev');
}

quickTest().catch(console.error);
`;
  
  fs.writeFileSync('test-setup.js', testScript);
  console.log('✅ Test script created: test-setup.js');
  
  console.log('\n🎉 Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: node test-setup.js (to verify configuration)');
  console.log('   2. Run: npm install (to install dependencies)');
  console.log('   3. Run: node test-llm-setup.js (to test API connection)');
  console.log('   4. Run: npm run dev (to start the application)');
  
  rl.close();
}

setupEnvironment().catch(console.error);
