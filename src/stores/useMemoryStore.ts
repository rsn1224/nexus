import { create } from 'zustand';
import log from '../lib/logger';
import { commands } from '../lib/tauri-commands';
import type { MemoryCleanerConfig, MemoryCleanupResult } from '../types';

interface MemoryStore {
  config: MemoryCleanerConfig | null;
  lastResult: MemoryCleanupResult | null;
  isLoading: boolean;
  isCleaning: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: MemoryCleanerConfig) => Promise<void>;
  runCleanup: () => Promise<void>;
  clearError: () => void;
}

export const useMemoryStore = create<MemoryStore>((set) => ({
  config: null,
  lastResult: null,
  isLoading: false,
  isCleaning: false,
  error: null,

  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await commands.getMemoryCleanerConfig();
      set({ config, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'fetch memory cleaner config failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  updateConfig: async (config) => {
    set({ isLoading: true, error: null });
    try {
      await commands.updateMemoryCleanerConfig(config);
      set({ config, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'update memory cleaner config failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  runCleanup: async () => {
    set({ isCleaning: true, error: null });
    try {
      const lastResult = await commands.manualMemoryCleanup();
      set({ lastResult, isCleaning: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'manual memory cleanup failed: %s', msg);
      set({ isCleaning: false, error: msg });
    }
  },

  clearError: () => set({ error: null }),
}));
