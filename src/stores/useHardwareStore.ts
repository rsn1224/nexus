import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { HardwareInfo } from '../types';

interface HardwareStore {
  info: HardwareInfo | null;
  isListening: boolean;
  error: string | null;
  lastUpdated: number | null;
  unlisten: (() => void) | null;

  subscribe: () => void;
  unsubscribe: () => void;
  clearError: () => void;
}

// Default hardware info for fallback
const defaultHardwareInfo: HardwareInfo = {
  cpuName: 'Unknown CPU',
  cpuCores: 0,
  cpuThreads: 0,
  cpuBaseGhz: 0,
  cpuTempC: null,
  memTotalGb: 0,
  memUsedGb: 0,
  osName: 'Unknown OS',
  osVersion: 'Unknown',
  hostname: 'Unknown',
  uptimeSecs: 0,
  bootTimeUnix: 0,
  disks: [],
  gpuName: null,
  gpuVramTotalMb: null,
  gpuVramUsedMb: null,
  gpuTempC: null,
  gpuUsagePercent: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useHardwareStore = create<HardwareStore>((set, get) => ({
  info: null,
  isListening: false,
  error: null,
  lastUpdated: null,
  unlisten: null,

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
    const { unlisten } = get();
    if (unlisten) {
      unlisten();
      set({ unlisten: null });
      log.info('hardware: unsubscribed');
    }
    set({ isListening: false });
  },

  clearError: () => {
    set({ error: null });
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

// Selectors for derived data
export const useHardwareData = () => {
  const { info, isListening, error, subscribe } = useHardwareStore(
    useShallow((s) => ({
      info: s.info,
      isListening: s.isListening,
      error: s.error,
      subscribe: s.subscribe,
    })),
  );

  const memUsagePercent =
    info && info.memTotalGb > 0 ? (info.memUsedGb / info.memTotalGb) * 100 : 0;

  const formattedUptime = info ? formatUptime(info.uptimeSecs) : '--';

  const formattedBootTime = info
    ? new Date(info.bootTimeUnix * 1000).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--';

  const diskUsagePercent =
    info && info.disks.length > 0 ? (info.disks[0].usedGb / info.disks[0].totalGb) * 100 : null;

  return {
    info,
    isLoading: !isListening && info === null, // 初回のみローディング表示
    error,
    memUsagePercent,
    formattedUptime,
    formattedBootTime,
    diskUsagePercent,
    fetchHardware: subscribe, // 互換性維持: fetchHardware → subscribe
  };
};

// Helper functions
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function createDiskProgressBar(usedGb: number, totalGb: number): string {
  const percentage = totalGb > 0 ? (usedGb / totalGb) * 100 : 0;
  const filledBlocks = Math.round(percentage / 10);
  const emptyBlocks = 10 - filledBlocks;

  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
}

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
