import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { HealthCheckInput, HealthCheckResult } from '../types';

interface HealthCheckState {
  result: HealthCheckResult | null;
  isLoading: boolean;
  error: string | null;
  lastCheckTime: number | null;
}

interface HealthCheckActions {
  runHealthCheck: (input: HealthCheckInput) => Promise<void>;
  reset: () => void;
}

type HealthCheckStore = HealthCheckState & HealthCheckActions;

const initialState: HealthCheckState = {
  result: null,
  isLoading: false,
  error: null,
  lastCheckTime: null,
};

export const useHealthCheckStore = create<HealthCheckStore>((set) => ({
  ...initialState,

  runHealthCheck: async (input: HealthCheckInput) => {
    set({ isLoading: true, error: null });

    try {
      log.info('Running health check');
      const result = await invoke<HealthCheckResult>('run_health_check', { input });

      set({
        result,
        isLoading: false,
        lastCheckTime: Date.now(),
      });

      log.info(
        { overall: result.overall, itemsCount: result.items.length },
        'Health check completed',
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'ヘルスチェックの実行に失敗しました';
      log.error({ err }, 'Health check failed');

      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
