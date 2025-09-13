# AML/KYC Advisory Backend - Integration Guide

## 🎯 **PHASE 2 COMPLETED - ENTERPRISE-GRADE BACKEND INTEGRATION**

### **✅ IMPLEMENTATION STATUS**

**Phase 2: Backend Integration** - **COMPLETED** ✅
- ✅ Multi-Agent LLM Framework with Regulatory Knowledge Base
- ✅ Enterprise-Grade Microservices Architecture
- ✅ Real-Time Data Pipelines with Kafka
- ✅ Sanctions Screening with Moov Watchman Integration
- ✅ Comprehensive Audit & Compliance Controls
- ✅ Production-Ready Security & Authentication
- ✅ Kubernetes Deployment Infrastructure
- ✅ Monitoring & Observability Stack

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Technology Stack**
- **Backend**: Node.js 20+ with TypeScript, Fastify
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Vector DB**: Qdrant for regulatory knowledge embeddings
- **Cache**: Redis 7+ for session management
- **Message Queue**: Apache Kafka for event streaming
- **LLM**: Ollama with LLaMA 2/3 models
- **Container**: Docker + Kubernetes
- **Monitoring**: Prometheus + Grafana

### **Open Source Integrations**
- **Multi-Agent RAG**: LangChain-based agent orchestration
- **OpenAML**: ML models for risk scoring and anomaly detection
- **Marble & Jube**: Real-time transaction processing
- **Moov Watchman**: Sanctions screening and OFAC integration
- **Comp AI**: Policy automation workflows

---

## 🚀 **QUICK START**

### **Prerequisites**
- Node.js 20+
- Docker & Docker Compose
- Kubernetes cluster (for production)

### **Development Setup**
```bash
# Clone and navigate to backend
cd backend

# Run setup script
# Windows:
.\scripts\setup.ps1

# Linux/Mac:
./scripts/setup.sh

# Start development server
npm run dev
```

### **Production Deployment**
```bash
# Build Docker image
docker build -t aml-kyc-backend .

# Deploy to Kubernetes
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n aml-kyc-advisory
```

---

## 🔧 **API INTEGRATION**

### **Base URL**
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.aml-kyc-advisory.com`

### **Authentication**
```typescript
// Set auth token
const token = 'your-jwt-token';
localStorage.setItem('auth_token', token);

// API calls automatically include token
const response = await fetch('/api/chat/advisory', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: 'Your AML question' })
});
```

### **Key Endpoints**

#### **Chat & Advisory**
```typescript
// Generate advisory
POST /api/chat/advisory
{
  "query": "What are the CDD requirements for high-risk customers?",
  "context": {
    "jurisdiction": "US",
    "role": "compliance_officer",
    "organization": "financial_institution"
  }
}

// Stream advisory response
POST /api/chat/advisory/stream
// Returns Server-Sent Events with streaming response

// Submit feedback
POST /api/chat/feedback
{
  "briefId": "brief-123",
  "type": "advisory_quality",
  "rating": 5,
  "comment": "Excellent analysis"
}
```

#### **Admin & Management**
```typescript
// Get dashboard statistics
GET /api/admin/dashboard

// User management
GET /api/admin/users
PUT /api/admin/users/:userId

// Audit logs
GET /api/admin/audit-logs

// System health
GET /api/admin/system-health
```

#### **Health & Monitoring**
```typescript
// Basic health check
GET /api/health

// Detailed health check
GET /api/health/detailed

// Readiness check
GET /api/health/ready

