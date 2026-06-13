# ForgeAI Observability, CI/CD, Deployment, and Launch Checklist

---

## 1. Observability and Monitoring Architecture

ForgeAI uses OpenTelemetry for distributed tracing, Prometheus for metrics, and Grafana for dashboards.

```
[FastAPI App] & [Celery Worker] --(OTel Exporter)--> [Grafana Tempo (Traces)]
            |
            +--(Prometheus Metrics API)-------------> [Prometheus (Metrics)]
```

### Metrics Tracked:
1. `forgeai_agent_latency_seconds`: Histogram measuring execution duration per agent type.
2. `forgeai_agent_token_costs_usd`: Counter tracking exact usage totals per model type (GPT-4o, Claude, Gemini).
3. `forgeai_agent_hallucination_rate`: Gauge tracking occurrences of confidence score falling below 0.7.
4. `forgeai_incident_open_count`: Gauge tracking outstanding unresolved system incidents.

---

## 2. CI/CD Pipeline (GitHub Actions Specification)

The monorepo build pipeline ensures that every commit is validated, linted, tested, and containerized before hitting production:

```yaml
# .github/workflows/main.yml
name: ForgeAI CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install Dependencies
        run: |
          cd backend
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      - name: Run Linter & Formatter
        run: |
          cd backend
          flake8 app
          black --check app
      - name: Run Pytest
        run: |
          cd backend
          pytest

  mobile-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Mobile Dependencies
        run: |
          cd mobile
          npm ci
      - name: Run TSC Check
        run: |
          cd mobile
          npm run ts:check

  build-and-push:
    needs: [backend-test, mobile-lint]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}
      - name: Build and Push FastAPI Image
        run: |
          docker build -t forgeai/backend:latest ./backend
          docker push forgeai/backend:latest
```

---

## 3. Deployment & Infrastructure Architecture

ForgeAI is deployable to Kubernetes (EKS / GKE) using Docker containers.

### Kubernetes Deployment Specification (App Gateway):
```yaml
# infrastructure/k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: forgeai-backend-deployment
  namespace: forgeai-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: forgeai-backend
  template:
    metadata:
      labels:
        app: forgeai-backend
    spec:
      containers:
        - name: gateway
          image: forgeai/backend:latest
          ports:
            - containerPort: 8000
          envFrom:
            - secretRef:
                name: forgeai-secrets
          resources:
            limits:
              cpu: "1.0"
              memory: 1024Mi
            requests:
              cpu: "0.5"
              memory: 512Mi
```

---

## 4. Sprint-by-Sprint Roadmap

* **Sprint 1: Core Foundation & Auth**
  * Set up FastAPI structures, PostgreSQL database models, JWT auth flow, and RBAC.
  * Initialize Expo boilerplate, Zustand layout, design system configurations, and main navigators.
* **Sprint 2: RAG & Multi-Agent Engines**
  * Integrate Qdrant vector indexing, embedding helpers, and LangGraph workflow nodes.
  * Connect model routing APIs for OpenAI, Gemini, and Claude.
* **Sprint 3: AI Board Room & Real-Time Sync**
  * Implement multi-agent debate workflow state machine.
  * Connect WebSocket controllers for real-time task log streaming to mobile clients.
  * Set up Expo Push Notifications and link targets.
* **Sprint 4: Verification, Security, & Launch**
  * Add incident logger endpoints and token budgeting metrics trackers.
  * Finalize OpenTelemetry metrics endpoints, load test database indexing, and deploy to Kubernetes.

---

## 5. Production Launch Checklist

- [ ] **Security Audits**: Run `bandit` on backend and verify that CORS is locked down to mobile domains. Enable MFA requirements for administrative users.
- [ ] **Scale Validation**: Execute load-test suite simulating 10,000 requests per minute on API endpoints to verify PostgreSQL pool size configuration.
- [ ] **Incident Verification**: Test that Celery budget workers correctly freeze task executions when a startup's token budget limit is exceeded.
- [ ] **Backup Routines**: Set up automated daily snapshots for the PostgreSQL instance and set up recovery failovers for Redis.
