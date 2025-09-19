# Production LLM Integration Setup Guide

This guide provides step-by-step instructions for setting up the production-ready LLM integration using OpenRouter and LangChain with RAG capabilities.

## Overview

The production LLM system replaces mock implementations with:
- **OpenRouter Integration**: Access to multiple enterprise-grade LLM models
- **LangChain Framework**: Production-ready AI orchestration
- **RAG System**: Retrieval-Augmented Generation with vector database
- **Multi-Agent Architecture**: Specialized agents for different compliance domains
- **Real Vector Search**: Semantic search over regulatory documents

## Prerequisites

1. **OpenRouter API Key**: Get your API key from [OpenRouter](https://openrouter.ai/)
2. **Pinecone Account** (Optional): For production vector database
3. **Node.js 18+**: Required for LangChain dependencies

## Installation

### 1. Install Dependencies

The required dependencies have been added to `package.json`:

```bash
npm install
```

Key dependencies added:
- `@langchain/community`: Community integrations
- `@langchain/core`: Core LangChain functionality
- `@langchain/openai`: OpenAI/LangChain integration
- `@langchain/pinecone`: Pinecone vector database integration
- `langchain`: Main LangChain framework
- `openai`: OpenAI client
- `pinecone-client`: Pinecone client

### 2. Environment Configuration

Update your `.env` file with the following variables:

```env
# OpenRouter Configuration (Required)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Pinecone Configuration (Optional - for production vector database)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=aml-regulatory-knowledge

# LLM Configuration
DEFAULT_MODEL=openai/gpt-4-turbo-preview
FALLBACK_MODEL=anthropic/claude-3-sonnet
TEMPERATURE=0.1
MAX_TOKENS=2000

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5
SIMILARITY_THRESHOLD=0.7

# Agent Configuration
CONFIDENCE_THRESHOLD=0.75
MAX_QUERY_LENGTH=4000
RESPONSE_TIME_MS=5000
```

## Usage

### 1. Basic Usage

```typescript
import { LLMServiceFactory } from './src/services/llm/LLMServiceFactory';

// Create a production LLM service
const factory = LLMServiceFactory.getInstance();
const llmService = await factory.createProductionService();

// Process a regulatory query
const context = {
  query: "What are the enhanced due diligence requirements for PEPs?",
  conversationHistory: [],
  jurisdiction: "Luxembourg",
  complianceFrameworks: ["CSSF", "AMLD6"],
  riskTolerance: "medium",
  userRole: "compliance_officer",
  timestamp: new Date().toISOString()
};

const response = await llmService.processRegulatoryQuery(context);
console.log(response);
```

### 2. Multi-Agent System

```typescript
// Create a multi-agent system for complex queries
const multiAgentSystem = await factory.createMultiAgentSystem();

const response = await multiAgentSystem.processQuery(context);
```

### 3. Adaptive Model Selection

```typescript
// Automatically select the best model for the query type
const adaptiveService = await factory.createAdaptiveService('regulatory');
const response = await adaptiveService.processRegulatoryQuery(context);
```

### 4. RAG System

```typescript
// Create a standalone RAG system
const ragSystem = await factory.createRAGSystem();

// Search for relevant documents
const results = await ragSystem.searchRelevantDocuments(
  "PEP due diligence requirements",
  context,
  {
    topK: 5,
    jurisdictionFilter: "Luxembourg"
  }
);
```

## Available Models

The system supports multiple enterprise-grade models through OpenRouter:

| Model | Provider | Max Tokens | Best For |
|-------|----------|------------|----------|
| `openai/gpt-4-turbo-preview` | OpenAI | 128,000 | General regulatory analysis |
| `anthropic/claude-3-sonnet` | Anthropic | 200,000 | Risk assessment, compliance |
| `anthropic/claude-3-haiku` | Anthropic | 200,000 | Fast responses |
| `google/gemini-pro` | Google | 30,720 | Multimodal analysis |
| `meta-llama/llama-2-70b-chat` | Meta | 4,096 | Open-source alternative |

## Configuration Options

### Model Selection

```typescript
// Use a specific model
const service = await factory.createProductionService({
  customConfig: {
    model: 'anthropic/claude-3-sonnet'
  }
});
```

### RAG Configuration

```typescript
// Customize RAG settings
const ragSystem = await factory.createRAGSystem({
  customConfig: {
    topK: 10,
    similarityThreshold: 0.8,
    chunkSize: 1500
  }
});
```

### Agent Configuration

```typescript
// Customize agent behavior
const agent = await factory.createProductionAgent({
  customConfig: {
    temperature: 0.05, // More deterministic
    maxTokens: 3000,   // Longer responses
    confidenceThreshold: 0.8 // Higher confidence requirement
  }
});
```

## Health Monitoring

```typescript
// Check system health
const health = await factory.healthCheck();
console.log('System Health:', health);

// Expected output:
// {
//   configValid: true,
//   openrouterAccessible: true,
//   pineconeAccessible: true,
//   overall: true
// }
```

## Cost Estimation

```typescript
// Estimate costs before processing
const cost = factory.estimateCost(
  'openai/gpt-4-turbo-preview',
  1000, // input tokens
  500   // output tokens
);
console.log(`Estimated cost: $${cost.toFixed(6)}`);
```

## Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const response = await llmService.processRegulatoryQuery(context);
} catch (error) {
  if (error.message.includes('API key')) {
    console.error('Invalid OpenRouter API key');
  } else if (error.message.includes('rate limit')) {
    console.error('Rate limit exceeded, retrying...');
  } else {
    console.error('LLM processing failed:', error);
  }
}
```

## Performance Optimization

### 1. Model Selection
- Use `claude-3-haiku` for fast, simple queries
- Use `gpt-4-turbo` for complex regulatory analysis
- Use `claude-3-sonnet` for risk assessment

### 2. RAG Optimization
- Adjust `topK` based on query complexity
- Use jurisdiction filtering to improve relevance
- Optimize chunk size for your document types

### 3. Caching
- Implement response caching for repeated queries
- Cache vector embeddings for frequently accessed documents

## Troubleshooting

### Common Issues

1. **API Key Errors**
   ```
   Error: Invalid OpenRouter API key
   ```
   - Verify your API key is correct
   - Check that the key has sufficient credits

2. **Model Not Available**
   ```
   Error: Model not found
   ```
   - Check model name spelling
   - Verify model is available in your OpenRouter plan

3. **Vector Database Errors**
   ```
   Error: Pinecone connection failed
   ```
   - Verify Pinecone credentials
   - Check network connectivity
   - Ensure index exists

4. **Rate Limiting**
   ```
   Error: Rate limit exceeded
   ```
   - Implement exponential backoff
   - Consider upgrading OpenRouter plan
   - Use fallback models

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
process.env.LOG_LEVEL = 'debug';

// Or in your .env file
LOG_LEVEL=debug
```

