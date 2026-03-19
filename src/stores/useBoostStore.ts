import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
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
      const msg = extractErrorMessage(err);
      log.error({ err }, 'boost: 実行失敗: %s', msg);
      set({ error: msg, isRunning: false });
    }
  },
}));

// useShallow セレクタ
export const useBoostState = () =>
  useBoostStore(
    useShallow((s) => ({
      lastResult: s.lastResult,
      isRunning: s.isRunning,
      error: s.error,
      runBoost: s.runBoost,
    })),
  );

export const useBoostActions = () =>
  useBoostStore(
    useShallow((s) => ({
      runBoost: s.runBoost,
    })),
  );
