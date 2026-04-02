import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { commands } from '../lib/tauri-commands';
import type { DiagnosticAlert, SystemStatus } from '../types';

const POLL_INTERVAL_MS = 5000;

let pollTimer: ReturnType<typeof setInterval> | null = null;

interface SystemStore {
  status: SystemStatus | null;
  alerts: DiagnosticAlert[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useSystemStore = create<SystemStore>((set) => ({
  status: null,
  alerts: [],
  isLoading: false,
  error: null,

  refresh: async () => {
    set({ isLoading: true, error: null });
    const [statusResult, alertsResult] = await Promise.allSettled([
      commands.getSystemStatus(),
      commands.diagnose(),
    ]);
    const status = statusResult.status === 'fulfilled' ? statusResult.value : null;
    const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value : [];
    if (statusResult.status === 'rejected') {
      const msg =
        statusResult.reason instanceof Error
          ? statusResult.reason.message
          : String(statusResult.reason);
      log.error({ err: statusResult.reason }, 'system status fetch failed: %s', msg);
      set({ isLoading: false, error: msg });
      return;
    }
    set({ status, alerts, isLoading: false });
  },

  startPolling: () => {
    if (pollTimer !== null) return;
    void useSystemStore.getState().refresh();
    pollTimer = setInterval(() => void useSystemStore.getState().refresh(), POLL_INTERVAL_MS);
  },

  stopPolling: () => {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
}));

export const useSystemStatus = () =>
  useSystemStore(
    useShallow((s) => ({
      status: s.status,
      alerts: s.alerts,
      isLoading: s.isLoading,
      error: s.error,
    })),
  );