// Liveness check
GET /api/health/live
```

---

## 🔐 **SECURITY & COMPLIANCE**

### **Authentication & Authorization**
- **JWT-based authentication** with configurable expiration
- **Role-based access control** (RBAC) with granular permissions
- **Organization and jurisdiction-based access** controls
- **Rate limiting** with Redis-backed storage

### **Data Protection**
- **AES-256 encryption** at rest and in transit
- **TLS 1.3** for all communications
- **PII/PHI handling** with proper data classification
- **GDPR compliance** with right to erasure and data portability

### **Audit & Compliance**
- **Immutable audit logs** with tamper detection
- **Comprehensive audit trail** for all user actions
- **Regulatory compliance** controls (SOX, PCI-DSS)
- **Data retention policies** with automatic cleanup

---

## 📊 **MONITORING & OBSERVABILITY**

### **Metrics & Logging**
- **Structured logging** with Pino
- **Prometheus metrics** for system monitoring
- **Grafana dashboards** for visualization
- **Distributed tracing** with Jaeger

### **Health Checks**
- **Liveness probes** for container health
- **Readiness probes** for service availability
- **Database connectivity** monitoring
- **External service** health checks

### **Alerting**
- **Critical error** notifications
- **Performance degradation** alerts
- **Security event** monitoring
- **Compliance violation** alerts

---

## 🗄️ **DATA MANAGEMENT**

### **Database Schema**
- **PostgreSQL** with ACID compliance
- **Prisma ORM** for type-safe database access
- **Database migrations** with version control
- **Connection pooling** for performance

### **Vector Database**
- **Qdrant** for regulatory knowledge embeddings
- **Semantic search** capabilities
- **Hybrid search** (semantic + keyword + temporal)
- **Automatic indexing** of regulatory documents

### **Caching Strategy**
- **Redis** for session management
- **Rate limiting** storage
- **Real-time data** caching
- **Cache invalidation** strategies

---

## 🔄 **DATA PIPELINES**

### **Event Streaming**
- **Apache Kafka** for event-driven architecture
- **Real-time processing** of transactions
- **Event sourcing** for audit trails
- **Dead letter queues** for error handling

### **Data Ingestion**
- **Transaction data** processing
- **Customer data** management
- **Compliance checks** automation
- **Sanctions updates** processing

### **Risk Assessment**
- **ML-based risk scoring** with OpenAML
- **Real-time anomaly detection**
- **Behavioral pattern analysis**
- **Risk factor aggregation**

---

## 🚨 **SANCTIONS SCREENING**

### **Integration with Moov Watchman**
- **Real-time OFAC screening**
- **Global sanctions list** integration
- **Fuzzy matching** algorithms
- **Risk-based alerting**

### **Screening Capabilities**
- **Individual and corporate** entity screening
- **Vessel and aircraft** screening
- **Multi-jurisdictional** compliance
- **Automated watchlist** updates

### **Match Resolution**
- **Confidence scoring** for matches
- **Manual review** workflows
- **False positive** reduction
- **Audit trail** for all decisions

---

## 🤖 **AI & LLM INTEGRATION**

### **Multi-Agent Framework**
- **Regulatory interpretation** agent
- **Risk assessment** agent
- **Advisory synthesis** agent
- **Confidence scoring** agent

### **Knowledge Base**
- **Regulatory document** indexing
- **Enforcement action** tracking
- **Case law** integration
- **Jurisdictional variations**

### **Model Management**
- **Ollama** for local LLM deployment
- **Model versioning** with DVC
- **Fine-tuning** capabilities
- **Performance monitoring**

---

## 🚀 **DEPLOYMENT**

### **Development Environment**
```bash
# Start all services
docker-compose up -d

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start development server
npm run dev
```

### **Production Deployment**
```bash
# Build and push image
docker build -t aml-kyc-backend:latest .
docker push aml-kyc-backend:latest

# Deploy to Kubernetes
kubectl apply -f k8s/

