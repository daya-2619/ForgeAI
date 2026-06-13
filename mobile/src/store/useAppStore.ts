import { create } from 'zustand';

// Setup standard Types matching our PostgreSQL tables
export interface Startup {
  id: string;
  name: string;
  description: string;
  status: string;
  budget_limit: number;
}

export interface Task {
  id: string;
  agent_role: string;
  name: string;
  description: string;
  status: string;
  confidence_score: number;
  output?: string;
}

export interface Incident {
  id: string;
  type: string;
  severity: string;
  details: string;
  status: string;
}

export interface Debate {
  id: string;
  topic: string;
  transcript: { agent: string; message: string }[];
  consensus: string;
}

interface AppStore {
  backendUrl: string;
  isOnline: boolean;
  activeStartup: Startup | null;
  startups: Startup[];
  tasks: Task[];
  incidents: Incident[];
  debates: Debate[];
  ragResults: { text: string; metadata: { source: string; category: string } }[];
  totalCost: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setConnectionStatus: (status: boolean) => void;
  createStartup: (name: string, description: string, budget: number) => Promise<string | null>;
  fetchDashboard: (startupId: string) => Promise<void>;
  triggerDebate: (startupId: string, topic: string, tone?: string, selectedAgents?: string[]) => Promise<void>;
  fetchDebates: (startupId: string) => Promise<void>;
  searchRAG: (query: string) => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  backendUrl: 'http://127.0.0.1:8000', // Default local API gateway
  isOnline: true,
  activeStartup: null,
  startups: [],
  tasks: [],
  incidents: [],
  debates: [],
  ragResults: [],
  totalCost: 0.0,
  isLoading: false,
  error: null,
  
  setConnectionStatus: (status) => set({ isOnline: status }),
  
  createStartup: async (name, description, budget) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${get().backendUrl}/api/v1/startups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, budget_limit: budget }),
      });
      if (!response.ok) throw new Error('Failed to generate startup venture canvas.');
      const data = await response.json();
      
      // Auto trigger dashboard fetch
      await get().fetchDashboard(data.startup_id);
      set({ isLoading: false });
      return data.startup_id;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      // Queue offline task if offline
      return null;
    }
  },
  
  fetchDashboard: async (startupId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${get().backendUrl}/api/v1/startups/${startupId}/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard metrics.');
      const data = await response.json();
      
      set({
        activeStartup: data.startup,
        tasks: data.tasks,
        totalCost: data.total_cost,
        incidents: data.incidents,
        isLoading: false
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },
  
  triggerDebate: async (startupId, topic, tone = 'Collaborative', selectedAgents = ['CEO', 'CTO', 'Finance', 'Marketing']) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${get().backendUrl}/api/v1/startups/${startupId}/boardroom/debate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, tone, selected_agents: selectedAgents }),
      });
      if (!response.ok) throw new Error('Debate execution failed.');
      
      // Refresh dashboard (costs / status update)
      await get().fetchDashboard(startupId);
      await get().fetchDebates(startupId);
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },
  
  fetchDebates: async (startupId) => {
    try {
      const response = await fetch(`${get().backendUrl}/api/v1/startups/${startupId}/boardroom/debates`);
      if (!response.ok) throw new Error('Failed to load debates.');
      const data = await response.json();
      set({ debates: data });
    } catch (err: any) {
      console.warn(err.message);
    }
  },

  searchRAG: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${get().backendUrl}/api/v1/rag/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search knowledge base.');
      const data = await response.json();
      set({ ragResults: data, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  }
}));