## Migration from Mock Implementation

The production system is designed to be a drop-in replacement:

1. **Update imports**:
   ```typescript
   // Old
   import { MockLLMService } from './MockLLMService';
   
   // New
   import { LLMServiceFactory } from './LLMServiceFactory';
   ```

2. **Update initialization**:
   ```typescript
   // Old
   const llmService = new MockLLMService();
   
   // New
   const factory = LLMServiceFactory.getInstance();
   const llmService = await factory.createProductionService();
   ```

3. **Update method calls** (no changes needed):
   ```typescript
   // Same interface
   const response = await llmService.processRegulatoryQuery(context);
   ```

## Security Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Data Privacy**
   - OpenRouter may log requests for abuse prevention
   - Consider data sensitivity before sending to external APIs
   - Implement data anonymization for sensitive queries

3. **Rate Limiting**
   - Implement proper rate limiting
   - Monitor usage to avoid unexpected costs
   - Set up billing alerts

## Production Deployment

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

### 4. Scaling
- Use connection pooling for database connections
- Implement caching for frequently accessed data
- Consider load balancing for high-traffic scenarios

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review OpenRouter documentation
3. Check LangChain documentation
4. Create an issue in the project repository

## Next Steps

1. **Set up your OpenRouter API key**
2. **Configure environment variables**
3. **Test with a simple query**
4. **Integrate with your existing application**
5. **Monitor performance and costs**
6. **Optimize based on usage patterns**
