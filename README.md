# 🛡️ AML-KYC Advisory Agent

Enterprise-grade AI compliance platform delivering Big 4 advisory expertise at scale — an open-source, multi-agent LLM system for real-time regulatory guidance across multiple jurisdiction.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://choosealicense.com/licenses/mit/)
[![Security](https://img.shields.io/badge/security-enterprise%20ready-green.svg)](#security)
[![Contributors Welcome](https://img.shields.io/badge/contributors-welcome-brightgreen.svg)](#contributing)

TL;DR
- Provide explainable, auditable AML/CFT advisory intelligence to augment compliance teams.
- Multi-agent architecture with Human-in-the-Loop (HITL) for risk-controlled decisioning.
- Designed for enterprise deployment: zero-trust security, observability, and data governance.

Why this project exists
- Global AML fines exceed $181B and an estimated 95% of financial crime remains undetected with legacy tools.
- AML-KYC Advisory Agent reduces risk by combining LLM-driven analysis with human oversight and enterprise security.
- We aim to scale institutional regulatory knowledge while preserving explainability and auditability.

Core principles
- Human-in-the-Loop (HITL): AI augments, not replaces, qualified compliance professionals.
- Explainability & Auditability: Every advisory step should be traceable and defensible in regulatory reviews.
- Zero-Trust & Data Governance: Least privilege, strong identity, data encryption, and separation of duties.
- Open core, enterprise features: Community-first core; optional commercial modules for integrations and advanced security.

Highlights / Key Capabilities
- Multi-agent orchestration for data ingestion, triage, analysis, and advisory drafting
- RAG (Retrieval-Augmented Generation) for up-to-date regulatory context
- Policy and rule layer for deterministic controls and alerts
- HITL workflow: suggestion → human review → feedback loop to models
- Audit trail: immutable logs for decisions, sources, and reviewer actions
- Observability: metrics, traces, and logs for compliance and operational monitoring

Architecture (high level)
- Agents: ingestion, NLP/LLM advisor, policy engine, HITL coordinator
- Data layer: PostgreSQL (authoritative), Vector DB (semantic search), Redis (caching)
- Security: SPIFFE/SPIRE identity, Istio service mesh (mTLS, policy), secrets backend
- Observability: Prometheus, Grafana, ELK
- Deployment: Kubernetes + Helm charts, containerized services

Architecture Diagram (v2)
![Architecture Diagram v2](docs/architecture-v2.png)

Quickstart (developer)
Prerequisites:
- Git, Docker, kubectl, Helm, and access to a Kubernetes cluster (kind/minikube for local testing)
- A vector DB (e.g., Milvus/Weaviate) and PostgreSQL instance (we provide charts)

Example local flow (high-level)
1. git clone https://github.com/nairamint/AML-Agent.git
2. cp .env.example .env && edit credentials / endpoints
3. make bootstrap     # boots local dev dependencies (Postgres, vector DB) via Docker Compose / kind
4. make deploy-dev    # deploys services to local cluster via Helm
5. make test          # run unit and integration tests

Note: The repository contains a /docs folder with detailed setup instructions, Helm charts, and sample datasets. If an entry is missing for your environment, open an issue and we’ll add an environment-specific guide.

Configuration & secrets
- Use the provided .env.example as a starting point.
- Secrets should be stored in a secrets manager (HashiCorp Vault, AWS Secrets Manager, or Kubernetes Secrets sealed with sops).
- Follow Zero Trust principles: short-lived credentials, SPIFFE identities, and network-level mTLS.

Security & privacy
- Designed with defense-in-depth: service identity, mutual TLS, RBAC, encrypted-at-rest data stores.
- Sensitive data should be tokenized and access limited to approved roles; do not index raw PII into vector DBs without a compliant masking pipeline.
- We recommend adding a SECURITY.md and a documented Threat Model for enterprise deployments (see /docs/security.md).

Human-in-the-Loop (HITL)
- HITL is central: models produce candidate findings, human reviewers verify and sign off.
- Feedback from reviewers flows into a supervised retraining and policy refinement pipeline (audit logs and datasets preserved for compliance).
- HITL supports role-based approvals and multi-step escalation workflows.

Contributing
We welcome collaborators — see CONTRIBUTING.md for guidelines. Typical ways to contribute:
- Issues: bug reports, feature requests, and operational gaps
- PRs: code, docs, Helm charts, tests
- Domain expertise: regulation mappings, test cases, and advisory templates
- Security reviews and threat modelling

Roadmap (short)
- Phase 1 (Near Completion): Core chat interface + LLM integration
- Phase 2 (In Progress): Enterprise security, identity, and compliance controls
- Phase 3 (Q4 2025): Production deployment guidance and commercial partnerships
- Phase 4 (Q1 2026): Advanced multi-agent automation and regulatory automation features

Operational considerations
- Model governance: maintain model metadata, provenance, and validation suites
- Monitoring: SLOs for advisory latency, correctness checks for model outputs
- Testing: synthetic scenarios, historical case replay, and red-team adversarial tests

Glossary of Terms
- ACL: Access Control List — a list defining permissions to resources.
- HITL: Human-in-the-Loop — workflow where humans validate or supervise automated outputs.
- LLM: Large Language Model — transformer-based language models used for text generation and understanding.
- RAG: Retrieval-Augmented Generation — combining semantic retrieval with generation for up-to-date outputs.
- SPIFFE/SPIRE: Standards and runtime for workload identity and issuing cryptographic identities.
- mTLS: mutual TLS — TLS where both client and server authenticate each other.
- Vector DB: Vector database — stores vector embeddings for semantic search.
- RBAC: Role-Based Access Control — authorization method assigning permissions to roles.
- SLO: Service Level Objective — an objective target for service availability or performance.
- PII: Personally Identifiable Information — data that can identify an individual.

Legal & licensing
- Core: MIT License. See LICENSE for details.
- Dual-licensing and commercial modules may be available for enterprise features — contact us to discuss terms.

Where to get help
- Issues: raise bugs or feature requests in the Issues tab
- Discussions: product and roadmapping conversations
- Security: open a private security report or see SECURITY.md (recommended)
- Partnerships: open an issue titled "Partnership: ..."

Acknowledgements
Built with inspiration from enterprise security best practices, regulated-industry advisory practices, and open-source LLM tooling.

Get involved
- Star the repo to follow progress
- Join as a contributor — check CONTRIBUTING.md
