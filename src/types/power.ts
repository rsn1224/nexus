export interface PowerEstimate {
  cpuPowerW: number;
  gpuPowerW: number;
  gpuActualPowerW: number | null;
  totalEstimatedW: number;
  cpuTdpW: number;
  gpuTdpW: number;
  timestamp: number;
}

export interface EcoModeConfig {
  enabled: boolean;
  targetFps: number;
  ecoPowerPlan: string;
  electricityRateYen: number;
}

export interface MonthlyCostEstimate {
  normalMonthlyYen: number;
  ecoMonthlyYen: number;
  savingsYen: number;
  assumedHoursPerDay: number;
}

export interface RevertItem {
  category: string;
  label: string;
  success: boolean;
  detail: string;
}

export interface RevertAllResult {
  items: RevertItem[];
  total: number;
  successCount: number;
  failCount: number;
}
