export interface HardwareInfo {
  cpuName: string;
  cpuCores: number;
  cpuThreads: number;
  cpuBaseGhz: number;
  cpuTempC: number | null;
  memTotalGb: number;
  memUsedGb: number;
  osName: string;
  osVersion: string;
  hostname: string;
  uptimeSecs: number;
  bootTimeUnix: number;
  disks: DiskInfo[];
  gpuName: string | null;
  gpuVramTotalMb: number | null;
  gpuVramUsedMb: number | null;
  gpuTempC: number | null;
  gpuUsagePercent: number | null;
}

export interface DiskInfo {
  mount: string;
  kind: string;
  totalGb: number;
  usedGb: number;
}

export interface CpuTopology {
  physicalCores: number;
  logicalCores: number;
  pCores: number[];
  eCores: number[];
  ccdGroups: number[][];
  hyperthreadingEnabled: boolean;
  vendorId: string;
  brand: string;
}

export type ThermalAlertLevel = 'Warning' | 'Critical' | 'Normal';

export interface ThermalAlert {
  component: string; // "CPU" or "GPU"
  level: ThermalAlertLevel;
  currentTempC: number;
  thresholdC: number;
  message: string;
  timestamp: number;
}

export interface CurrentPowerPlan {
  name: string;
  guid: string;
}
