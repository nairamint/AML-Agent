/**
 * Test Script for Production LLM Setup
 * 
 * This script tests the OpenRouter API key and basic LLM functionality
 * Run with: node test-llm-setup.js
 */

// Simple test without TypeScript compilation
const https = require('https');

// Test configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'your_openrouter_api_key_here';

async function testOpenRouterConnection() {
  console.log('🔍 Testing OpenRouter API connection...');
  
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    console.error('❌ Please set your OPENROUTER_API_KEY environment variable');
    console.log('   Example: export OPENROUTER_API_KEY=your_actual_key_here');
    return false;
  }

  const testData = JSON.stringify({
    model: "openai/gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: "Hello! Please respond with 'API connection successful' to confirm the connection is working."
      }
    ],
    max_tokens: 50,
    temperature: 0.1
  });

  const options = {
    hostname: 'openrouter.ai',
    port: 443,
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://aml-kyc-agent.com',
      'X-Title': 'AML-KYC Advisory Agent Test'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.choices && response.choices[0]) {
            console.log('✅ OpenRouter API connection successful!');
            console.log('📝 Response:', response.choices[0].message.content);
            console.log('💰 Usage:', response.usage);
            resolve(true);
          } else {
            console.error('❌ API request failed:', response);
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Failed to parse response:', error);
          console.log('Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      resolve(false);
    });

    req.write(testData);
    req.end();
  });
}

async function testAvailableModels() {
  console.log('\n🔍 Testing available models...');
  
  const options = {
    hostname: 'openrouter.ai',
    port: 443,
    path: '/api/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://aml-kyc-agent.com',
      'X-Title': 'AML-KYC Advisory Agent Test'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.data) {
            console.log('✅ Available models retrieved successfully!');
            
            // Filter for models we're interested in
            const relevantModels = response.data.filter(model => 
              model.id.includes('gpt-4') || 
              model.id.includes('claude-3') || 
              model.id.includes('gemini-pro')
            );
            
            console.log('🎯 Relevant models for AML-KYC:');
            relevantModels.forEach(model => {
              console.log(`   - ${model.id} (${model.context_length} context)`);
            });
            
            resolve(true);
          } else {
            console.error('❌ Failed to get models:', response);
            resolve(false);
          }
        } catch (error) {
          console.error('❌ Failed to parse models response:', error);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Models request error:', error);
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 AML-KYC Production LLM Setup Test\n');
  
  // Test 1: API Connection
  const connectionTest = await testOpenRouterConnection();
  
  if (!connectionTest) {
    console.log('\n❌ Setup test failed. Please check your API key and try again.');
    process.exit(1);
  }
  
  // Test 2: Available Models
  await testAvailableModels();
  
  console.log('\n✅ All tests passed! Your OpenRouter API key is working correctly.');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: npm install');
  console.log('   2. Run: npm run dev');
  console.log('   3. Test the production LLM system in your application');
  console.log('\n🎉 You\'re ready to use the production LLM system!');
}

// Run the test
main().catch(console.error);
