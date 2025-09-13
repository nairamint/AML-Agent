const axios = require('axios');

async function testChatEndpoint() {
  try {
    console.log('Testing new chat endpoint...');
    
    const chatRequest = {
      threadId: 'test-thread-123',
      content: 'What are the key AML requirements for customer due diligence?',
      expertType: 'AML_CFT',
      temperature: 0.2,
      maxTokens: 1000
    };

    console.log('Sending request:', JSON.stringify(chatRequest, null, 2));

    const response = await axios.post('http://localhost:3000/api/chat/chat', chatRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real token
      },
      responseType: 'stream'
    });

    console.log('Response headers:', response.headers);
    console.log('Streaming response:');

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim()) {
            try {
              const parsed = JSON.parse(data);
              console.log('Chunk:', JSON.stringify(parsed, null, 2));
            } catch (e) {
              console.log('Raw data:', data);
            }
          }
        }
      }
    });

    response.data.on('end', () => {
      console.log('Stream ended');
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
    });

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testChatEndpoint();
