/**
 * Simple OpenRouter API Test
 * 
 * Tests your OpenRouter API key without complex dependencies
 */

const https = require('https');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Read .env file manually
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

async function testOpenRouter() {
  console.log('🚀 Simple OpenRouter API Test\n');
  
  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment');
    console.log('   Please check your backend/.env file');
    return;
  }
  
  console.log('✅ OpenRouter API key found');
  console.log('🔍 Testing API connection...\n');
  
  const testData = JSON.stringify({
    model: "qwen/qwen3-coder:free",
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
          console.log('✅ OpenRouter API connection successful!');
          console.log('📝 Response:', response.choices[0].message.content);
          console.log('💰 Usage:', response.usage);
          console.log('\n🎉 Your API key is working correctly!');
          console.log('\n📋 Next steps:');
          console.log('   1. Your OpenRouter API key is configured and working');
          console.log('   2. You can now use the production LLM system');
          console.log('   3. Try running: npm run dev (to start the application)');
        } else {
          console.error('❌ API request failed:', response);
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

  req.write(testData);
  req.end();
}

// Run the test
testOpenRouter();
