import { create } from 'zustand';
import log from '../lib/logger';
import { commands } from '../lib/tauri-commands';
import type { HardwareInfo } from '../types';

interface HardwareStore {
  info: HardwareInfo | null;
  isLoading: boolean;
  error: string | null;
  fetchInfo: () => Promise<void>;
  clearError: () => void;
}

export const useHardwareStore = create<HardwareStore>((set) => ({
  info: null,
  isLoading: false,
  error: null,

  fetchInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await commands.getHardwareInfo();
      set({ info, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'fetch hardware info failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  clearError: () => set({ error: null }),
}));
