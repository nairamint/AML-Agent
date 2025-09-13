# Regulatory Data Ingestion System

## Overview

The Regulatory Data Ingestion System is a comprehensive, multi-jurisdiction data pipeline that automatically collects, processes, and updates regulatory information from official sources worldwide. This system uses an **API-first approach** to ensure reliable, structured data access while minimizing maintenance overhead and improving data quality.

## Features

### 🌍 Multi-Jurisdiction Support
- **UK**: FCA AML data, UK Legislation, FCA Handbook
- **EU**: EBA AML guidelines, EUR-Lex directives, 5th AML Directive
- **US**: Treasury SDN List, FinCEN advisories, BSA regulations, Federal Register
- **Additional**: Canada (FINTRAC), Australia (AUSTRAC), Singapore (MAS)

### 🔄 Real-Time Data Ingestion
- **API-First Approach**: Prioritizes official APIs over web scraping
- Automated scheduled ingestion using cron expressions
- Change detection with content hashing
- Incremental updates to minimize processing overhead
- Background processing for non-blocking operations
- **Rate Limiting**: Built-in API rate limiting and retry mechanisms

### 🧠 Intelligent Processing
- **API Response Parsers**: Specialized parsers for structured API responses
- Content normalization and structuring
- Metadata extraction and enrichment
- Vector embedding generation for semantic search
- **Authentication Management**: Secure API key handling and token management

### 📊 Comprehensive Monitoring
- Ingestion statistics and health monitoring
- Source status tracking
- Error handling and retry mechanisms
- Audit trail for all operations

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Sources  │───▶│  Ingestion       │───▶│  Knowledge      │
│                 │    │  Service         │    │  Base           │
│ • FCA (UK)      │    │                  │    │                 │
│ • EBA (EU)      │    │ • Scraping       │    │ • Vector Store  │
│ • FinCEN (US)   │    │ • Parsing        │    │ • Database      │
│ • Treasury (US) │    │ • Change Detect  │    │ • Search Index  │
│ • FINTRAC (CA)  │    │ • Model Retrain  │    │                 │
│ • AUSTRAC (AU)  │    │                  │    │                 │
│ • MAS (SG)      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Data Sources

### UK Sources - API-Based
1. **FCA AML Data Return** (`uk-fca-aml-data`)
   - URL: https://www.fca.org.uk/publication/data/aml-data-return.json
   - Type: API
   - Frequency: Weekly (Monday 6 AM UTC)
   - Parser: `fca-aml-parser`
   - Authentication: API Key

2. **UK Legislation** (`uk-legislation-gov`)
   - URL: https://www.legislation.gov.uk/uksi/2017/692/data.json
   - Type: API
   - Frequency: Daily (8 AM UTC)
   - Parser: `legislation-gov-parser`
   - Authentication: None

3. **FCA RegData Platform** (`uk-fca-regdata`)
   - URL: https://regdata.fca.org.uk/api/v1/regulatory-data
   - Type: API
   - Frequency: Mon/Wed/Fri (7 AM UTC)
   - Parser: `fca-regdata-parser`
   - Authentication: API Key

### EU Sources - API-Based
1. **EBA AML Guidelines API** (`eu-eba-aml-api`)
   - URL: https://www.eba.europa.eu/api/v1/guidelines/aml-cft
   - Type: API
   - Frequency: Weekly (Monday 9 AM UTC)
   - Parser: `eba-aml-api-parser`
   - Authentication: None

2. **EUR-Lex API** (`eu-eur-lex-api`)
   - URL: https://eur-lex.europa.eu/api/v1/legal-content/EN/AUTO/
   - Type: API
   - Frequency: Daily (10 AM UTC)
   - Parser: `eur-lex-api-parser`
   - Authentication: None

3. **5th AML Directive API** (`eu-aml-directive-5-api`)
   - URL: https://eur-lex.europa.eu/api/v1/legal-content/EN/TXT/?uri=CELEX:32018L0843
   - Type: API
   - Frequency: Weekly (Monday 11 AM UTC)
   - Parser: `directive-api-parser`
   - Authentication: None

### US Sources - API-Based
1. **Treasury OFAC API** (`us-treasury-ofac-api`)
   - URL: https://api.treasury.gov/v1/sanctions/sdn
   - Type: API
   - Frequency: Daily (12 PM UTC)
   - Parser: `treasury-ofac-api-parser`
   - Authentication: API Key

