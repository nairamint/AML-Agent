# Production Sanctions Screening Implementation

## Overview

This document describes the production-ready sanctions screening implementation that replaces the previous mock OFAC screening with real integrations to multiple sanctions APIs and Moov Watchman.

## Architecture

### Core Components

1. **ProductionSanctionsScreening** - Main service for comprehensive sanctions screening
2. **SanctionsService** - Updated service with production/mock fallback logic
3. **Sanctions Routes** - REST API endpoints for sanctions operations
4. **Configuration Management** - Environment-based API credentials and endpoints

### Integration Points

- **Moov Watchman** - Primary sanctions screening service
- **OFAC API** - US Treasury sanctions list
- **EU Sanctions** - European Union sanctions list
- **UN Sanctions** - United Nations consolidated sanctions list
- **UK Sanctions** - UK Office of Financial Sanctions Implementation

## Implementation Details

### 1. Production Sanctions Screening Service

**File**: `backend/src/services/productionSanctionsService.ts`

**Key Features**:
- Real-time multi-source sanctions screening
- Comprehensive result consolidation
- Advanced name matching algorithms
- Risk level determination
- Detailed match scoring and confidence levels

**Core Methods**:
```typescript
async comprehensiveScreening(entityData: EntityData): Promise<ScreeningResult>
async screenWithMoovWatchman(entityData: EntityData): Promise<SanctionsMatch[]>
async screenAgainstSource(entityData: EntityData, source: string, config: any): Promise<SanctionsMatch[]>
```

### 2. Updated Sanctions Service

**File**: `backend/src/services/sanctionsService.ts`

**Key Features**:
- Automatic detection of production vs mock mode
- Seamless fallback to mock data if production APIs unavailable
- Backward compatibility with existing interfaces
- Enhanced statistics and monitoring

**Production Mode Detection**:
```typescript
private async checkProductionScreeningAvailability(): Promise<boolean> {
  const hasMoovCredentials = !!(process.env.MOOV_PUBLIC_KEY && process.env.MOOV_PRIVATE_KEY);
  const hasAtLeastOneAPI = !!(process.env.OFAC_API_KEY || process.env.EU_SANCTIONS_API_KEY || ...);
  return hasMoovCredentials || hasAtLeastOneAPI;
}
```

### 3. API Endpoints

**File**: `backend/src/routes/sanctions.ts`

**Available Endpoints**:
- `POST /api/sanctions/check` - Standard sanctions check
- `POST /api/sanctions/comprehensive-screening` - Production comprehensive screening
- `GET /api/sanctions/stats` - Screening statistics
- `GET /api/sanctions/health` - Service health check
- `POST /api/sanctions/batch-screening` - Batch processing for multiple entities

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Moov Watchman Configuration
MOOV_PUBLIC_KEY=your_moov_public_key_here
MOOV_PRIVATE_KEY=your_moov_private_key_here
MOOV_WATCHMAN_ENDPOINT=https://api.moov.io/watchman

# Sanctions APIs
OFAC_API_ENDPOINT=https://api.ofac-api.com/v4/search
OFAC_API_KEY=your_ofac_api_key_here

EU_SANCTIONS_ENDPOINT=https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content
EU_SANCTIONS_API_KEY=your_eu_sanctions_api_key_here

UN_SANCTIONS_ENDPOINT=https://scsanctions.un.org/resources/xml/en/consolidated.xml
UN_SANCTIONS_API_KEY=your_un_sanctions_api_key_here

UK_SANCTIONS_ENDPOINT=https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.json
UK_SANCTIONS_API_KEY=your_uk_sanctions_api_key_here
```

### Dependencies

The following packages have been added to `package.json`:

```json
{
  "dependencies": {
    "axios": "^1.6.2",
    "node-cron": "^3.0.3",
    "xml2js": "^0.6.2",
    "cheerio": "^1.0.0-rc.12"
  },
  "devDependencies": {
    "@types/node-cron": "^3.0.11",
    "@types/xml2js": "^0.4.14"
  }
}
```

## Usage Examples

### 1. Standard Sanctions Check

```typescript
const request = {
  entityName: "John Doe",
  entityType: "INDIVIDUAL",
  jurisdiction: "US",
  dateOfBirth: "1980-01-01",
  nationality: "US"
};

const result = await sanctionsService.checkSanctions(request);
```

### 2. Comprehensive Production Screening

```typescript
const entityData = {
  name: "John Doe",
  address: "123 Main St, New York, NY",
  country: "US",
  dateOfBirth: "1980-01-01",
  nationality: "US",
  entityType: "INDIVIDUAL"
};

