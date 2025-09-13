# Backend Setup Guide
## Production-Ready AML-KYC Agent Implementation

This guide provides step-by-step instructions for setting up the real backend infrastructure to replace the mock implementations in Phase 3.

---

## 🚨 CRITICAL: Current State Analysis

**The current Phase 3 implementation is NOT production-ready.** It contains:
- ❌ Mock LLM agents with hardcoded responses
- ❌ In-memory storage (no persistence)
- ❌ Mock authentication (security risk)
- ❌ No real database integration
- ❌ No vector search capabilities
- ❌ No audit logging

**This guide fixes these critical gaps.**

---

## 📋 Prerequisites

### Required Software
- **Node.js 20+** with TypeScript
- **PostgreSQL 15+** for audit trails and user data
- **Qdrant** for vector embeddings and semantic search
- **Redis 7+** for caching and session management
- **Ollama** for local LLM deployment (or OpenAI/Anthropic API access)

### Required Accounts
- **Auth0** account for authentication
- **OpenAI API** key (if using OpenAI models)
- **Anthropic API** key (if using Claude models)

---

## 🏗️ Infrastructure Setup

### 1. Database Setup

#### PostgreSQL Installation
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE aml_kyc_agent;
CREATE USER aml_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE aml_kyc_agent TO aml_user;
\q
```

#### Qdrant Vector Database
```bash
# Install Qdrant using Docker
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# Or install locally
curl -L https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-gnu.tar.gz | tar xz
./qdrant
```

#### Redis Cache
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 2. LLM Setup

#### Option A: Ollama (Local)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download LLaMA 2 model
ollama pull llama2:7b

# Start Ollama service
ollama serve
```

#### Option B: OpenAI API
```bash
# Get API key from https://platform.openai.com/api-keys
export OPENAI_API_KEY="your-api-key-here"
```

#### Option C: Anthropic Claude
```bash
# Get API key from https://console.anthropic.com/
export ANTHROPIC_API_KEY="your-api-key-here"
```

### 3. Authentication Setup

#### Auth0 Configuration
1. Create Auth0 account at https://auth0.com
2. Create new application (Single Page Application)
3. Configure allowed callbacks: `http://localhost:5173/callback`
4. Configure allowed logout URLs: `http://localhost:5173`
5. Note down Domain, Client ID, and Client Secret

---

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
# Environment
VITE_ENVIRONMENT=development
VITE_MODE=development

# LLM Configuration
VITE_LLM_PROVIDER=ollama
VITE_LLM_MODEL=llama2:7b
VITE_LLM_TEMPERATURE=0.7
VITE_LLM_MAX_TOKENS=2000
VITE_OLLAMA_BASE_URL=http://localhost:11434

# Database Configuration
VITE_POSTGRES_HOST=localhost
VITE_POSTGRES_PORT=5432
VITE_POSTGRES_DB=aml_kyc_agent
VITE_POSTGRES_USER=aml_user
VITE_POSTGRES_PASSWORD=secure_password
VITE_POSTGRES_MAX_CONNECTIONS=20

VITE_QDRANT_URL=http://localhost:6333
VITE_REDIS_HOST=localhost
VITE_REDIS_PORT=6379
VITE_REDIS_DB=0

# Authentication
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_CLIENT_SECRET=your-client-secret
VITE_AUTH0_AUDIENCE=https://api.aml-kyc-agent.com
VITE_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3

# Feature Flags
VITE_ENABLE_REAL_LLM=true
VITE_ENABLE_VECTOR_SEARCH=true
VITE_ENABLE_AUDIT_LOGGING=true
VITE_ENABLE_REAL_TIME_STREAMING=true
VITE_ENABLE_ADVANCED_ANALYTICS=false
VITE_ENABLE_COMPLIANCE_REPORTING=true
```

### 2. Install Dependencies

```bash
# Install required packages
npm install @langchain/openai @langchain/community
npm install @qdrant/js-client-rest
npm install ioredis
npm install pg
npm install auth0
npm install jsonwebtoken
npm install crypto
```

---

## 🔧 Implementation Steps

### Step 1: Initialize Backend Services

Update your main application to use real backend services:

```typescript
// src/main.tsx
import { BackendIntegrationService } from './services/backend/BackendIntegrationService';
import { BackendConfigService } from './services/config/BackendConfigService';

async function initializeApp() {
  try {
    // Load configuration
    const configService = BackendConfigService.getInstance();
    const config = configService.getConfig();
    
    // Validate configuration
    const validation = configService.validateConfig();
    if (!validation.isValid) {
      console.error('Configuration errors:', validation.errors);
      throw new Error('Invalid configuration');
    }
    
    // Initialize backend services
    const backendService = BackendIntegrationService.getInstance(config);
    await backendService.initialize();
    
    console.log('Backend services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize backend services:', error);
  }
}

// Initialize before rendering
initializeApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

### Step 2: Update Streaming Service

Replace the mock streaming service with real backend integration:

