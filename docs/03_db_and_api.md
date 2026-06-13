# ForgeAI Database Schema and API Specifications

---

## 1. Relational Database Schema (PostgreSQL)

The relational schema tracks users, startups, active agent instances, generated execution steps, system incidents, and token costs.

```mermaid
erDiagram
    USERS ||--o{ STARTUPS : owns
    USERS {
        uuid id PK
        string email UNIQUE
        string password_hash
        string role "Founder | Adviser | Auditor"
        boolean mfa_enabled
        timestamp created_at
    }
    
    STARTUPS ||--o{ AGENTS : contains
    STARTUPS ||--o{ DECISIONS : debates
    STARTUPS ||--o{ INCIDENTS : logs
    STARTUPS {
        uuid id PK
        uuid user_id FK
        string name
        text description
        string status "validating | debating | approved | executing | failed"
        float model_budget_limit
        timestamp created_at
    }
    
    AGENTS ||--o{ TASKS : executes
    AGENTS {
        uuid id PK
        uuid startup_id FK
        string role "PM | Architect | Developer | QA | DevOps | Finance | Marketing"
        string system_prompt
        float model_latency_ms
        timestamp updated_at
    }
    
    TASKS ||--o{ TOKEN_COSTS : consumes
    TASKS {
        uuid id PK
        uuid agent_id FK
        string name
        text description
        string execution_status "pending | running | completed | failed"
        text output_result
        float confidence_score
        timestamp started_at
        timestamp finished_at
    }
    
    TOKEN_COSTS {
        uuid id PK
        uuid task_id FK
        string model_name "gpt-4o | claude-3-5-sonnet | gemini-1.5-pro"
        integer prompt_tokens
        integer completion_tokens
        float exact_cost_usd
        timestamp logged_at
    }

    DECISIONS {
        uuid id PK
        uuid startup_id FK
        string debate_topic
        text debate_transcript
        text consensus_recommendation
        timestamp created_at
    }
    
    INCIDENTS {
        uuid id PK
        uuid startup_id FK
        string type "hallucination_detected | budget_exceeded | build_failure"
        string severity "low | medium | high | critical"
        text details
        string status "open | resolved"
        timestamp raised_at
    }
```

---

## 2. Vector Database Collection (Qdrant)

ForgeAI uses Qdrant for semantic search over startup playbooks and context retrieval for long-term agent memory.

### Collection: `startup_knowledge`
* **Vector Dimension**: `1536` (OpenAI text-embedding-3-small) or `768` (Gemini text-embedding-004).
* **Distance Metric**: `Cosine`.
* **Payload Structure**:
  ```json
  {
    "id": "uuid-string",
    "text": "Actual paragraph or playbook markdown snippet...",
    "metadata": {
      "source": "YC_Playbook_2024.pdf",
      "category": "pricing_strategy | validation | coding_standards",
      "tags": ["unit-economics", "saas", "pricing"]
    }
  }
  ```

### Collection: `agent_long_term_memory`
* **Vector Dimension**: Same as above.
* **Distance Metric**: `Cosine`.
* **Payload Structure**:
  ```json
  {
    "id": "uuid-string",
    "text": "Debate result: CEO and CTO decided to prioritize microservice architecture for billing...",
    "metadata": {
      "startup_id": "uuid-string",
      "agent_role": "CTO",
      "timestamp": "2026-06-13T10:00:00Z"
    }
  }
  ```

---

## 3. OpenAPI Rest API Specification

### Authentication Endpoints
* **`POST /api/v1/auth/register`**
  * Payload: `{"email": "founder@forgeai.co", "password": "securepassword"}`
  * Response: `{"id": "uuid", "email": "founder@forgeai.co", "mfa_uri": "otpauth://..."}`
* **`POST /api/v1/auth/token`**
  * Payload: `{"email": "founder@forgeai.co", "password": "securepassword", "otp_code": "123456"}`
  * Response: `{"access_token": "ey...", "token_type": "bearer"}`

### Startup Generator & Execution Endpoints
* **`POST /api/v1/startups`**
  * Header: `Authorization: Bearer <JWT>`
  * Payload: `{"idea_description": "I want to build an AI platform for hospitals", "budget_limit": 10.0}`
  * Response: `{"id": "uuid", "name": "Hospital AI Platform", "status": "validating", "created_at": "..."}`
* **`GET /api/v1/startups/{id}/dashboard`**
  * Response: Returns aggregated details: active agents, current cost totals, active incident count, and code generation steps completed.
* **`POST /api/v1/startups/{id}/approve`**
  * Moves the startup from a human-approval checkpoint block to active execution block.

### AI Board Room Debate Endpoints
* **`POST /api/v1/startups/{id}/boardroom/debate`**
  * Payload: `{"question": "Should we build feature A or feature B first?"}`
  * Response: `{"debate_session_id": "uuid", "status": "running"}`
* **`GET /api/v1/startups/{id}/boardroom/debates`**
  * Returns list of past board debates, transcripts, pros/cons, and recommended paths.

### Incident Management & Cost Endpoints
* **`GET /api/v1/startups/{id}/incidents`**
  * Response: List of active and resolved system errors (e.g. build failure, cost threshold breached).
* **`GET /api/v1/analytics/costs`**
  * Query parameters: `startup_id`, `model_name`, `agent_role`.
  * Response: Detailed aggregates of prompt/completion token counts and accumulated USD.
