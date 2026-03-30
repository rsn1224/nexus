import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { defaultHardwareInfo } from '../lib/hardwareFormatters';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { HardwareInfo, ThermalAlert } from '../types';

interface HardwareStore {
  info: HardwareInfo | null;
  isListening: boolean;
  error: string | null;
  lastUpdated: number | null;
  unlisten: (() => void) | null;
  thermalAlerts: ThermalAlert[];
  unlistenThermal: (() => void) | null;

  subscribe: () => void;
  unsubscribe: () => void;
  clearError: () => void;
  clearThermalAlert: (component: string) => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────────────

export const useHardwareStore = create<HardwareStore>((set, get) => ({
  info: null,
  isListening: false,
  error: null,
  lastUpdated: null,
  unlisten: null,
  thermalAlerts: [],
  unlistenThermal: null,

  subscribe: () => {
    if (get().isListening) {
      log.warn('hardware: already listening');
      return;
    }

    log.info('hardware: subscribing to nexus://hardware');

    set({ isListening: true, error: null });

    listen<HardwareInfo>('nexus://hardware', (event) => {
      const info = event.payload;
      set({
        info,
        lastUpdated: Date.now(),
      });
    })
      .then((fn) => {
        set({ unlisten: fn });

        // サーマルアラートリスナーを開始
        listen<ThermalAlert>('nexus://thermal-alert', (event) => {
          const alert = event.payload;
          set((state) => {
            // Normalアラートは該当コンポーネントのアラートをクリア
            if (alert.level === 'Normal') {
              const filteredAlerts = state.thermalAlerts.filter(
                (a) => a.component !== alert.component,
              );
              return { thermalAlerts: filteredAlerts };
            } else {
              // Warning/Criticalアラートは追加（重複チェック）
              const exists = state.thermalAlerts.some(
                (a) => a.component === alert.component && a.level === alert.level,
              );
              if (!exists) {
                return { thermalAlerts: [...state.thermalAlerts, alert] };
              }
            }
            return state;
          });
        })
          .then((thermalFn) => {
            set({ unlistenThermal: thermalFn });
          })
          .catch((err) => {
            log.error({ err }, 'thermal: listen failed: %s', extractErrorMessage(err));
          });
      })
      .catch((err) => {
        const errorMessage = extractErrorMessage(err);
        log.error({ err }, 'hardware: listen failed: %s', errorMessage);
        set({
          info: defaultHardwareInfo,
          isListening: false,
          error: errorMessage,
        });
      });
  },

  unsubscribe: () => {
    const { unlisten, unlistenThermal } = get();
    if (unlisten) {
      unlisten();
      set({ unlisten: null });
      log.info('hardware: unsubscribed');
    }
    if (unlistenThermal) {
      unlistenThermal();
      set({ unlistenThermal: null });
      log.info('thermal: unsubscribed');
    }
    set({ isListening: false, thermalAlerts: [] });
  },

  clearError: () => {
    set({ error: null });
  },

  clearThermalAlert: (component: string) => {
    set((state) => ({
      thermalAlerts: state.thermalAlerts.filter((a) => a.component !== component),
    }));
  },
}));

// Granular selectors（互換性維持）
export const useHardwareInfo = () => useHardwareStore((s) => s.info);
export const useHardwareLoading = () => useHardwareStore(() => false); // 常に false（BE がプッシュ）
export const useHardwareError = () => useHardwareStore((s) => s.error);
export const useHardwareLastUpdated = () => useHardwareStore((s) => s.lastUpdated);
export const useHardwareFetch = () => useHardwareStore((s) => s.subscribe); // 互換: fetchHardware → subscribe
export const useHardwareListeningControl = () =>
  useHardwareStore(
    useShallow((s) => ({
      subscribe: s.subscribe,
      unsubscribe: s.unsubscribe,
    })),
  );

// Thermal selectors
export const useThermalAlerts = () => useHardwareStore((s) => s.thermalAlerts);
export const useThermalAlertsByLevel = (level: 'Warning' | 'Critical') =>
  useHardwareStore((s) => s.thermalAlerts.filter((a) => a.level === level));
export const useThermalActions = () =>
  useHardwareStore(
    useShallow((s) => ({
      clearThermalAlert: s.clearThermalAlert,
    })),
  );

// Computed selectors（変更なし）
export const useCpuInfo = () => useHardwareStore((s) => s.info?.cpuName ?? null);
export const useCpuTemp = () => useHardwareStore((s) => s.info?.cpuTempC ?? null);
export const useGpuInfo = () => useHardwareStore((s) => s.info?.gpuName ?? null);
export const useGpuUsage = () => useHardwareStore((s) => s.info?.gpuUsagePercent ?? null);
export const useGpuVram = () =>
  useHardwareStore(
    useShallow((s) => ({
      total: s.info?.gpuVramTotalMb ?? null,
      used: s.info?.gpuVramUsedMb ?? null,
    })),
  );

// 後方互換 re-export
export { createDiskProgressBar } from '../lib/hardwareFormatters';

// useShallow セレクタ
export const useHardwareState = () =>
  useHardwareStore(
    useShallow((s) => ({
      info: s.info,
      isListening: s.isListening,
      error: s.error,
      lastUpdated: s.lastUpdated,
    })),
  );

export const useHardwareActions = () =>
  useHardwareStore(
    useShallow((s) => ({
      subscribe: s.subscribe,
      unsubscribe: s.unsubscribe,
      clearError: s.clearError,
    })),
  );

// Cleanup on unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useHardwareStore.getState().unsubscribe();
  });
}