# Monitor deployment
kubectl get pods -n aml-kyc-advisory
kubectl logs -f deployment/aml-kyc-backend
```

### **Scaling**
- **Horizontal Pod Autoscaler** (HPA) for automatic scaling
- **Resource quotas** and limits
- **Load balancing** with NGINX Ingress
- **Multi-region** deployment support

---

## 📈 **PERFORMANCE**

### **Target Metrics**
- **API Response Time**: <100ms for standard operations
- **LLM Response Time**: <3s for advisory generation
- **Throughput**: 10,000+ concurrent users
- **Availability**: 99.99% uptime

### **Optimization**
- **Connection pooling** for databases
- **Caching strategies** for frequently accessed data
- **Async processing** for heavy operations
- **Resource optimization** for containers

---

## 🔧 **CONFIGURATION**

### **Environment Variables**
```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://host:6379

# Vector DB
QDRANT_URL=http://host:6333

# Kafka
KAFKA_BROKERS=host1:9092,host2:9092

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# LLM
OLLAMA_BASE_URL=http://host:11434
LLM_MODEL=llama2:7b
```

### **Feature Flags**
- **Enable/disable** specific features
- **A/B testing** capabilities
- **Gradual rollout** support
- **Emergency switches** for critical features

---

## 🧪 **TESTING**

### **Test Suite**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- --grep "advisory"
```

### **Test Types**
- **Unit tests** for individual functions
- **Integration tests** for API endpoints
- **E2E tests** for complete workflows
- **Performance tests** for load testing

---

## 📚 **DOCUMENTATION**

### **API Documentation**
- **Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI 3.0** specification
- **Interactive examples**
- **Authentication guides**

### **Code Documentation**
- **TypeScript** with comprehensive types
- **JSDoc** comments for functions
- **Architecture diagrams**
- **Deployment guides**

---

## 🆘 **TROUBLESHOOTING**

### **Common Issues**

#### **Database Connection**
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U postgres

# View database logs
docker-compose logs postgres
```

#### **Redis Connection**
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis
```

#### **Kafka Issues**
```bash
# Check Kafka status
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# View Kafka logs
docker-compose logs kafka
```

#### **LLM Service**
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# View Ollama logs
docker-compose logs ollama
```

### **Log Analysis**
```bash
# View application logs
kubectl logs -f deployment/aml-kyc-backend -n aml-kyc-advisory

# Filter logs by level
kubectl logs deployment/aml-kyc-backend -n aml-kyc-advisory | grep ERROR

# View logs from specific pod
kubectl logs pod-name -n aml-kyc-advisory
```

---

## 🔄 **MAINTENANCE**

### **Regular Tasks**
- **Database backups** (daily)
- **Log rotation** (weekly)
- **Security updates** (monthly)
- **Performance monitoring** (continuous)

### **Monitoring**
- **Health checks** every 30 seconds
- **Performance metrics** collection
- **Error rate** monitoring
- **Resource usage** tracking

---

## 📞 **SUPPORT**

### **Getting Help**
- **Documentation**: Check this guide first
- **Logs**: Review application and system logs
- **Health Checks**: Use `/api/health/detailed` endpoint
- **Monitoring**: Check Grafana dashboards

### **Emergency Procedures**
- **Service Restart**: `kubectl rollout restart deployment/aml-kyc-backend`
- **Scale Down**: `kubectl scale deployment aml-kyc-backend --replicas=0`
- **Database Recovery**: Follow backup restoration procedures
- **Security Incident**: Follow incident response plan

---

## 🎉 **CONCLUSION**

**Phase 2 Backend Integration is now COMPLETE** with enterprise-grade architecture, comprehensive security, and production-ready deployment infrastructure. The system is ready for:

- ✅ **Real-time advisory generation** with multi-agent LLM framework
- ✅ **Comprehensive data processing** with event-driven pipelines
- ✅ **Advanced sanctions screening** with Moov Watchman integration
- ✅ **Enterprise security** with audit trails and compliance controls
- ✅ **Scalable deployment** with Kubernetes and monitoring

**Next Steps**: Proceed to Phase 3 (AI & Advisory Core) for advanced LLM fine-tuning and specialized advisory capabilities.

---

*Built with ❤️ by the AML/KYC Advisory Team*

