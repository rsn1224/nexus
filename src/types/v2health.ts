// ─── Health Score types (ADR-003) ────────────────────────────────────────────

export type HealthInput = {
  cpuUsage: number;
  gpuUsage: number;
  cpuTemp: number | null;
  gpuTemp: number | null;
  memUsedGb: number;
  memTotalGb: number;
  gameModeEnabled: boolean;
  powerPlanHighPerf: boolean;
  timerResolutionLow: boolean;
  nagleDisabled: boolean;
  visualEffectsOff: boolean;
  bottleneckRatio: number;
};

export type HealthFactorStatus = 'optimal' | 'suboptimal' | 'critical';

export type HealthFactor = {
  name: string;
  points: number;
  maxPoints: number;
  status: HealthFactorStatus;
};

export type HealthGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export type HealthScore = {
  score: number;
  grade: HealthGrade;
  factors: HealthFactor[];
  warnings: string[];
  label: string;
};
