import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import { getOptimizationSuggestions } from '../services/perplexityService';
import type { SystemProcess } from '../types';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface OpsStore {
  processes: SystemProcess[];
  suggestions: string[];
  isLoading: boolean;
  isSuggestionsLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  processPollInterval: number | null;

  fetchProcesses: () => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  killProcess: (pid: number) => Promise<void>;
  setProcessPriority: (pid: number, priority: 'high' | 'normal' | 'idle') => Promise<void>;
  startProcessPolling: () => void;
  stopProcessPolling: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOpsStore = create<OpsStore>((set, get) => ({
  processes: [],
  suggestions: [],
  isLoading: false,
  isSuggestionsLoading: false,
  error: null,
  lastUpdated: null,
  processPollInterval: null,

  fetchProcesses: async () => {
    set({ isLoading: true, error: null });
    try {
      const processes = await invoke<SystemProcess[]>('list_processes');
      log.info({ count: processes.length }, 'ops: processes fetched');
      set({ processes, lastUpdated: Date.now() });
    } catch (err) {
      const message = extractErrorMessage(err);
      log.error({ err }, 'ops: fetch processes failed');
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSuggestions: async () => {
    set({ isSuggestionsLoading: true, error: null });
    try {
      const processNames = await invoke<string[]>('get_ai_suggestions');
      const result = await getOptimizationSuggestions(processNames);
      if (!result.ok) {
        set({ error: result.error });
        return;
      }
      log.info({ count: result.data.length }, 'ops: suggestions fetched');
      set({ suggestions: result.data });
    } catch (err) {
      const message = extractErrorMessage(err);
      log.error({ err }, 'ops: fetch suggestions failed');
      set({ error: message });
    } finally {
      set({ isSuggestionsLoading: false });
    }
  },

  killProcess: async (pid: number) => {
    set({ error: null });
    try {
      await invoke('kill_process', { pid });
      log.info({ pid }, 'ops: process killed');
      await get().fetchProcesses();
    } catch (err) {
      const message = extractErrorMessage(err);
      log.error({ err, pid }, 'ops: kill process failed');
      set({ error: message });
    }
  },

  setProcessPriority: async (pid: number, priority: 'high' | 'normal' | 'idle') => {
    set({ error: null });
    try {
      await invoke('set_process_priority', { pid, priority });
      log.info({ pid, priority }, 'ops: priority updated');
      await get().fetchProcesses();
    } catch (err) {
      const message = extractErrorMessage(err);
      log.error({ err, pid }, 'ops: set priority failed');
      set({ error: message });
    }
  },

  startProcessPolling: () => {
    const { processPollInterval } = get();
    if (processPollInterval) {
      log.warn('ops: process polling already started');
      return;
    }

    log.info('ops: starting process polling');

    // Initial fetch
    void get().fetchProcesses();

    // Start polling with 3-second interval
    const interval = setInterval(() => {
      void get().fetchProcesses();
    }, 3000) as unknown as number;

    set({ processPollInterval: interval });
  },

  stopProcessPolling: () => {
    const { processPollInterval } = get();
    if (processPollInterval) {
      clearInterval(processPollInterval);
      log.info('ops: stopped process polling');
      set({ processPollInterval: null });
    }
  },
}));

// Granular selectors to prevent unnecessary re-renders
export const useProcesses = () => useOpsStore((s) => s.processes);
export const useProcessSuggestions = () => useOpsStore((s) => s.suggestions);
export const useProcessLoading = () => useOpsStore((s) => s.isLoading);
export const useSuggestionsLoading = () => useOpsStore((s) => s.isSuggestionsLoading);
export const useProcessError = () => useOpsStore((s) => s.error);
export const useProcessLastUpdated = () => useOpsStore((s) => s.lastUpdated);
export const useProcessActions = () =>
  useOpsStore((s) => ({
    fetch: s.fetchProcesses,
    fetchSuggestions: s.fetchSuggestions,
    kill: s.killProcess,
    setPriority: s.setProcessPriority,
  }));
export const useProcessPollingControl = () =>
  useOpsStore((s) => ({
    start: s.startProcessPolling,
    stop: s.stopProcessPolling,
  }));

// Cleanup on unmount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useOpsStore.getState().stopProcessPolling();
  });
}
