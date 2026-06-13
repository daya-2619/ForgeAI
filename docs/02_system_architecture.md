# ForgeAI System Architecture Specifications

---

## 1. High-Level System Architecture (C4 Container Model)

ForgeAI is structured as a collection of decoupled, high-performance services interacting via RESTful APIs, WebSockets, and asynchronous task queues:

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

---

## 2. Mobile Architecture (React Native / Expo)

The mobile client is built using React Native and Expo with TypeScript. It enforces a strict **feature-first directory layout** to optimize scaling.

### Architectural Blueprint:
```
                                +---------------------------+
                                |      React Components     |
                                |  (Screens / Shared UI)    |
                                +-------------+-------------+
                                              |
                                              v
                                +-------------+-------------+
                                |       React Query         |
                                |   (API Server State)      |
                                +-------------+-------------+
                                              |
                                              v
  +-------------------------+   +-------------+-------------+
  |  Zustand Storage State  |---|     Zustand Store Engine  |
  |  (Offline Cache Sync)   |   |   (Local & Session State) |
  +-------------------------+   +---------------------------+
```

### Key Subsystems:
* **State Management**: React Query handles all asynchronous, remote server-state interactions (caching, query invalidation, refetching on reconnect). Zustand handles UI state, active navigation tabs, authentication tokens, and offline caching structures.
* **Offline Capability**: Zustand stores are wrapped with `persist` middleware pointing to `@react-native-async-storage/async-storage`. If requests fail due to network drops, actions are queued, and a offline-status Banner is displayed.
* **WebView Integration**: Custom React Native WebViews with shared authentication tokens embed generated PRDs, API schemas, and interactive dashboards, allowing founders to browse complex generated documentation without bloating the native UI.

---

## 3. Backend Architecture (FastAPI & Celery)

FastAPI acts as the high-speed gateway, handling requests with extremely low latency, while Celery manages long-running multi-agent debates and venture creation tasks.

```
+--------------------------------------------------------------+
|                       FastAPI Gateway                        |
|   +------------------+  +------------------+  +----------+   |
|   | Auth/RBAC Middl. |  | Rate Limiting M. |  | OTel MW. |   |
|   +------------------+  +------------------+  +----------+   |
+------------------------------+-------------------------------+
                               |
                               | Task Dispatch
                               v
                       +---------------+
                       |  Redis Queue  |
                       +-------+-------+
                               |
                               v Task Consumption
+--------------------------------------------------------------+
|                     Celery Worker Pool                       |
|   +------------------------------------------------------+   |
|   | LangGraph Engine (Workforce & Board Room Workflows)  |   |
|   |   - RAG Agent Controller                             |   |
|   |   - Verification & Fact Checking Pipeline            |   |
|   |   - Model-Routing & Budget Controller                |   |
|   +------------------------------------------------------+   |
+------------------------------+-------------------------------+
                               | Database State Synchronization
                               v
                    +--------------------+
                    |   PostgreSQL DB    |
                    +--------------------+
```

---

## 4. Multi-Agent Architecture (LangGraph State Machine)

The Agent Orchestration Engine uses LangGraph to coordinate different specialist agents. The graph utilizes a central state object representing the startup's status, generated files, and pending task lists.

### LangGraph Agent State Flow:
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

### Agent Communication & Shared Memory:
* **State Updates**: Agents communicate by modifying a shared state instance (`VentureState`). Each state transition is logged in the database to allow step-by-step UI replay.
* **Shared Memory**: Short-term execution memory is held within the LangGraph state context. Long-term memory is persisted in PostgreSQL as a vector embedding in Qdrant (using structural keywords of past decisions) so that subsequent developer/architect tasks are informed by decisions made in the Board Room.
