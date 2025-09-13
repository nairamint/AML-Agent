
  # AML-KYC Advisory Agent

  A production-ready AML/KYC advisory system with enterprise-grade LLM integration using OpenRouter and LangChain.

  ## Features

  - **Production LLM Integration**: Real AI models via OpenRouter (GPT-4, Claude, Gemini, etc.)
  - **RAG System**: Retrieval-Augmented Generation with vector database
  - **Multi-Agent Architecture**: Specialized agents for regulatory analysis, risk assessment, and compliance
  - **Real Regulatory Data**: Integration with actual compliance frameworks and regulations
  - **Enterprise Security**: Production-ready security and audit capabilities

  ## Quick Start

  ### 1. Install Dependencies
  ```bash
  npm install
  ```

  ### 2. Configure Environment
  Copy `backend/env.example` to `backend/.env` and add your OpenRouter API key:
  ```env
  OPENROUTER_API_KEY=your_openrouter_api_key_here
  ```

  ### 3. Start Development Server
  ```bash
  npm run dev
  ```

  ## Production LLM Setup

  For detailed setup instructions, see [PRODUCTION_LLM_SETUP.md](./PRODUCTION_LLM_SETUP.md).

  ### Basic Usage
  ```typescript
  import { LLMServiceFactory } from './src/services/llm/LLMServiceFactory';

  const factory = LLMServiceFactory.getInstance();
  const llmService = await factory.createProductionService();

  const response = await llmService.processRegulatoryQuery({
    query: "What are the PEP requirements in Luxembourg?",
    jurisdiction: "Luxembourg",
    complianceFrameworks: ["CSSF", "AMLD6"],
    // ... other context
  });
  ```

  ## Architecture

  - **Frontend**: React + TypeScript with modern UI components
  - **Backend**: Node.js with Fastify and Prisma
  - **LLM**: OpenRouter integration with LangChain
  - **Vector DB**: Pinecone for semantic search
  - **Database**: PostgreSQL with Prisma ORM

  ## Available Models

  - GPT-4 Turbo (OpenAI)
  - Claude 3 Sonnet (Anthropic)
  - Gemini Pro (Google)
  - Llama 2 (Meta)
  - And more via OpenRouter

  ## Examples

  See `src/examples/ProductionLLMExample.ts` for comprehensive usage examples.

  ## Documentation

  - [Production LLM Setup Guide](./PRODUCTION_LLM_SETUP.md)
  - [Backend Setup Guide](./BACKEND_SETUP_GUIDE.md)
  - [Critical Gap Analysis](./CRITICAL_GAP_ANALYSIS_AND_IMPROVEMENTS.md)
  