import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import type { BoostResult } from '../types';

interface BoostStore {
  lastResult: BoostResult | null;
  isRunning: boolean;
  error: string | null;
  runBoost: (threshold?: number) => Promise<void>;
}

export const useBoostStore = create<BoostStore>((set) => ({
  lastResult: null,
  isRunning: false,
  error: null,

  runBoost: async (threshold = 15) => {
    set({ isRunning: true, error: null });

    try {
      const result = await invoke<BoostResult>('run_boost', {
        thresholdPercent: threshold,
      });

      set({ lastResult: result, isRunning: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        isRunning: false,
      });
    }
  },
}));