const result = await productionSanctionsScreening.comprehensiveScreening(entityData);
```

### 3. Batch Screening

```typescript
const entities = [
  { name: "John Doe", country: "US" },
  { name: "Jane Smith", country: "UK" },
  { name: "ABC Corporation", country: "US" }
];

const result = await productionSanctionsScreening.batchScreening(entities);
```

## API Response Format

### Standard Check Response

```json
{
  "requestId": "check-1703123456789-abc123",
  "entityName": "John Doe",
  "matchesFound": true,
  "matches": [
    {
      "id": "ofac-001",
      "name": "John Doe",
      "type": "INDIVIDUAL",
      "jurisdiction": "US",
      "matchScore": 0.95,
      "matchDetails": [
        {
          "field": "name",
          "value": "John Doe",
          "confidence": 0.95
        }
      ],
      "source": "OFAC",
      "lastUpdated": "2024-01-01T00:00:00.000Z"
    }
  ],
  "riskLevel": "CRITICAL",
  "recommendations": [
    "IMMEDIATE ACTION REQUIRED: Block transaction and escalate to compliance team",
    "Conduct enhanced due diligence review",
    "Consider filing Suspicious Activity Report (SAR)"
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Comprehensive Screening Response

```json
{
  "requestId": "screening-1703123456789-xyz789",
  "entityName": "John Doe",
  "matchesFound": true,
  "matches": [...],
  "riskLevel": "HIGH",
  "recommendations": [...],
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sources": {
    "moov": {
      "status": "success",
      "matches": 1
    },
    "ofac": {
      "status": "success",
      "matches": 1
    },
    "eu": {
      "status": "error",
      "matches": 0,
      "error": "API timeout"
    }
  }
}
```

## Risk Assessment

### Risk Levels

- **LOW**: No matches found or very low confidence matches
- **MEDIUM**: Moderate confidence matches requiring review
- **HIGH**: High confidence matches requiring immediate attention
- **CRITICAL**: Very high confidence matches requiring immediate blocking

### Match Scoring

The system uses advanced name matching algorithms including:
- Levenshtein distance calculation
- Normalized string comparison
- Alias matching
- Entity type correlation
- Jurisdiction validation

## Error Handling

### Graceful Degradation

The system implements comprehensive error handling:

1. **API Failures**: Individual API failures don't stop the entire screening process
2. **Timeout Handling**: Configurable timeouts prevent hanging requests
3. **Fallback Logic**: Automatic fallback to mock data if production APIs unavailable
4. **Retry Logic**: Built-in retry mechanisms for transient failures

### Error Response Format

```json
{
  "error": "API timeout",
  "message": "EU sanctions API did not respond within timeout period",
  "source": "eu",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Monitoring and Logging

### Health Checks

The system provides comprehensive health monitoring:

- Individual API endpoint status
- Service availability checks
- Configuration validation
- Performance metrics

### Audit Trail

All screening activities are logged with:
- Request details
- Response data
- Processing time
- Risk levels
- Source status

## Security Considerations

### API Key Management

- Environment variable storage
- Secure credential handling
- No hardcoded credentials
- Rotation support

### Data Privacy

- No PII storage in logs
- Secure data transmission
- Compliance with data protection regulations
- Audit trail maintenance

## Performance Optimization

### Caching Strategy

- Result caching for repeated queries
- API response caching
- Database query optimization

### Concurrency Control

- Batch processing with concurrency limits
- Rate limiting for API calls
- Resource management

## Compliance Features

### Regulatory Compliance

- Real-time sanctions list updates
- Multi-jurisdiction coverage
- Audit trail maintenance
- Risk assessment documentation

### Reporting

- Comprehensive screening reports
- Risk level distribution
- Source performance metrics
- Compliance statistics

## Testing

### Unit Tests

```bash
npm test -- --testPathPattern=sanctions
```

### Integration Tests

```bash
npm run test:e2e -- --testPathPattern=sanctions
```

### Load Testing

```bash
npm run test:load -- --testPathPattern=sanctions
```

## Deployment

### Docker

```bash
docker build -t aml-kyc-backend .
docker run -p 3000:3000 --env-file .env aml-kyc-backend
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

## Maintenance

### Regular Updates

- Sanctions list synchronization
- API endpoint updates
- Security patches
- Performance optimizations

### Monitoring

- API health monitoring
- Performance metrics
- Error rate tracking
- Compliance reporting

## Support

For technical support or questions about the production sanctions screening implementation, please contact the development team or refer to the API documentation at `/api/docs`.
