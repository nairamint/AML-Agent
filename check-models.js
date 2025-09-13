/**
 * Check Available Models
 * 
 * Lists all available models for your OpenRouter API key
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

async function checkAvailableModels() {
  console.log('🔍 Checking Available Models for Your API Key\n');
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment');
    return;
  }
  
  console.log('✅ OpenRouter API key found');
  console.log('🔍 Fetching available models...\n');
  
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

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200 && response.data) {
          console.log('✅ Successfully retrieved available models!\n');
          
          // Filter for free models and common models
          const freeModels = response.data.filter(model => 
            model.id.includes(':free') || 
            model.id.includes('qwen') || 
            model.id.includes('deepseek') ||
            model.id.includes('gpt') ||
            model.id.includes('claude')
          );
          
          console.log('🎯 Available Models for Your Account:');
          console.log('=====================================');
          
          freeModels.forEach(model => {
            const context = model.context_length ? ` (${model.context_length} context)` : '';
            const pricing = model.pricing ? ` - $${model.pricing.prompt}/1K tokens` : ' - Free';
            console.log(`   - ${model.id}${context}${pricing}`);
          });
          
          // Test a few models
          console.log('\n🧪 Testing a few models...\n');
          testModels(freeModels.slice(0, 3));
          
        } else {
          console.error('❌ Failed to get models:', response);
          if (response.error) {
            console.error('   Error details:', response.error.message);
          }
        }
      } catch (error) {
        console.error('❌ Failed to parse response:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.end();
}

function testModels(models) {
  models.forEach((model, index) => {
    setTimeout(() => {
      testModel(model.id);
    }, index * 2000); // Test each model with 2 second delay
  });
}

function testModel(modelId) {
  console.log(`🔍 Testing model: ${modelId}`);
  
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

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (res.statusCode === 200 && response.choices && response.choices[0]) {
          console.log(`   ✅ ${modelId} - Working! Response: ${response.choices[0].message.content.substring(0, 50)}...`);
        } else {
          console.log(`   ❌ ${modelId} - Failed: ${response.error?.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`   ❌ ${modelId} - Parse error: ${error.message}`);
      }
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ ${modelId} - Request error: ${error.message}`);
  });

  req.write(testData);
  req.end();
}

// Run the check
checkAvailableModels();
