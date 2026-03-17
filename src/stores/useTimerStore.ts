import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { extractErrorMessage } from '../lib/tauri';
import type { TimerResolutionState } from '../types';

interface TimerStoreState {
  timerState: TimerResolutionState | null;
  isLoading: boolean;
  isApplying: boolean;
  error: string | null;
}

interface TimerStoreActions {
  fetchTimerState: () => Promise<void>;
  setTimerResolution: (resolution100ns: number) => Promise<void>;
  restoreTimerResolution: () => Promise<void>;
}

export const useTimerStore = create<TimerStoreState & TimerStoreActions>((set) => ({
  timerState: null,
  isLoading: false,
  isApplying: false,
  error: null,

  fetchTimerState: async () => {
    set({ isLoading: true, error: null });
    try {
      const state = await invoke<TimerResolutionState>('get_timer_resolution');
      set({ timerState: state, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err) });
    }
  },

  setTimerResolution: async (resolution100ns: number) => {
    set({ isApplying: true, error: null });
    try {
      const state = await invoke<TimerResolutionState>('set_timer_resolution', {
        resolution100ns,
      });
      set({ timerState: state, isApplying: false });
    } catch (err) {
      set({ isApplying: false, error: extractErrorMessage(err) });
    }
  },

  restoreTimerResolution: async () => {
    set({ isApplying: true, error: null });
    try {
      await invoke('restore_timer_resolution');
      // 復元後に最新状態を再取得
      const state = await invoke<TimerResolutionState>('get_timer_resolution');
      set({ timerState: state, isApplying: false });
    } catch (err) {
      set({ isApplying: false, error: extractErrorMessage(err) });
    }
  },
}));

// ─── セレクタ ────────────────────────────────────────────────────────────────
export const useTimerState = () =>
  useTimerStore(
    useShallow((s) => ({
      timerState: s.timerState,
      isLoading: s.isLoading,
      isApplying: s.isApplying,
      error: s.error,
    })),
  );

export const useTimerActions = () =>
  useTimerStore(
    useShallow((s) => ({
      fetchTimerState: s.fetchTimerState,
      setTimerResolution: s.setTimerResolution,
      restoreTimerResolution: s.restoreTimerResolution,
    })),
  );
