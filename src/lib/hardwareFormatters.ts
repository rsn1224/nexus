import type { HardwareInfo } from '../types';

export const defaultHardwareInfo: HardwareInfo = {
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

export function formatUptime(seconds: number): string {
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

export function formatBootTime(bootTimeUnix: number): string {
  return new Date(bootTimeUnix * 1000).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateMemUsagePercent(usedGb: number, totalGb: number): number {
  return totalGb > 0 ? (usedGb / totalGb) * 100 : 0;
}
