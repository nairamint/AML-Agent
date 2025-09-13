/**
 * Test Working Free Models
 * 
 * Tests the free models that are actually available
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnv() {
  const envPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found in backend directory');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

const env = loadEnv();
const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;

// List of free models that should work
const FREE_MODELS = [
  'nvidia/nemotron-nano-9b-v2:free',
  'deepseek/deepseek-chat-v3.1:free',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'z-ai/glm-4.5-air:free',
  'qwen/qwen3-coder:free',
  'moonshotai/kimi-k2:free',
  'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
  'google/gemma-3n-e2b-it:free',
  'tencent/hunyuan-a13b-instruct:free',
  'tngtech/deepseek-r1t2-chimera:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'moonshotai/kimi-dev-72b:free',
  'deepseek/deepseek-r1-0528-qwen3-8b:free',
  'deepseek/deepseek-r1-0528:free'
];

async function testModel(modelId) {
  console.log(`🔍 Testing: ${modelId}`);
  
  const testData = JSON.stringify({
    model: modelId,
    messages: [
      {
        role: "user",
        content: "Hello! Please respond with 'OK' to confirm this model works."
      }
    ],
    max_tokens: 20,
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
      'X-Title': 'AML-KYC Advisory Agent Test',
      'Content-Length': Buffer.byteLength(testData)
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
            console.log(`   ✅ ${modelId} - Working!`);
            console.log(`   📝 Response: ${response.choices[0].message.content}`);
            resolve({ success: true, model: modelId });
          } else {
            console.log(`   ❌ ${modelId} - Failed: ${response.error?.message || 'Unknown error'}`);
            resolve({ success: false, model: modelId, error: response.error?.message });
          }
        } catch (error) {
          console.log(`   ❌ ${modelId} - Parse error: ${error.message}`);
          resolve({ success: false, model: modelId, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ ${modelId} - Request error: ${error.message}`);
      resolve({ success: false, model: modelId, error: error.message });
    });

    req.write(testData);
    req.end();
  });
}

async function findWorkingModels() {
  console.log('🚀 Finding Working Free Models\n');
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ OpenRouter API key found');
  console.log('🔍 Testing free models to find working ones...\n');
  
  const results = [];
  
  // Test models one by one
  for (const model of FREE_MODELS) {
    const result = await testModel(model);
    results.push(result);
    
    // If we find a working model, we can stop early
    if (result.success) {
      console.log(`\n🎉 Found working model: ${model}`);
      break;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const workingModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);
  
  if (workingModels.length > 0) {
    console.log('✅ Working Models:');
    workingModels.forEach(result => {
      console.log(`   - ${result.model}`);
    });
    
    console.log('\n🎉 Great! You have working models!');
    console.log('\n📋 Recommended next steps:');
    console.log('   1. Update your .env file with a working model');
    console.log('   2. Your production LLM system is ready to use');
    console.log('   3. Try running: npm run dev (to start the application)');
    
    // Show how to update the .env file
    if (workingModels.length > 0) {
      const recommendedModel = workingModels[0].model;
      console.log(`\n💡 To update your configuration, change this line in backend/.env:`);
      console.log(`   DEFAULT_MODEL=${recommendedModel}`);
    }
  } else {
    console.log('❌ No working models found');
    console.log('   This might be a temporary issue with the OpenRouter service');
    console.log('   Please try again later or contact OpenRouter support');
  }
}

// Run the test
findWorkingModels();
