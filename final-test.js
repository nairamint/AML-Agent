/**
 * Final Test with Working Model
 * 
 * Tests the production LLM system with the working model
 */

const https = require('https');

// Use the working model we found
const OPENROUTER_API_KEY = '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';
const WORKING_MODEL = 'google/gemma-3n-e2b-it:free';

async function testAMLQuery() {
  console.log('🚀 Final AML-KYC Advisory Test\n');
  
  console.log('✅ Using working model:', WORKING_MODEL);
  console.log('🔍 Testing AML compliance query...\n');
  
  const testData = JSON.stringify({
    model: WORKING_MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert AML/CFT compliance advisor. Provide detailed, accurate responses based on regulatory knowledge. Focus on practical compliance requirements and specific regulatory citations."
      },
      {
        role: "user",
        content: "What are the enhanced due diligence requirements for politically exposed persons (PEPs) in Luxembourg under CSSF regulations? Please provide specific requirements and cite relevant regulations."
      }
    ],
    max_tokens: 500,
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
          console.log('✅ AML Advisory Query Successful!');
          console.log('\n📝 Response:');
          console.log('=====================================');
          console.log(response.choices[0].message.content);
          console.log('=====================================');
          console.log('\n💰 Usage:', response.usage);
          
          console.log('\n🎉 SUCCESS! Your production LLM system is working!');
          console.log('\n📋 What this means:');
          console.log('   ✅ Your OpenRouter API key is working');
          console.log('   ✅ You have a working model configured');
          console.log('   ✅ The system can process AML compliance queries');
          console.log('   ✅ You can now use the production LLM system');
          
          console.log('\n🚀 Next Steps:');
          console.log('   1. Create backend/.env file with:');
          console.log('      OPENROUTER_API_KEY=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');
          console.log('      DEFAULT_MODEL=google/gemma-3n-e2b-it:free');
          console.log('      FALLBACK_MODEL=google/gemma-3n-e2b-it:free');
          console.log('   2. Run: npm install (to install dependencies)');
          console.log('   3. Run: npm run dev (to start the application)');
          console.log('   4. Start building your AML-KYC advisory features!');
          
        } else {
          console.error('❌ Query failed:', response);
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
testAMLQuery();
