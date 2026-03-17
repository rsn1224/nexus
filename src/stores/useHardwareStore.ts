import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { HardwareInfo } from '../types';

interface HardwareStore {
  info: HardwareInfo | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  fetchHardware: () => Promise<void>;
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

export const useHardwareStore = create<HardwareStore>((set, get) => ({
  info: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  fetchHardware: async () => {
    const { isLoading } = get();
    if (isLoading) return; // Prevent concurrent requests

    set({ isLoading: true, error: null });
    try {
      const info = await invoke<HardwareInfo>('get_hardware_info');
      set({
        info,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch hardware info';
      log.error({ err }, 'hardware fetch failed: %s', errorMessage);
      set({
        info: defaultHardwareInfo,
        error: errorMessage,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    }
  },
  clearError: () => {
    set({ error: null });
  },
}));

// Selectors for derived data
export const useHardwareData = () => {
  const { info, isLoading, error, fetchHardware } = useHardwareStore();

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

  return {
    info,
    isLoading,
    error,
    memUsagePercent,
    formattedUptime,
    formattedBootTime,
    fetchHardware,
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
  const filledBlocks = Math.round(percentage / 10); // 10% per block
  const emptyBlocks = 10 - filledBlocks;

  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
}
