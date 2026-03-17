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

  fetchProcesses: () => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  killProcess: (pid: number) => Promise<void>;
  setProcessPriority: (pid: number, priority: 'high' | 'normal' | 'idle') => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOpsStore = create<OpsStore>((set, get) => ({
  processes: [],
  suggestions: [],
  isLoading: false,
  isSuggestionsLoading: false,
  error: null,
  lastUpdated: null,

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
}));
