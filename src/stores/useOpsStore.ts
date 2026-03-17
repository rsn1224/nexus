import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
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
  isListening: boolean;
  unlisten: (() => void) | null;

  subscribe: () => void;
  unsubscribe: () => void;
  fetchSuggestions: () => Promise<void>;
  killProcess: (pid: number) => Promise<void>;
  setProcessPriority: (pid: number, priority: 'high' | 'normal' | 'idle') => Promise<void>;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOpsStore = create<OpsStore>((set, get) => ({
  processes: [],
  suggestions: [],
  isLoading: false,
  isSuggestionsLoading: false,
  error: null,
  lastUpdated: null,
  isListening: false,
  unlisten: null,

  subscribe: () => {
    if (get().isListening) {
      log.warn('ops: already listening');
      return;
    }

    log.info('ops: subscribing to nexus://ops');

    set({ isListening: true, error: null });

    listen<SystemProcess[]>('nexus://ops', (event) => {
      const processes = event.payload;
      log.info({ count: processes.length }, 'ops: processes received');
      set({ processes, lastUpdated: Date.now() });
    })
      .then((fn) => {
        set({ unlisten: fn });
      })
      .catch((err) => {
        const errorMessage = extractErrorMessage(err);
        log.error({ err }, 'ops: listen failed: %s', errorMessage);
        set({
          processes: [],
          suggestions: [],
          isLoading: false,
          isSuggestionsLoading: false,
          isListening: false,
          error: errorMessage,
          lastUpdated: null,
        });
      });
  },

  unsubscribe: () => {
    const { unlisten } = get();
    if (unlisten) {
      unlisten();
      set({ unlisten: null });
      log.info('ops: unsubscribed');
    }
    set({ isListening: false });
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
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'ops: fetch suggestions failed: %s', errorMessage);
      set({
        processes: [],
        suggestions: [],
        isLoading: false,
        isSuggestionsLoading: false,
        error: errorMessage,
        lastUpdated: null,
      });
    } finally {
      set({ isSuggestionsLoading: false });
    }
  },

  killProcess: async (pid: number) => {
    set({ error: null });
    try {
      await invoke('kill_process', { pid });
      log.info({ pid }, 'ops: process killed');
      // プロセス一覧は次の nexus://ops イベントで自動更新される
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err, pid }, 'ops: kill process failed: %s', errorMessage);
      set({
        processes: [],
        suggestions: [],
        isLoading: false,
        isSuggestionsLoading: false,
        error: errorMessage,
        lastUpdated: null,
      });
    }
  },

  setProcessPriority: async (pid: number, priority: 'high' | 'normal' | 'idle') => {
    set({ error: null });
    try {
      await invoke('set_process_priority', { pid, priority });
      log.info({ pid, priority }, 'ops: priority updated');
      // プロセス一覧は次の nexus://ops イベントで自動更新される
    } catch (err) {
      const message = extractErrorMessage(err);
      log.error({ err, pid }, 'ops: set priority failed');
      set({ error: message });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Granular selectors（互換性維持）
export const useProcesses = () => useOpsStore((s) => s.processes);
export const useProcessSuggestions = () => useOpsStore((s) => s.suggestions);
export const useProcessLoading = () => useOpsStore((s) => s.isLoading);
export const useSuggestionsLoading = () => useOpsStore((s) => s.isSuggestionsLoading);
export const useProcessError = () => useOpsStore((s) => s.error);
export const useProcessLastUpdated = () => useOpsStore((s) => s.lastUpdated);
export const useProcessActions = () =>
  useOpsStore(
    useShallow((s) => ({
      fetchSuggestions: s.fetchSuggestions,
      kill: s.killProcess,
      setPriority: s.setProcessPriority,
    })),
  );
export const useOpsListeningControl = () =>
  useOpsStore(
    useShallow((s) => ({
      subscribe: s.subscribe,
      unsubscribe: s.unsubscribe,
    })),
  );

// 新しい統合セレクタ
export const useOpsState = () =>
  useOpsStore(
    useShallow((s) => ({
      processes: s.processes,
      suggestions: s.suggestions,
      isLoading: s.isLoading,
      isSuggestionsLoading: s.isSuggestionsLoading,
      error: s.error,
      lastUpdated: s.lastUpdated,
      isListening: s.isListening,
    })),
  );

export const useOpsActions = () =>
  useOpsStore(
    useShallow((s) => ({
      subscribe: s.subscribe,
      unsubscribe: s.unsubscribe,
      fetchSuggestions: s.fetchSuggestions,
      killProcess: s.killProcess,
      setProcessPriority: s.setProcessPriority,
      clearError: s.clearError,
    })),
  );

// Cleanup on unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useOpsStore.getState().unsubscribe();
  });
}
