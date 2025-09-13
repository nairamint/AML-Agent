#!/usr/bin/env node
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
  
  console.log('\n🎉 Setup complete! You can now run:');
  console.log('   npm install');
  console.log('   npm run dev');
}

quickTest().catch(console.error);
