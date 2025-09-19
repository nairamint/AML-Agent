# Next Steps Guide - Production LLM Integration

## 🎉 Congratulations! Your Production LLM System is Ready

You now have a complete production-ready LLM integration with OpenRouter and LangChain. Here's how to proceed:

## 🚀 Immediate Next Steps

### 1. Set Up Your Environment (5 minutes)

```bash
# Run the interactive setup script
node setup-production-llm.js
```

This will:
- Create your `.env` file
- Configure your OpenRouter API key
- Set up optional Pinecone configuration
- Create test scripts

### 2. Install Dependencies (2 minutes)

```bash
npm install
```

This installs all the new LangChain dependencies:
- `@langchain/community`
- `@langchain/core`
- `@langchain/openai`
- `@langchain/pinecone`
- `langchain`
- `openai`
- `pinecone-client`

### 3. Test Your Setup (3 minutes)

```bash
# Test OpenRouter API connection
node test-llm-setup.js

# Test the complete production system
node test-production-llm.js

# Or run everything at once
node setup-and-test.js
```

## 🧪 Testing Your System

### Quick API Test
```bash
node test-llm-setup.js
```
Expected output:
```
✅ OpenRouter API connection successful!
📝 Response: API connection successful
💰 Usage: { prompt_tokens: 15, completion_tokens: 5, total_tokens: 20 }
```

### Full System Test
```bash
node test-production-llm.js
```
Expected output:
```
✅ Basic query successful
✅ Risk assessment successful
✅ Compliance query successful
✅ Model comparison completed
🎉 All tests passed! Your production LLM system is ready.
```

## 🔧 Integration Examples

### Basic Usage
```typescript
import { LLMServiceFactory } from './src/services/llm/LLMServiceFactory';

const factory = LLMServiceFactory.getInstance();
const llmService = await factory.createProductionService();

const response = await llmService.processRegulatoryQuery({
  query: "What are the PEP requirements in Luxembourg?",
  jurisdiction: "Luxembourg",
  complianceFrameworks: ["CSSF", "AMLD6"],
  riskTolerance: "medium",
  userRole: "compliance_officer",
  timestamp: new Date().toISOString()
});
```

### Multi-Agent System
```typescript
const multiAgentSystem = await factory.createMultiAgentSystem();
const response = await multiAgentSystem.processQuery(context);
```

### Adaptive Model Selection
```typescript
const adaptiveService = await factory.createAdaptiveService('risk-assessment');
const response = await adaptiveService.processRegulatoryQuery(context);
```

## 🎯 Available Models

Your system now supports these enterprise-grade models:

| Model | Best For | Max Tokens | Cost |
|-------|----------|------------|------|
| `openai/gpt-4-turbo-preview` | General regulatory analysis | 128,000 | $0.01/1K tokens |
| `anthropic/claude-3-sonnet` | Risk assessment, compliance | 200,000 | $0.003/1K tokens |
| `anthropic/claude-3-haiku` | Fast responses | 200,000 | $0.00025/1K tokens |
| `google/gemini-pro` | Multimodal analysis | 30,720 | $0.0005/1K tokens |

## 🔍 Sanctions Integration

Your system now includes comprehensive sanctions checking:

```typescript
import { SanctionsIntegrationService } from './src/services/sanctions/SanctionsIntegrationService';

const sanctionsService = new SanctionsIntegrationService({
  moovPublicKey: process.env.MOOV_PUBLIC_KEY,
  moovPrivateKey: process.env.MOOV_PRIVATE_KEY,
  ofacApiKey: process.env.OFAC_API_KEY,
  // ... other API keys
});

const results = await sanctionsService.checkSanctions('John Doe', 'person');
```

## 🏃‍♂️ Start Development

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test in Your Application
```bash
node example-integration.js
```

### 3. Build Your Features
- Regulatory advisory queries
- Risk assessments
- Compliance checking
- Sanctions screening

## 📊 Monitoring & Optimization

### Health Monitoring
```typescript
const health = await factory.healthCheck();
console.log('System Health:', health);
```

### Cost Estimation
```typescript
const cost = factory.estimateCost('openai/gpt-4-turbo-preview', 1000, 500);
console.log(`Estimated cost: $${cost.toFixed(6)}`);
```

### Performance Metrics
- Response times
- Token usage
- Model performance
- Error rates

## 🔒 Security Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Data Privacy**
   - OpenRouter may log requests for abuse prevention
   - Consider data sensitivity before sending to external APIs
   - Implement data anonymization for sensitive queries

3. **Rate Limiting**
   - Monitor usage to avoid unexpected costs
   - Set up billing alerts
   - Implement proper rate limiting

## 🚨 Troubleshooting

### Common Issues

1. **API Key Errors**
   ```
   ❌ Invalid OpenRouter API key
   ```
   - Verify your API key is correct
   - Check that the key has sufficient credits

2. **Model Not Available**
   ```
   ❌ Model not found
   ```
   - Check model name spelling
   - Verify model is available in your OpenRouter plan

3. **Rate Limiting**
   ```
   ❌ Rate limit exceeded
   ```
   - Implement exponential backoff
   - Consider upgrading OpenRouter plan
   - Use fallback models

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev
```

## 📈 Scaling for Production

### 1. Environment Variables
Ensure all required environment variables are set in production.

### 2. Health Checks
Implement health check endpoints:
```typescript
app.get('/health/llm', async (req, res) => {
  const health = await factory.healthCheck();
  res.json(health);
});
```

### 3. Monitoring
- Monitor API usage and costs
- Track response times and error rates
- Set up alerts for system failures

### 4. Caching
- Implement response caching for repeated queries
- Cache vector embeddings for frequently accessed documents

## 🎯 Success Metrics

You'll know your system is working when:

- ✅ OpenRouter API tests pass
- ✅ Multiple models are accessible
- ✅ Regulatory queries return accurate responses
- ✅ Risk assessments are comprehensive
- ✅ Sanctions checking works
- ✅ Response times are acceptable (< 5 seconds)
- ✅ Costs are within budget

## 📚 Additional Resources

- [Production LLM Setup Guide](./PRODUCTION_LLM_SETUP.md)
- [Backend Setup Guide](./BACKEND_SETUP_GUIDE.md)
- [Examples](./src/examples/ProductionLLMExample.ts)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [LangChain Documentation](https://js.langchain.com/docs)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the test outputs for specific error messages
3. Verify your OpenRouter account status and credits
4. Check your internet connectivity
5. Review the configuration in your `.env` file

## 🎉 You're Ready!

Your production LLM system is now ready for enterprise use. You have:

- ✅ Real AI models via OpenRouter
- ✅ Production-ready RAG system
- ✅ Multi-agent architecture
- ✅ Comprehensive sanctions integration
- ✅ Cost monitoring and optimization
- ✅ Health monitoring and error handling
- ✅ Security best practices

Start building your AML-KYC advisory features with confidence!
