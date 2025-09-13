/**
 * Test Your Configured Models
 * 
 * Tests the specific models you configured in your environment
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
const DEFAULT_MODEL = env.DEFAULT_MODEL || 'qwen/qwen3-coder:free';
const FALLBACK_MODEL = env.FALLBACK_MODEL || 'deepseek/deepseek-r1-0528:free';

async function testModel(modelId, description) {
  console.log(`🔍 Testing ${description}: ${modelId}`);
  
  const testData = JSON.stringify({
    model: modelId,
    messages: [
      {
        role: "system",
        content: "You are an expert AML/CFT compliance advisor. Provide concise, accurate responses."
      },
      {
        role: "user",
        content: "What are the basic requirements for customer due diligence in AML compliance? Please respond with a brief summary."
      }
    ],
    max_tokens: 200,
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
            console.log(`   📝 Response: ${response.choices[0].message.content.substring(0, 150)}...`);
            console.log(`   💰 Usage: ${response.usage.total_tokens} tokens`);
            resolve({ success: true, model: modelId, response: response.choices[0].message.content });
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

async function testYourModels() {
  console.log('🚀 Testing Your Configured Models\n');
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ OpenRouter API key found');
  console.log(`📋 Default model: ${DEFAULT_MODEL}`);
  console.log(`📋 Fallback model: ${FALLBACK_MODEL}\n`);
  
  // Test both models
  const results = [];
  
  console.log('🧪 Testing your configured models...\n');
  
  const defaultResult = await testModel(DEFAULT_MODEL, 'Default Model');
  results.push(defaultResult);
  
  console.log('');
  
  const fallbackResult = await testModel(FALLBACK_MODEL, 'Fallback Model');
  results.push(fallbackResult);
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successfulModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);
  
  if (successfulModels.length > 0) {
    console.log('✅ Working Models:');
    successfulModels.forEach(result => {
      console.log(`   - ${result.model}`);
    });
  }
  
  if (failedModels.length > 0) {
    console.log('❌ Failed Models:');
    failedModels.forEach(result => {
      console.log(`   - ${result.model}: ${result.error}`);
    });
  }
  
  if (successfulModels.length > 0) {
    console.log('\n🎉 Great! Your production LLM system is ready to use!');
    console.log('\n📋 Next steps:');
    console.log('   1. Your OpenRouter API key is working');
    console.log('   2. You have working models configured');
    console.log('   3. You can now use the production LLM system');
    console.log('   4. Try running: npm run dev (to start the application)');
  } else {
    console.log('\n⚠️  No models are working. Please check your configuration.');
  }
}

// Run the test
testYourModels();
