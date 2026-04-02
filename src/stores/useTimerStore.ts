import { create } from 'zustand';
import log from '../lib/logger';
import { commands } from '../lib/tauri-commands';
import type { CoreParkingState, TimerResolutionState } from '../types';

interface TimerStore {
  timerState: TimerResolutionState | null;
  parkingState: CoreParkingState | null;
  isLoading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  setTimerResolution: (resolution100ns: number) => Promise<void>;
  restoreTimerResolution: () => Promise<void>;
  setCoreParking: (minCoresPercent: number) => Promise<void>;
  clearError: () => void;
}

export const useTimerStore = create<TimerStore>((set) => ({
  timerState: null,
  parkingState: null,
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const [timerState, parkingState] = await Promise.all([
        commands.getTimerResolution(),
        commands.getCoreParkingState(),
      ]);
      set({ timerState, parkingState, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'fetch timer/parking state failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  setTimerResolution: async (resolution100ns) => {
    set({ isLoading: true, error: null });
    try {
      const timerState = await commands.setTimerResolution(resolution100ns);
      set({ timerState, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'set timer resolution failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  restoreTimerResolution: async () => {
    set({ isLoading: true, error: null });
    try {
      await commands.restoreTimerResolution();
      const timerState = await commands.getTimerResolution();
      set({ timerState, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'restore timer resolution failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  setCoreParking: async (minCoresPercent) => {
    set({ isLoading: true, error: null });
    try {
      await commands.setCoreParking(minCoresPercent);
      const parkingState = await commands.getCoreParkingState();
      set({ parkingState, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'set core parking failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  clearError: () => set({ error: null }),
}));