2. **FinCEN API** (`us-fincen-api`)
   - URL: https://api.fincen.gov/v1/advisories
   - Type: API
   - Frequency: Mon/Wed/Fri (1 PM UTC)
   - Parser: `fincen-api-parser`
   - Authentication: API Key

3. **FinCEN BSA Regulations API** (`us-fincen-bsa-api`)
   - URL: https://api.fincen.gov/v1/regulations/bsa
   - Type: API
   - Frequency: Weekly (Monday 2 PM UTC)
   - Parser: `bsa-regulations-api-parser`
   - Authentication: API Key

4. **Federal Register API** (`us-federal-register-api`)
   - URL: https://www.federalregister.gov/api/v1/documents.json
   - Type: API
   - Frequency: Daily (3 PM UTC)
   - Parser: `federal-register-api-parser`
   - Authentication: API Key

5. **SEC EDGAR API** (`us-sec-edgar-api`)
   - URL: https://data.sec.gov/api/xbrl/companyfacts/
   - Type: API
   - Frequency: Daily (4 PM UTC)
   - Parser: `sec-edgar-api-parser`
   - Authentication: User-Agent Required

### Additional Jurisdictions - API-Based
1. **FINTRAC API (Canada)** (`ca-fintrac-api`)
   - URL: https://api.fintrac-canafe.gc.ca/v1/guidance
   - Type: API
   - Frequency: Weekly (Monday 5 PM UTC)
   - Parser: `fintrac-api-parser`
   - Authentication: API Key

2. **AUSTRAC API (Australia)** (`au-austrac-api`)
   - URL: https://api.austrac.gov.au/v1/guidance
   - Type: API
   - Frequency: Weekly (Monday 6 PM UTC)
   - Parser: `austrac-api-parser`
   - Authentication: API Key

3. **MAS API (Singapore)** (`sg-mas-api`)
   - URL: https://api.mas.gov.sg/v1/regulations/aml
   - Type: API
   - Frequency: Weekly (Monday 7 PM UTC)
   - Parser: `mas-aml-api-parser`
   - Authentication: API Key

### Third-Party API Providers
1. **ComplyAdvantage API** (`complyadvantage-api`)
   - URL: https://api.complyadvantage.com/v1/sanctions
   - Type: API
   - Frequency: Every 4 hours
   - Parser: `complyadvantage-api-parser`
   - Authentication: API Key
   - Coverage: Global sanctions and watchlists

2. **LexisNexis API** (`lexisnexis-api`)
   - URL: https://api.lexisnexis.com/v1/kyc
   - Type: API
   - Frequency: Daily (8 PM UTC)
   - Parser: `lexisnexis-api-parser`
   - Authentication: API Key
   - Coverage: Global KYC and compliance data

## API Endpoints

### Ingestion Management
- `GET /api/regulatory/ingestion/stats` - Get ingestion statistics
- `POST /api/regulatory/ingestion/sources/:sourceId/ingest` - Trigger manual ingestion

### Knowledge Search
- `GET /api/regulatory/search` - Search regulatory documents
- `GET /api/regulatory/enforcement/search` - Search enforcement actions
- `GET /api/regulatory/updates` - Get recent regulatory updates
- `GET /api/regulatory/enforcement` - Get enforcement actions

### Document Management
- `GET /api/regulatory/knowledge/stats` - Get knowledge base statistics
- `POST /api/regulatory/documents` - Add new regulatory document
- `PUT /api/regulatory/documents/:id` - Update regulatory document
- `DELETE /api/regulatory/documents/:id` - Delete regulatory document

### System Information
- `GET /api/regulatory/jurisdictions` - Get available jurisdictions
- `GET /api/regulatory/health` - Health check for regulatory services

## Configuration

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aml_kyc"

# Vector Database
QDRANT_URL="http://localhost:6333"
QDRANT_API_KEY="your-api-key"

# Kafka
KAFKA_BROKERS="localhost:9092"
KAFKA_CLIENT_ID="aml-kyc-backend"

# Redis
REDIS_URL="redis://localhost:6379"

# OpenAI (for embeddings)
OPENAI_API_KEY="your-openai-api-key"
```

### Cron Schedule Examples
```javascript
// Daily at 6 AM UTC
'0 6 * * *'

// Every Monday at 9 AM UTC
'0 9 * * 1'

// Monday, Wednesday, Friday at 1 PM UTC
'0 13 * * 1,3,5'

