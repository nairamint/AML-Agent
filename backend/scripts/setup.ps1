# AML/KYC Advisory Backend Setup Script for Windows
# This script sets up the development environment

Write-Host "🚀 Setting up AML/KYC Advisory Backend..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 20+ and try again." -ForegroundColor Red
    exit 1
}

# Check Node.js version
$nodeVersionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($nodeVersionNumber -lt 20) {
    Write-Host "❌ Node.js version 20+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Create environment file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating environment file..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "⚠️  Please update .env file with your configuration" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Start infrastructure services
Write-Host "🐳 Starting infrastructure services..." -ForegroundColor Yellow
docker-compose up -d postgres redis qdrant zookeeper kafka ollama

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if services are running
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

# Check PostgreSQL
try {
    docker-compose exec -T postgres pg_isready -U postgres | Out-Null
    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL is not ready" -ForegroundColor Red
    exit 1
}

# Check Redis
try {
    docker-compose exec -T redis redis-cli ping | Out-Null
    Write-Host "✅ Redis is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Redis is not ready" -ForegroundColor Red
    exit 1
}

# Check Qdrant
try {
    Invoke-RestMethod -Uri "http://localhost:6333/health" -Method Get | Out-Null
    Write-Host "✅ Qdrant is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Qdrant is not ready" -ForegroundColor Red
    exit 1
}

# Check Kafka
try {
    docker-compose exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list | Out-Null
    Write-Host "✅ Kafka is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Kafka is not ready" -ForegroundColor Red
    exit 1
}

# Check Ollama
try {
    Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get | Out-Null
    Write-Host "✅ Ollama is ready" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not ready" -ForegroundColor Red
    exit 1
}

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npm run db:seed

# Pull Ollama model
Write-Host "🤖 Pulling Ollama model..." -ForegroundColor Yellow
docker-compose exec -T ollama ollama pull llama2:7b

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 AML/KYC Advisory Backend is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env file with your configuration"
Write-Host "2. Run 'npm run dev' to start the development server"
Write-Host "3. Visit http://localhost:3000/api/docs for API documentation"
Write-Host "4. Visit http://localhost:3000/api/health for health check"
Write-Host ""
Write-Host "🔧 Available commands:" -ForegroundColor Cyan
Write-Host "  npm run dev          - Start development server"
Write-Host "  npm run build        - Build for production"
Write-Host "  npm run test         - Run tests"
Write-Host "  npm run db:migrate   - Run database migrations"
Write-Host "  npm run db:seed      - Seed database"
Write-Host "  npm run db:studio    - Open Prisma Studio"
Write-Host ""
Write-Host "🐳 Docker services:" -ForegroundColor Cyan
Write-Host "  docker-compose up -d - Start all services"
Write-Host "  docker-compose down  - Stop all services"
Write-Host "  docker-compose logs  - View logs"
Write-Host ""
Write-Host "📊 Monitoring:" -ForegroundColor Cyan
Write-Host "  Prometheus: http://localhost:9090"
Write-Host "  Grafana: http://localhost:3001 (admin/admin)"
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green

