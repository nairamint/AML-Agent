/**
 * Production LLM System Test
 * 
 * Comprehensive test of the production LLM system with real API calls
 * Run with: node test-production-llm.js
 */

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

// Simple test implementation without TypeScript compilation
const https = require('https');

class SimpleLLMTest {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
  }

  async makeRequest(endpoint, data) {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://aml-kyc-agent.com',
        'X-Title': 'AML-KYC Advisory Agent Test',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            if (res.statusCode === 200) {
              resolve(response);
            } else {
              reject(new Error(`API Error: ${res.statusCode} - ${response.error?.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  async testBasicQuery() {
    console.log('🧪 Test 1: Basic Regulatory Query');
    
    const query = {
      model: process.env.DEFAULT_MODEL || 'openai/gpt-4-turbo-preview',
      messages: [
        {
          role: "system",
          content: "You are an expert AML/CFT compliance advisor. Provide concise, accurate responses based on regulatory knowledge."
        },
        {
          role: "user",
          content: "What are the enhanced due diligence requirements for politically exposed persons (PEPs) in Luxembourg under CSSF regulations?"
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    };

    try {
      const response = await this.makeRequest('/chat/completions', query);
      console.log('✅ Basic query successful');
      console.log('📝 Response:', response.choices[0].message.content.substring(0, 200) + '...');
      console.log('💰 Tokens used:', response.usage);
      return true;
    } catch (error) {
      console.error('❌ Basic query failed:', error.message);
      return false;
    }
  }

  async testRiskAssessment() {
    console.log('\n🧪 Test 2: Risk Assessment Query');
    
    const query = {
      model: process.env.FALLBACK_MODEL || 'anthropic/claude-3-sonnet',
      messages: [
        {
          role: "system",
          content: "You are a risk assessment specialist. Analyze the given scenario and provide a structured risk assessment with specific recommendations."
        },
        {
          role: "user",
          content: "Assess the money laundering risk for a fintech startup that offers cryptocurrency services to customers in high-risk jurisdictions. The company has complex ownership structures and limited compliance infrastructure."
        }
      ],
      max_tokens: 800,
      temperature: 0.1
    };

    try {
      const response = await this.makeRequest('/chat/completions', query);
      console.log('✅ Risk assessment successful');
      console.log('📝 Response:', response.choices[0].message.content.substring(0, 200) + '...');
      console.log('💰 Tokens used:', response.usage);
      return true;
    } catch (error) {
      console.error('❌ Risk assessment failed:', error.message);
      return false;
    }
  }

  async testComplianceQuery() {
    console.log('\n🧪 Test 3: Compliance Framework Query');
    
    const query = {
      model: 'openai/gpt-4-turbo-preview',
      messages: [
        {
          role: "system",
          content: "You are a compliance expert specializing in EU regulations. Provide detailed analysis of regulatory requirements with specific citations."
        },
        {
          role: "user",
          content: "Explain the customer due diligence requirements under AMLD6 for financial institutions operating in the EU. Include specific requirements for high-risk customers and ongoing monitoring obligations."
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    };

    try {
      const response = await this.makeRequest('/chat/completions', query);
      console.log('✅ Compliance query successful');
      console.log('📝 Response:', response.choices[0].message.content.substring(0, 200) + '...');
      console.log('💰 Tokens used:', response.usage);
      return true;
    } catch (error) {
      console.error('❌ Compliance query failed:', error.message);
      return false;
    }
  }

  async testModelComparison() {
    console.log('\n🧪 Test 4: Model Comparison');
    
    const models = [
      'openai/gpt-4-turbo-preview',
      'anthropic/claude-3-sonnet',
      'google/gemini-pro'
    ];

    const testQuery = {
      messages: [
        {
          role: "user",
          content: "What are the key differences between CDD and EDD in AML compliance?"
        }
      ],
      max_tokens: 300,
      temperature: 0.1
    };

    const results = [];

    for (const model of models) {
      try {
        console.log(`   Testing ${model}...`);
        const query = { ...testQuery, model };
        const response = await this.makeRequest('/chat/completions', query);
        
        results.push({
          model,
          success: true,
          tokens: response.usage,
          response: response.choices[0].message.content.substring(0, 100) + '...'
        });
        
        console.log(`   ✅ ${model} - ${response.usage.total_tokens} tokens`);
      } catch (error) {
        console.log(`   ❌ ${model} - ${error.message}`);
        results.push({
          model,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async runAllTests() {
    console.log('🚀 Production LLM System Test Suite\n');
    
    if (!this.apiKey) {
      console.error('❌ OPENROUTER_API_KEY not found in environment variables');
      console.log('   Please run: node setup-production-llm.js');
      return;
    }

    console.log('✅ OpenRouter API key found');
    console.log('✅ Default model:', process.env.DEFAULT_MODEL || 'openai/gpt-4-turbo-preview');
    console.log('✅ Fallback model:', process.env.FALLBACK_MODEL || 'anthropic/claude-3-sonnet');
    
    const results = {
      basic: await this.testBasicQuery(),
      risk: await this.testRiskAssessment(),
      compliance: await this.testComplianceQuery(),
      models: await this.testModelComparison()
    };

    console.log('\n📊 Test Results Summary:');
    console.log('   Basic Query:', results.basic ? '✅ PASS' : '❌ FAIL');
    console.log('   Risk Assessment:', results.risk ? '✅ PASS' : '❌ FAIL');
    console.log('   Compliance Query:', results.compliance ? '✅ PASS' : '❌ FAIL');
    
    const successfulModels = results.models.filter(r => r.success).length;
    console.log('   Model Comparison:', `${successfulModels}/${results.models.length} models working`);

    const allPassed = results.basic && results.risk && results.compliance && successfulModels > 0;
    
    if (allPassed) {
      console.log('\n🎉 All tests passed! Your production LLM system is ready.');
      console.log('\n📋 Next steps:');
      console.log('   1. Your OpenRouter API key is working correctly');
      console.log('   2. Multiple models are accessible');
      console.log('   3. You can now use the production LLM system in your application');
      console.log('   4. Run: npm run dev to start the full application');
    } else {
      console.log('\n⚠️  Some tests failed. Please check your configuration.');
      console.log('   - Verify your OpenRouter API key is correct');
      console.log('   - Check your internet connection');
      console.log('   - Ensure you have sufficient credits in your OpenRouter account');
    }
  }
}

// Run the tests
const tester = new SimpleLLMTest();
tester.runAllTests().catch(console.error);