```typescript
// src/services/streamingService.ts
import { BackendIntegrationService } from './backend/BackendIntegrationService';

export class StreamingAdvisoryService {
  private static instance: StreamingAdvisoryService;
  private backendService: BackendIntegrationService;

  private constructor() {
    this.backendService = BackendIntegrationService.getInstance();
  }

  public async streamResponse(
    query: string,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete: (brief: Brief) => void,
    onError: (error: string) => void,
    conversationId?: string,
    context?: any
  ): Promise<void> {
    try {
      // Get current user from auth service
      const user = await this.backendService.validateToken(
        localStorage.getItem('auth_token') || ''
      );
      
      // Stream response using real backend
      await this.backendService.streamAdvisoryResponse(
        query,
        user.id,
        conversationId || 'default-session',
        onChunk,
        onComplete,
        onError,
        context
      );
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Authentication required');
    }
  }
}
```

### Step 3: Update Authentication

Replace mock authentication with real Auth0 integration:

```typescript
// src/components/AuthProvider.tsx
import { RealAuthService } from '../services/auth/RealAuthService';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authService = useRef<RealAuthService>();

  useEffect(() => {
    const initAuth = async () => {
      const configService = BackendConfigService.getInstance();
      const config = configService.getAuthConfig();
      
      authService.current = new RealAuthService(config);
      await authService.current.initialize();
      
      // Check for existing session
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const user = await authService.current.validateToken(token);
          setUser(user);
        } catch (error) {
          localStorage.removeItem('auth_token');
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.current!.authenticateUser(email, password);
    localStorage.setItem('auth_token', result.tokens.accessToken);
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await authService.current!.logout();
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 🧪 Testing the Implementation

### 1. Health Checks

```typescript
// Test all services
const backendService = BackendIntegrationService.getInstance();
const isHealthy = await backendService.healthCheck();
console.log('Backend health:', isHealthy);
```

### 2. Authentication Test

```typescript
// Test authentication
const authResult = await backendService.authenticateUser(
  'test@example.com',
  'password123'
);
console.log('Auth result:', authResult);
```

### 3. Advisory Generation Test

```typescript
// Test advisory generation
const response = await backendService.processAdvisoryQuery(
  'What are the AML requirements for PEPs in Luxembourg?',
  'user123',
  'session123',
  { jurisdiction: 'Luxembourg', role: 'compliance_officer' }
);
console.log('Advisory response:', response);
```

---

## 🚀 Production Deployment

### 1. Docker Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: aml_kyc_agent
      POSTGRES_USER: aml_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

volumes:
  postgres_data:
  qdrant_data:
  redis_data:
  ollama_data:
```

### 2. Kubernetes Deployment

Create Kubernetes manifests for production deployment with:
- Horizontal Pod Autoscaling
- Load balancing
- Health checks
- Resource limits
- Security policies

### 3. Monitoring Setup

Configure monitoring with:
- Prometheus for metrics
- Grafana for dashboards
- ELK stack for logging
- Jaeger for tracing

---

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Enable SSL/TLS encryption
- [ ] Configure firewall rules
- [ ] Set up intrusion detection
- [ ] Enable audit logging
- [ ] Configure backup encryption
- [ ] Set up monitoring alerts
- [ ] Implement rate limiting
- [ ] Enable CORS properly
- [ ] Validate all inputs

---

## 📊 Performance Optimization

### 1. Database Optimization
- Create proper indexes
- Configure connection pooling
- Enable query caching
- Set up read replicas

### 2. Caching Strategy
- Redis for session data
- CDN for static assets
- Application-level caching
- Database query caching

### 3. Load Balancing
- Multiple application instances
- Database connection pooling
- Horizontal scaling
- Auto-scaling policies

---

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Check firewall settings

2. **LLM Service Unavailable**
   - Verify Ollama is running
   - Check API keys for cloud providers
   - Test model availability

3. **Authentication Errors**
   - Verify Auth0 configuration
   - Check JWT secret
   - Validate callback URLs

4. **Vector Search Not Working**
   - Check Qdrant is running
   - Verify collection exists
   - Test embedding generation

### Debug Commands

```bash
# Check service status
systemctl status postgresql
systemctl status redis-server
docker ps | grep qdrant
ollama list

# Test connections
psql -h localhost -U aml_user -d aml_kyc_agent
redis-cli ping
curl http://localhost:6333/collections
curl http://localhost:11434/api/tags
```

---

## 📈 Success Metrics

After implementation, you should achieve:

- **Response Time:** < 3 seconds for LLM queries
- **Availability:** 99.9% uptime
- **Throughput:** 1000+ concurrent users
- **Accuracy:** > 90% regulatory query accuracy
- **Security:** 100% of requests authenticated
- **Compliance:** 100% audit coverage

---

## 🎯 Next Steps

1. **Complete Backend Integration** (Week 1-2)
2. **Security Hardening** (Week 3)
3. **Performance Optimization** (Week 4)
4. **Production Deployment** (Week 5-6)
5. **Monitoring & Alerting** (Week 7)
6. **Client Pilot** (Week 8)

---

**⚠️ CRITICAL WARNING:** Do not proceed to production or client demonstrations until all backend services are properly implemented and tested. The current mock implementation violates regulatory compliance requirements and poses significant security risks.
