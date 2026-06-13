# ForgeAI Folder Structure, UI Wireframes, and State Management

---

## 1. Directory Layout (Monorepo Folder Structure)

ForgeAI uses a unified monorepo structure to facilitate full-stack development, API alignment, and simple containerization:

```
ForgeAI/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # Configuration, security, JWT helper files
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/               # PostgreSQL session engines and tables
│   │   │   ├── base.py
│   │   │   ├── models.py
│   │   │   └── session.py
│   │   ├── routers/          # API endpoint routes
│   │   │   ├── auth.py
│   │   │   ├── startups.py
│   │   │   └── debate.py
│   │   ├── services/         # Business logic
│   │   │   ├── agents.py     # LangGraph agent definitions
│   │   │   └── rag.py        # Qdrant client interfaces
│   │   ├── workers/          # Background task workers (Celery)
│   │   │   └── celery_app.py
│   │   └── main.py           # Application Gateway Entry point
│   ├── tests/                # Pytest suit
│   ├── Dockerfile
│   └── requirements.txt
│
├── mobile/                   # Expo React Native App
│   ├── assets/               # Fonts, local imagery assets
│   ├── src/
│   │   ├── components/       # Reusable components (GlassCard, CustomButton, Loader)
│   │   ├── navigation/       # React Navigation Root & Auth navigators
│   │   ├── screens/          # Application views
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── StartupBuilderScreen.tsx
│   │   │   └── BoardRoomScreen.tsx
│   │   ├── store/            # Zustand Local Store Engine
│   │   │   └── useAppStore.ts
│   │   └── theme/            # Styling design tokens & color schemes
│   │       └── index.ts
│   ├── App.tsx
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
└── docs/                     # Comprehensive Architecture Docs (23 Deliverables)
```

---

## 2. Screen Wireframes (Conceptual Layouts)

### 2.1 Startup Builder UI (Prompt Input and Generation Pipeline)
```
+-------------------------------------------------------------+
| [WiFi] [Battery]                                   12:00 PM |
+-------------------------------------------------------------+
|  ForgeAI: Create New Venture                                |
+-------------------------------------------------------------+
|                                                             |
|  What do you want to build?                                 |
|  +-------------------------------------------------------+  |
|  | Enter idea (e.g. Hospital AI Platform...)             |  |
|  |                                                       |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  Model Configuration:               [ Gemini 1.5 Pro (v) ]  |
|  Model Budget Limit (USD):          [ $10.00             ]  |
|                                                             |
|  +-------------------------------------------------------+  |
|  |                [ GENERATE VENTURE BLUEPRINT ]         |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  Current Tasks:                                             |
|  - [x] RAG Playbook Search (Confidence: 0.98)               |
|  - [x] Product Manager Agent: Creating PRD                  |
|  - [/] Architect Agent: Creating Postgres Schema            |
|  - [ ] Backend Engineer: Boilerplate API Endpoint           |
+-------------------------------------------------------------+
| [Dashboard]          [*Startup Builder*]         [Debate]   |
+-------------------------------------------------------------+
```

### 2.2 Board Room Debate UI (Multi-Agent Strategy Negotiation)
```
+-------------------------------------------------------------+
| [WiFi] [Battery]                                   12:05 PM |
+-------------------------------------------------------------+
|  AI Board Room: Pricing Negotiation                         |
+-------------------------------------------------------------+
| [Topic: Usage-based vs Subscription pricing model]          |
|                                                             |
|  [CEO Agent]: "Given the target TAM of $25M, we need        |
|  predictable revenues to attract VC funding."               |
|                                                             |
|  [Finance Agent]: "A base subscription rate ($49/mo) with  |
|  usage credits is our path to profitability in Year 1."     |
|                                                             |
|  [CTO Agent]: "Usage-based is direct to map to our LLM API |
|  costs, reducing cashburn risks."                           |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Synthesis: Hybrid model recommended.                  |  |
|  | Pros: High predictable income. Cons: Higher setup.    |  |
|  | [ Approve Decision & Write to PRD ]                    |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
| [Dashboard]           [Startup Builder]         [*Debate*]  |
+-------------------------------------------------------------+
```

---

## 3. High-Fidelity UI Design Tokens (Glassmorphism Theme)

To create a premium SaaS appearance, ForgeAI utilizes semi-transparent materials, saturated gradients, and clear text hierarchies:

```typescript
// mobile/src/theme/index.ts
export const DesignSystem = {
  colors: {
    background: '#0B0A14',      // Deep space black
    surface: 'rgba(255, 255, 255, 0.03)', // Highly transparent white
    surfaceBorder: 'rgba(255, 255, 255, 0.08)',
    primary: '#6D28D9',         // Saturated Royal Purple
    primaryGradient: ['#6D28D9', '#4C1D95'],
    secondary: '#10B981',       // High-contrast Emerald Green
    accent: '#F43F5E',          // Rose Red for alarms/incidents
    textPrimary: '#F9FAFB',     // Off-white
    textSecondary: '#9CA3AF',   // Cool Grey
  },
  typography: {
    fontFamily: 'Outfit-Bold',  // Google Font Outfit
    h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  },
  glassmorphism: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    backdropFilter: 'blur(20px)', // For platforms supporting web/native blur
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  }
};
```

---

## 4. State Management Strategy (Zustand & React Query)

Zustand maintains system variables, cache buffers, offline queues, and local session parameters. React Query wraps remote endpoint requests.

```typescript
// mobile/src/store/useAppStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  token: string | null;
  selectedStartupId: string | null;
  offlineQueue: any[];
  setToken: (token: string | null) => void;
  setSelectedStartupId: (id: string | null) => void;
  addToOfflineQueue: (action: any) => void;
  clearOfflineQueue: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      selectedStartupId: null,
      offlineQueue: [],
      setToken: (token) => set({ token }),
      setSelectedStartupId: (selectedStartupId) => set({ selectedStartupId }),
      addToOfflineQueue: (action) => set((state) => ({ offlineQueue: [...state.offlineQueue, action] })),
      clearOfflineQueue: () => set({ offlineQueue: [] }),
    }),
    {
      name: 'forgeai-local-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```
* **Sync Mechanism**: When active connectivity transitions from `offline` to `online` (monitored via `@react-native-community/netinfo`), a background sync handler iterates over `offlineQueue`, dispatches operations to FastAPI, and clears the queue on success.
