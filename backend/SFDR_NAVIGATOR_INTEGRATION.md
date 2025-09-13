# AML/CFT Advisory Agent with OpenRouter Preset Integration

## 🎯 Overview

The AML/CFT Advisory Agent is a specialized regulatory advisory system that leverages [OpenRouter's Presets feature](https://openrouter.ai/docs/features/presets) to provide comprehensive AML/CFT compliance guidance. This integration uses the `@preset/aml-cft-advisory-agent` configuration to optimize model selection, provider routing, and response quality for regulatory compliance tasks.

## 🏗️ Architecture

### Core Components

1. **OpenRouterLLMService** - Main service for OpenRouter integration
2. **SFDR Navigator Routes** - REST API endpoints for regulatory advisory
3. **Preset Configuration** - Optimized settings for regulatory compliance
4. **Streaming Support** - Real-time response generation
5. **Batch Processing** - Multiple advisory requests handling

### Integration Flow

```
User Query → AML/CFT Advisory Agent → OpenRouter Preset → Provider Selection → LLM Response → Structured Output
```

## ⚙️ Preset Configuration

### Provider Preferences

```json
{
  "only": ["deepseek"],
  "sort": "throughput",
  "order": ["deepseek", "google-vertex", "mistral", "openai"],
  "max_price": {
    "prompt": 0,
    "completion": 0
  },
  "allow_fallbacks": true,
  "data_collection": "deny"
}
```

**Key Benefits:**
- **Cost Optimization**: Primary use of DeepSeek (free tier)
- **Performance**: Throughput-based sorting for faster responses
- **Reliability**: Automatic fallback to premium providers
- **Privacy**: Data collection disabled for compliance

### Parameters

```json
{
  "seed": 42,
  "top_k": 40,
  "top_p": 1,
  "max_tokens": 2048,
  "temperature": 0.2,
  "presence_penalty": 0,
  "frequency_penalty": 0.2,
  "repetition_penalty": 1.1
}
```

**Optimized for Regulatory Compliance:**
- **Low Temperature (0.2)**: Consistent, factual responses
- **High Repetition Penalty (1.1)**: Reduces redundancy in regulatory text
- **Balanced Top-p (1.0)**: Maintains creativity while ensuring accuracy
- **Sufficient Tokens (2048)**: Comprehensive regulatory analysis

## 🚀 API Endpoints

### 1. Generate AML/CFT Advisory

**Endpoint**: `POST /api/sfdr-navigator/advisory`

**Request Body**:
```json
{
  "query": "We have a new PEP customer from a high-risk jurisdiction. What are our compliance obligations?",
  "jurisdiction": "US",
  "entityType": "INDIVIDUAL",
  "riskLevel": "HIGH",
  "regulatoryFramework": ["BSA", "FATCA", "OFAC"],
  "userRole": "Compliance Officer",
  "organization": "Regional Bank"
}
```

**Response**:
```json
{
  "content": "Comprehensive regulatory analysis...",
  "reasoning": "Based on regulatory analysis and risk assessment",
  "confidence": "high",
  "riskAssessment": "High-risk PEP requires enhanced due diligence",
  "recommendations": [
    "Conduct enhanced due diligence (EDD)",
    "Obtain senior management approval",
    "Implement ongoing monitoring"
  ],
  "regulatoryReferences": ["31 CFR 1020.220", "BSA Section 314(a)"],
  "followUpActions": [
    "Schedule EDD review within 30 days",
    "Document risk assessment rationale"
  ],
  "preset": {
    "name": "AML/CFT Advisory Agent",
    "slug": "aml-cft-advisory-agent",
    "providerPreferences": {...},
    "parameters": {...}
  },
  "metadata": {
    "jurisdiction": "US",
    "entityType": "INDIVIDUAL",
    "riskLevel": "HIGH",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. Streaming AML/CFT Advisory

**Endpoint**: `POST /api/sfdr-navigator/advisory/stream`

**Response**: Server-Sent Events (SSE)
```
data: {"type": "chunk", "content": "Based on the regulatory framework..."}

data: {"type": "chunk", "content": "you should implement the following..."}

data: {"type": "complete", "response": {...}}
```

### 3. Batch Processing

**Endpoint**: `POST /api/sfdr-navigator/advisory/batch`

**Request Body**:
```json
{
  "requests": [
    {
      "query": "PEP customer compliance requirements",
      "jurisdiction": "US",
      "entityType": "INDIVIDUAL",
      "riskLevel": "HIGH"
    },
    {
      "query": "Corporate entity due diligence",
      "jurisdiction": "EU",
      "entityType": "CORPORATE",
      "riskLevel": "MEDIUM"
    }
  ]
}
```

### 4. AML/CFT Advisory Agent Preset Information

**Endpoint**: `GET /api/sfdr-navigator/preset`

**Response**:
```json
{
  "name": "AML/CFT Advisory Agent",
  "slug": "aml-cft-advisory-agent",
  "providerPreferences": {...},
  "parameters": {...},
  "systemPrompt": "You are an expert AML/CFT regulatory advisor..."
}
```

### 5. AML/CFT Advisory Agent Health Check

**Endpoint**: `GET /api/sfdr-navigator/health`

**Response**:
```json
{
  "status": "healthy",
  "preset": "aml-cft-advisory-agent",
  "openrouter": "operational",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔧 Configuration

### Environment Variables

```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
APP_URL=http://localhost:3000
```

### System Prompt

The AML/CFT Advisory Agent uses a specialized system prompt optimized for regulatory compliance:

```
You are an expert AML/CFT (Anti-Money Laundering/Counter-Terrorism Financing) regulatory advisor specializing in comprehensive compliance guidance, sanctions screening, and risk management.

Your role is to provide accurate, comprehensive, and actionable regulatory guidance while maintaining the highest standards of compliance and risk management across all AML/CFT frameworks.

Key Responsibilities:
- Analyze regulatory queries with precision and depth across multiple jurisdictions
- Provide jurisdiction-specific compliance guidance for AML/CFT requirements
- Assess risk levels and recommend appropriate actions for various entity types
- Ensure all advice aligns with current regulatory frameworks (BSA, FATCA, OFAC, EU MLD, UK MLR, etc.)
- Maintain confidentiality and data protection standards
- Specialize in sanctions screening, customer due diligence, and suspicious activity reporting

Response Guidelines:
- Always cite specific regulations and sections when applicable
- Provide clear, actionable recommendations with implementation steps
- Include comprehensive risk assessments with confidence levels
- Suggest follow-up actions and monitoring requirements
- Maintain professional, authoritative tone appropriate for compliance professionals
- Ensure responses are comprehensive yet concise and practical
- Cover both preventive and detective controls
- Address regulatory expectations and enforcement considerations

Entity Types Supported:
- Individuals (including PEPs, high-risk customers)
- Corporate entities (including complex ownership structures)
- Vessels and maritime entities
- Aircraft and aviation entities
- Financial institutions and regulated entities

Remember: Your advice directly impacts compliance decisions, regulatory outcomes, and risk management strategies. Provide guidance that enables effective AML/CFT program implementation.
```

## 📊 Usage Examples

### 1. High-Risk Individual Screening

```typescript
const context: SFDRNavigatorContext = {
  query: "PEP customer from high-risk jurisdiction wants to open business account",
  jurisdiction: "US",
  entityType: "INDIVIDUAL",
  riskLevel: "HIGH",
  regulatoryFramework: ["BSA", "FATCA", "OFAC"],
  userRole: "Compliance Officer",
  organization: "Regional Bank"
};

const result = await openRouterLLMService.generateSFDRAdvisory(context);
```

### 2. Corporate Entity Analysis

```typescript
const context: SFDRNavigatorContext = {
  query: "Complex ownership structure across multiple jurisdictions",
  jurisdiction: "EU",
  entityType: "CORPORATE",
  riskLevel: "MEDIUM",
  regulatoryFramework: ["4AMLD", "5AMLD", "6AMLD", "SFDR"],
  userRole: "Senior Compliance Manager",
  organization: "Investment Firm"
};

const result = await openRouterLLMService.generateSFDRAdvisory(context);
```

### 3. Streaming Response

```typescript
await openRouterLLMService.streamSFDRAdvisory(
  context,
  (chunk: string) => {
    console.log('Received chunk:', chunk);
  },
  (response: any) => {
    console.log('Complete response:', response);
  },
  (error: Error) => {
    console.error('Streaming error:', error);
  }
);
```

## 🎯 Key Features

### 1. Intelligent Provider Routing

- **Primary**: DeepSeek (cost-effective, high-quality)
- **Fallback**: Google Vertex → Mistral → OpenAI
- **Optimization**: Throughput-based sorting
- **Cost Control**: Free tier utilization

### 2. Regulatory Specialization

- **Comprehensive AML/CFT**: Anti-Money Laundering/Counter-Terrorism Financing
- **Multi-Jurisdiction**: US, EU, UK regulatory frameworks
- **Entity Types**: Individual, Corporate, Vessel, Aircraft
- **Risk Assessment**: Comprehensive risk level analysis
- **Sanctions Screening**: OFAC, EU, UN, UK sanctions compliance

### 3. Advanced Response Processing

- **Structured Output**: Parsed recommendations and references
- **Confidence Scoring**: Quality assessment of responses
- **Evidence Extraction**: Regulatory citation identification
- **Action Items**: Follow-up task generation

### 4. Performance Optimization

- **Streaming**: Real-time response generation
- **Batch Processing**: Multiple requests handling
- **Caching**: Response optimization
- **Concurrency**: Parallel processing support

## 🧪 Testing

### Test Script

```bash
npm run test:sfdr
```

### Test Scenarios

1. **High-Risk Individual Customer**
   - PEP from high-risk jurisdiction
   - Business account opening
   - Enhanced due diligence requirements

2. **Corporate Entity with Complex Ownership**
   - Multi-layered ownership structure
   - Cross-jurisdictional entities
   - Due diligence approach

3. **Vessel Registration and Screening**
   - International shipping vessel
   - Flag state governance issues
   - Maritime compliance requirements

4. **Low-Risk Individual Account**
   - Local resident with clean background
   - Standard KYC requirements
   - Basic account opening

5. **Aircraft Financing and Compliance**
   - Corporate aircraft purchase
   - International business use
   - Financing compliance considerations

## 📈 Performance Metrics

### Response Quality

- **Confidence Levels**: Low, Medium, High
- **Regulatory Citations**: Specific regulation references
- **Actionable Recommendations**: Clear next steps
- **Risk Assessment**: Comprehensive risk analysis

### Provider Performance

- **DeepSeek**: Primary provider, cost-effective
- **OpenAI**: High-quality fallback
- **Google Vertex**: Alternative option
- **Mistral**: Additional fallback

### Cost Optimization

- **Free Tier Utilization**: Maximize DeepSeek usage
- **Fallback Strategy**: Premium providers only when needed
- **Token Efficiency**: Optimized prompt engineering
- **Response Quality**: Maintain high standards

## 🔒 Security & Compliance

### Data Protection

- **Data Collection**: Disabled for compliance
- **API Security**: Secure credential handling
- **Audit Trail**: Complete request/response logging
- **Privacy**: No PII storage in logs

### Regulatory Compliance

- **AML/CFT Alignment**: Anti-Money Laundering/Counter-Terrorism Financing
- **Multi-Jurisdiction**: US, EU, UK compliance
- **Risk Management**: Comprehensive risk assessment
- **Sanctions Compliance**: OFAC, EU, UN, UK sanctions screening
- **Documentation**: Complete audit trail

## 🚀 Deployment

### Environment Setup

1. **Configure OpenRouter API Key**:
   ```bash
   export OPENROUTER_API_KEY=your_api_key_here
   ```

2. **Set Application URL**:
   ```bash
   export APP_URL=https://your-domain.com
   ```

3. **Initialize Services**:
   ```typescript
   await openRouterLLMService.initialize();
   ```

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sfdr-navigator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sfdr-navigator
  template:
    metadata:
      labels:
        app: sfdr-navigator
    spec:
      containers:
      - name: sfdr-navigator
        image: sfdr-navigator:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENROUTER_API_KEY
          valueFrom:
            secretKeyRef:
              name: openrouter-secret
              key: api-key
```

## 📚 Documentation

### API Documentation

- **Interactive Docs**: Available at `/api/docs`
- **OpenAPI Spec**: Complete endpoint documentation
- **Examples**: Request/response samples
- **Error Codes**: Comprehensive error handling

### Integration Guides

- **Quick Start**: Basic integration steps
- **Advanced Usage**: Complex scenarios
- **Best Practices**: Optimization recommendations
- **Troubleshooting**: Common issues and solutions

## 🔮 Future Enhancements

### Planned Features

1. **Multi-Language Support**: International regulatory frameworks
2. **Custom Presets**: Organization-specific configurations
3. **Advanced Analytics**: Usage patterns and optimization
4. **Integration APIs**: Third-party system connections
5. **Real-time Updates**: Live regulatory change notifications

### Performance Improvements

1. **Response Caching**: Intelligent caching strategies
2. **Model Optimization**: Fine-tuned regulatory models
3. **Batch Processing**: Enhanced parallel processing
4. **Streaming Optimization**: Improved real-time responses

## 📞 Support

### Technical Support

- **Documentation**: Comprehensive guides and examples
- **API Reference**: Complete endpoint documentation
- **Test Scripts**: Validation and testing tools
- **Health Checks**: Service monitoring endpoints

### Compliance Support

- **Regulatory Updates**: Framework change notifications
- **Best Practices**: Compliance optimization guidance
- **Audit Support**: Documentation and reporting tools
- **Training**: Regulatory compliance education

---

**Integration Status**: ✅ **COMPLETE** - AML/CFT Advisory Agent with OpenRouter preset integration successfully implemented and ready for production use.

**Key Benefits**:
- ✅ **Cost-Optimized**: Free tier utilization with premium fallbacks
- ✅ **High-Quality**: Specialized regulatory compliance responses
- ✅ **Scalable**: Streaming and batch processing capabilities
- ✅ **Compliant**: Privacy-focused with complete audit trails
- ✅ **Flexible**: Multi-jurisdiction and entity type support
