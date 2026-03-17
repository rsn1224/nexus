import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { extractErrorMessage } from '../lib/tauri';
import type { FrameTimeMonitorState, FrameTimeSnapshot } from '../types';

interface FrameTimeStoreState {
  monitorState: FrameTimeMonitorState;
  snapshot: FrameTimeSnapshot | null;
  history: FrameTimeSnapshot[]; // 直近60個（60秒分）
  isLoading: boolean;
  error: string | null;
}

interface FrameTimeStoreActions {
  startMonitor: (pid: number, processName: string) => Promise<void>;
  stopMonitor: () => Promise<void>;
  getStatus: () => Promise<void>;
  setupListeners: () => Promise<UnlistenFn>;
}

const MAX_HISTORY = 60;

export const useFrameTimeStore = create<FrameTimeStoreState & FrameTimeStoreActions>(
  (set, get) => ({
    monitorState: { type: 'stopped' },
    snapshot: null,
    history: [],
    isLoading: false,
    error: null,

    startMonitor: async (pid, processName) => {
      set({ isLoading: true, error: null });
      try {
        const state = await invoke<FrameTimeMonitorState>('start_frame_time_monitor', {
          pid,
          processName,
        });
        set({ monitorState: state, isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: extractErrorMessage(err) });
      }
    },

    stopMonitor: async () => {
      set({ isLoading: true, error: null });
      try {
        const state = await invoke<FrameTimeMonitorState>('stop_frame_time_monitor');
        set({ monitorState: state, snapshot: null, history: [], isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: extractErrorMessage(err) });
      }
    },

    getStatus: async () => {
      try {
        const state = await invoke<FrameTimeMonitorState>('get_frame_time_status');
        set({ monitorState: state });
      } catch (err) {
        set({ error: extractErrorMessage(err) });
      }
    },

    setupListeners: async () => {
      const unlisten = await listen<FrameTimeSnapshot>('nexus://frame-time', (event) => {
        const snap = event.payload;
        const history = [...get().history, snap].slice(-MAX_HISTORY);
        set({ snapshot: snap, history });
      });
      return unlisten;
    },
  }),
);

// ─── セレクタ ────────────────────────────────────────────────────────────────

export const useFrameTimeState = () =>
  useFrameTimeStore(
    useShallow((s) => ({
      monitorState: s.monitorState,
      snapshot: s.snapshot,
      history: s.history,
      isLoading: s.isLoading,
      error: s.error,
    })),
  );

export const useFrameTimeActions = () =>
  useFrameTimeStore(
    useShallow((s) => ({
      startMonitor: s.startMonitor,
      stopMonitor: s.stopMonitor,
      getStatus: s.getStatus,
      setupListeners: s.setupListeners,
    })),
  );