// Every hour
'0 * * * *'
```

## Data Models

### RegulatoryDataSource
```typescript
interface RegulatoryDataSource {
  id: string;
  name: string;
  url: string;
  jurisdiction: string;
  type: 'API' | 'SCRAPE' | 'RSS' | 'JSON';
  parser: string;
  updateFrequency: string; // cron expression
  lastChecked?: Date;
  lastUpdated?: Date;
  isActive: boolean;
  metadata?: any;
}
```

### RegulatoryUpdate
```typescript
interface RegulatoryUpdate {
  id: string;
  sourceId: string;
  title: string;
  content: string;
  jurisdiction: string;
  regulation: string;
  section?: string;
  version: string;
  effectiveDate?: Date;
  lastUpdated: Date;
  changeType: 'NEW' | 'UPDATED' | 'AMENDED' | 'REPEALED';
  metadata?: any;
  hash: string; // For change detection
}
```

## Change Detection

The system uses content hashing to detect changes:

1. **Content Hashing**: SHA-256 hash of document content
2. **Change Types**:
   - `NEW`: Document not previously seen
   - `UPDATED`: Content hash has changed
   - `AMENDED`: Specific amendments detected
   - `REPEALED`: Document has been removed

3. **Processing**:
   - New documents are added to the knowledge base
   - Updated documents replace existing versions
   - Removed documents are marked as repealed
   - Model retraining is triggered for significant changes

## Error Handling

### Retry Mechanisms
- Exponential backoff for failed requests
- Maximum retry attempts: 3
- Circuit breaker pattern for persistent failures

### Monitoring
- Source health status tracking
- Ingestion success/failure rates
- Performance metrics (response times, data volumes)
- Alert system for critical failures

### Logging
- Structured logging with correlation IDs
- Error categorization and severity levels
- Audit trail for compliance requirements

## Performance Optimization

### Caching
- Redis caching for frequently accessed data
- TTL-based cache invalidation
- Cache warming for critical data

### Parallel Processing
- Concurrent ingestion from multiple sources
- Batch processing for large datasets
- Async/await pattern for non-blocking operations

### Resource Management
- Connection pooling for database and external APIs
- Memory-efficient streaming for large files
- Garbage collection optimization

## Security Considerations

### Data Protection
- HTTPS-only communication with external sources
- Data encryption at rest and in transit
- PII detection and masking

### Access Control
- API authentication and authorization
- Role-based access control (RBAC)
- Audit logging for all operations

### Compliance
- GDPR compliance for EU data
- Data retention policies
- Right to be forgotten implementation

## Monitoring and Alerting

### Metrics
- Ingestion success/failure rates
- Data volume and processing times
- Source availability and response times
- Knowledge base growth and quality metrics

### Alerts
- Source unavailability
- Ingestion failures
- Data quality issues
- Performance degradation

### Dashboards
- Real-time ingestion status
- Historical performance trends
- Source health overview
- Knowledge base statistics

## Deployment

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: regulatory-ingestion
spec:
  replicas: 2
  selector:
    matchLabels:
      app: regulatory-ingestion
  template:
    metadata:
      labels:
        app: regulatory-ingestion
    spec:
      containers:
      - name: regulatory-ingestion
        image: aml-kyc-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

## Maintenance

### Database Migrations
```bash
npm run db:migrate
```

### Data Seeding
```bash
npm run db:seed
```

### Health Checks
```bash
curl http://localhost:3000/api/regulatory/health
```

## Troubleshooting

### Common Issues

1. **Source Unavailable**
   - Check network connectivity
   - Verify source URL accessibility
   - Review source-specific error logs

2. **Parsing Failures**
   - Validate parser implementation
   - Check for source format changes
   - Review content structure

3. **Performance Issues**
   - Monitor resource usage
   - Check database performance
   - Review caching effectiveness

### Debug Mode
```bash
DEBUG=regulatory:* npm run dev
```

## Future Enhancements

### Planned Features
- Machine learning-based content classification
- Automated compliance gap analysis
- Real-time regulatory change notifications
- Multi-language support
- Advanced analytics and reporting

### Scalability Improvements
- Horizontal scaling with load balancing
- Microservices architecture
- Event-driven processing
- Cloud-native deployment

## Support

For technical support or questions about the Regulatory Data Ingestion System:

- **Documentation**: See this file and API documentation
- **Issues**: Create GitHub issues for bugs or feature requests
- **Monitoring**: Check health endpoints and logs
- **Contact**: AML/KYC Advisory Team

---

*Last updated: December 2024*
*Version: 1.0.0*
