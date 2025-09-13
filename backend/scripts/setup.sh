#!/bin/bash

# AML/KYC Advisory Backend Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up AML/KYC Advisory Backend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start infrastructure services
echo "🐳 Starting infrastructure services..."
docker-compose up -d postgres redis qdrant zookeeper kafka ollama

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."

# Check PostgreSQL
if ! docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not ready"
    exit 1
fi
echo "✅ PostgreSQL is ready"

# Check Redis
if ! docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not ready"
    exit 1
fi
echo "✅ Redis is ready"

# Check Qdrant
if ! curl -s http://localhost:6333/health > /dev/null 2>&1; then
    echo "❌ Qdrant is not ready"
    exit 1
fi
echo "✅ Qdrant is ready"

# Check Kafka
if ! docker-compose exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list > /dev/null 2>&1; then
    echo "❌ Kafka is not ready"
    exit 1
fi
echo "✅ Kafka is ready"

# Check Ollama
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama is not ready"
    exit 1
fi
echo "✅ Ollama is ready"

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

# Pull Ollama model
echo "🤖 Pulling Ollama model..."
docker-compose exec -T ollama ollama pull llama2:7b

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Setup completed successfully!"
echo ""
echo "🎉 AML/KYC Advisory Backend is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000/api/docs for API documentation"
echo "4. Visit http://localhost:3000/api/health for health check"
echo ""
echo "🔧 Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run test         - Run tests"
echo "  npm run db:migrate   - Run database migrations"
echo "  npm run db:seed      - Seed database"
echo "  npm run db:studio    - Open Prisma Studio"
echo ""
echo "🐳 Docker services:"
echo "  docker-compose up -d - Start all services"
echo "  docker-compose down  - Stop all services"
echo "  docker-compose logs  - View logs"
echo ""
echo "📊 Monitoring:"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "Happy coding! 🚀"

