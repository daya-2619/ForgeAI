# 🛠️ ForgeAI: The Venture Operating System (VOS) for AI-Native Startups

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiolo.org)
[![Expo React Native](https://img.shields.io/badge/Mobile-Expo%20React%20Native-000000?logo=expo&logoColor=white)](https://expo.dev)
[![LangGraph](https://img.shields.io/badge/Orchestration-LangGraph-FF6F00?logo=chainlink&logoColor=white)](https://github.com/langchain-ai/langgraph)

ForgeAI is a mobile-first, production-grade **Venture Operating System (VOS)** designed specifically for the next generation of AI-native startups. By integrating deep semantic retrieval (RAG), autonomous multi-agent software engineering workforces, and collaborative agent negotiation structures, ForgeAI enables founders to transition from a single conceptual sentence to an investor-demo-ready, architecturally-sound business plan, dynamic mock screens, database schemas, and codebase blueprints in minutes.

Beyond static generation, ForgeAI coordinates a full virtual workforce (Product Managers, Architects, Backend Developers, Frontend Developers, QA, DevOps, Marketing, and Finance) to plan and simulate execution cycles, complete with cost tracking, hallucination verification layers, and live status streaming via WebSockets.

---

## 🌟 Key Features

*   **Idea Validation & Venture Generator**: Instantly transform unstructured ideas into structured plans featuring SWOT analyses, target personas, TAM/SAM/SOM calculations, and playbook references.
*   **Multi-Agent Board Room Debate**: Watch distinct AI agents (CEO, CTO, Finance, Marketing) debate strategic directions in real-time, yielding synthesized consensus reports with pros/cons and risk factors.
*   **Cost Tracking & Token Budgeting**: Real-time monitoring of USD cost per agent/model (Gemini, Claude, GPT-4o) with configurable hard stops to avoid budget overruns.
*   **Fact-Checking & Validation Engine**: Autonomous verification layer that computes confidence scores and isolates suspicious outputs (< 0.7 confidence) for human intervention.
*   **Real-time Synchronization & WebSockets**: Progress updates streamed from background LangGraph runs directly to the mobile UI.
*   **Offline First**: Zustand state persisting to React Native AsyncStorage with support for background sync queues.

---

## 🏗️ System Architecture

ForgeAI is built on a highly modular and distributed C4 container model, leveraging asynchronous queues for long-running LLM workflows.

```mermaid
graph TD
    Client[Mobile Client: Expo React Native] -- HTTPS REST / JWT --> Gateway[FastAPI API Gateway]
    Client -- WebSockets --> Gateway
    
    Gateway -- Read/Write --> DB[(PostgreSQL Database)]
    Gateway -- Push Tasks --> Broker[Redis Message Broker]
    
    subgraph Background Processing Layer
        Worker[Celery Task Worker]
        LangGraphEngine[LangGraph Orchestration Engine]
        Worker -- Invokes --> LangGraphEngine
    end
    
    Broker -- Dequeue Tasks --> Worker
    
    subgraph Vector & Knowledge Retrieval
        Qdrant[(Qdrant Vector DB)]
        KB[YC Playbooks / Startup Guides]
    end
    
    LangGraphEngine -- Semantic Search --> Qdrant
    Qdrant -- Context Injection --> LangGraphEngine
    
    subgraph External AI Services
        OpenAI[OpenAI API]
        Claude[Anthropic Claude API]
        Gemini[Google Gemini API]
    end
    
    LangGraphEngine -- Model Routing & Fallback --> OpenAI
    LangGraphEngine -- Model Routing & Fallback --> Claude
    LangGraphEngine -- Model Routing & Fallback --> Gemini
```

### LangGraph Agent Workflow

```mermaid
graph TD
    Start([User Venture Prompt]) --> RAG[RAG Retrospective Context Search]
    RAG --> PM[Product Manager Agent: Generate PRD & Stories]
    PM --> Arch[Software Architect Agent: System Design & DB Schema]
    
    Arch --> ParallelGen{Split Code Development}
    
    subgraph Code Generation & Quality Control
        ParallelGen --> BE[Backend Engineer Agent: Generate API & Data Models]
        ParallelGen --> FE[Frontend Engineer Agent: Design Mobile Screens & Tokens]
        BE --> QA[QA Agent: Audits Code & Database Constraints]
        FE --> QA
    end
    
    QA --> Verification{Hallucination Detection Layer}
    
    Verification -- Confidence Score < 0.7 --> Incident[Incident Triggered: Recalibrate State]
    Incident --> RAG
    
    Verification -- Confidence Score >= 0.7 --> Devops[DevOps Agent: Build Docker & CI/CD]
    Devops --> Finance[Finance Agent: Build Unit Economics & Budgets]
    Finance --> Marketing[Marketing Agent: Plan GTM & SEO Strategy]
    
    Marketing --> DebateEntrance[AI Board Room Debate Queue]
    
    subgraph AI Board Room
        DebateEntrance --> CEO_A[CEO Agent]
        DebateEntrance --> CTO_A[CTO Agent]
        DebateEntrance --> Fin_A[Finance Agent]
        CEO_A <--> CTO_A
        CTO_A <--> Fin_A
        Fin_A <--> CEO_A
    end
    
    CEO_A --> HumanApproval{Human-in-the-loop Checkpoint}
    HumanApproval -- Reject --> PM
    HumanApproval -- Approve --> Done([Deployable Production Blueprint])
```

---

## 📂 Project Structure

```
ForgeAI/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # Configuration, security, JWT helpers
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/               # SQLAlchemy models and session initialization
│   │   │   ├── base.py
│   │   │   ├── models.py
│   │   │   └── session.py
│   │   ├── routers/          # API routes (auth, startups, debate, analytics)
│   │   ├── services/         # LangGraph agents and RAG integrations
│   │   ├── workers/          # Celery worker definitions
│   │   └── main.py           # Application entry point
│   ├── tests/                # Pytest suites
│   ├── Dockerfile
│   └── requirements.txt      # Python dependencies
│
├── mobile/                   # React Native Expo Application
│   ├── assets/               # Local fonts & static images
│   ├── src/
│   │   ├── components/       # Custom reusable UI components (Glassmorphism design)
│   │   ├── navigation/       # Navigation routes
│   │   ├── screens/          # Main screens (StartupBuilder, Dashboard, BoardRoom)
│   │   ├── store/            # Zustand state manager (Offline-sync)
│   │   └── theme/            # Theme, styles and glassmorphism definitions
│   ├── App.tsx               # Root application component
│   └── package.json          # Node dependencies & npm scripts
│
└── docs/                     # Detailed architectural design documents
```

---

## ⚙️ Setup & Installation

### Prerequisites

Ensure you have the following installed on your machine:
*   Python 3.11+
*   Node.js 18+ & npm
*   PostgreSQL
*   Redis
*   Qdrant Vector Database

---

### 1. Backend Setup (FastAPI & Celery)

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    # Windows:
    .\venv\Scripts\activate
    # macOS/Linux:
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure environmental variables. You can create a `.env` file based on `app/config.py`:
    ```env
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/forgeai
    REDIS_URL=redis://localhost:6379/0
    CELERY_BROKER_URL=redis://localhost:6379/0
    CELERY_RESULT_BACKEND=redis://localhost:6379/0
    JWT_SECRET_KEY=your-custom-jwt-secret-key
    OPENAI_API_KEY=your-openai-api-key
    GEMINI_API_KEY=your-gemini-api-key
    CLAUDE_API_KEY=your-claude-api-key
    QDRANT_HOST=localhost
    QDRANT_PORT=6333
    ```
5.  Start the FastAPI Server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
6.  Start the Celery worker (in a new terminal):
    ```bash
    celery -A app.workers.celery_app worker --loglevel=info
    ```

---

### 2. Mobile Client Setup (Expo React Native)

1.  Navigate to the `mobile` directory:
    ```bash
    cd mobile
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Expo development server:
    ```bash
    npm run start
    ```
    *   Press `a` to open in the Android emulator.
    *   Press `i` to open in the iOS simulator.
    *   Press `w` to open on web.

---

## 🧪 Testing

To run the backend test suite:
```bash
cd backend
pytest
```

---

## 📈 Roadmap

*   **Sprint 1: Core Foundation & Auth** (Completed)
    *   Database models, JWT OAuth2 auth flow, role-based access control, Expo layout with glassmorphism UI.
*   **Sprint 2: RAG & Multi-Agent Engines** (Completed)
    *   Qdrant vectors setup, LangGraph workflow execution, model fallback layers.
*   **Sprint 3: AI Board Room & WebSockets** (Completed)
    *   Multi-agent debate engine, WebSocket streaming for task logs.
*   **Sprint 4: Verification & Operations** (In Progress)
    *   Budget trackers, incident logs, Prometheus metrics, and Kubernetes deployments.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
