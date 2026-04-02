import { create } from 'zustand';
import log from '../lib/logger';
import { commands } from '../lib/tauri-commands';
import type { TcpTuningState } from '../types';

interface NetworkStore {
  tuningState: TcpTuningState | null;
  isLoading: boolean;
  error: string | null;
  fetchTuningState: () => Promise<void>;
  applyPreset: () => Promise<void>;
  resetDefaults: () => Promise<void>;
  clearError: () => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  tuningState: null,
  isLoading: false,
  error: null,

  fetchTuningState: async () => {
    set({ isLoading: true, error: null });
    try {
      const tuningState = await commands.getTcpTuningState();
      set({ tuningState, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'fetch tcp tuning state failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  applyPreset: async () => {
    set({ isLoading: true, error: null });
    try {
      const tuningState = await commands.applyGamingNetworkPreset();
      set({ tuningState, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'apply gaming network preset failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  resetDefaults: async () => {
    set({ isLoading: true, error: null });
    try {
      const tuningState = await commands.resetNetworkDefaults();
      set({ tuningState, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'reset network defaults failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  clearError: () => set({ error: null }),
}));
