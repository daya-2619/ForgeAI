# ForgeAI Notifications, Security, RAG, and Agent Design

---

## 1. Notification Architecture

To keep founders updated on long-running multi-agent tasks, ForgeAI implements a real-time notification subsystem powered by Expo Push Notification Service.

```
 +------------------+       Send Push      +--------------------+
 | FastAPI Backend  |--------------------->| Expo Push Service  |
 +--------+---------+                      +---------+----------+
          |                                          | Send APNS/FCM
          | Save Log Metadata                        v
          v                                +--------------------+
 +------------------+                      |   Mobile Device    |
 |  PostgreSQL DB   |                      +---------+----------+
 +------------------+                                | Route Event
                                                     v
                                           +--------------------+
                                           | Zustand Route Sync |
                                           +--------------------+
```

### Deep Linking Support:
* Notifications payload contains a target screen and context ID:
  ```json
  {
    "to": "ExponentPushToken[xxx]",
    "title": "Incident Detected",
    "body": "CTO Agent flagged code generation build failure.",
    "data": {
      "screen": "Dashboard",
      "params": { "startupId": "123e4567-e89b-12d3-a456-426614174000", "tab": "incidents" }
    }
  }
  ```
* React Navigation's linking configuration automatically resolves this data to push the user to `DashboardScreen` and display the specific incident log.

---

## 2. Security Architecture

ForgeAI enforces enterprise-grade security protocols across all software layers:

```
[Client App] ---> [HTTPS WAF] ---> [FastAPI Auth Middleware (JWT + RBAC + Rate Limit)]
                                           |
                                           v
                             [Argon2ID Hashing & Fernet Encrypted DB]
```

* **Authentication & MFA**: Standard credentials exchange returns a temporary JWT. Users can enable Authenticator-based MFA (TOTP). During login, if MFA is enabled, the API requests a 6-digit verification code.
* **Role-Based Access Control (RBAC)**: Enforced via FastAPI dependencies:
  * `Founder`: Read/write access to their startup schemas, roadmaps, and agent configurations.
  * `Adviser`: Read-only access to specific startup portfolios; can write boardroom debate prompts.
  * `Auditor`: System-wide read access to token metrics, financial logs, and audit logs.
* **Rate Limiting**: Enforced at the gateway using Redis token-bucket middleware. Default: maximum of 100 API operations per minute per user ID.
* **Encryption**: Database fields containing OpenAI/Gemini/Claude API keys are encrypted at rest using AES-256-GCM (via Python's `cryptography.fernet` package) with key material sourced from environment variables.

---

## 3. RAG Architecture (Retrieval-Augmented Generation)

ForgeAI utilizes a semantic knowledge index to inject startup best practices into agent prompts:

```
[YC Playbooks / Startup Docs] ---> [Markdown chunker: 500 characters, 50 overlaps]
                                          |
                                          v
                              [Gemini Embedding API]
                                          |
                                          v
                              [Qdrant Collection Index]
                                          | Query Semantic Match
[LangGraph Agent Context] <----------------+
```

* **Chunking Strategy**: Markdown files are parsed and split using a semantic-header parser (size: 500 chars, overlap: 50 chars) to prevent context fragmentation.
* **Semantic Search**: Prior to running the Product Manager or Architect agent, the system generates an embedding of the user's venture idea and executes a vector similarity lookup in Qdrant (cosine similarity metric). The top 3 matching chunks are injected into the agent system prompts as local contextual rules.

---

## 4. AI Agent Design Specifications

Specialized agents are configured with system prompts, temperature controls, and JSON validation schemas.

### 4.1 Product Manager Agent
* **Model**: Claude-3-5-Sonnet (default) or Gemini-1.5-Pro.
* **System Prompt**:
  ```
  You are the Lead Product Manager at ForgeAI. Your goal is to write high-fidelity Product Requirements Documents (PRDs) containing clear problem definitions, user stories with detailed acceptance criteria, and prioritized roadmaps. Format output as structured JSON matching the PRD model schema.
  ```
* **Output Validation**: Enforced via Pydantic model validation.

### 4.2 Software Architect Agent
* **Model**: Claude-3-5-Sonnet (default) or GPT-4o.
* **System Prompt**:
  ```
  You are the Principal Software Architect. Your task is to design clean relational PostgreSQL database models, Qdrant vectors structures, and OpenAPI endpoint paths matching modern microservice standards. Ensure DB schemas are outputted in clean SQL syntax and API specs follow OpenAPI 3.0 specs.
  ```

### 4.3 QA Agent
* **Model**: Gemini-1.5-Flash (optimized for fast auditing).
* **System Prompt**:
  ```
  You are the QA Lead. Review generated code and architecture database schema drafts. Identify potential index hotspots, missing foreign key constraints, or SQL injection vectors. Return a structured critique list and a confidence score between 0.0 and 1.0.
  ```
