// ─── Monitor Data types (ADR-007) ────────────────────────────────────────────

export type MonitorCpu = {
  usage: number;
  temperature: number | null;
  clock: number;
  coreCount: number;
};

export type MonitorGpu = {
  usage: number;
  temperature: number | null;
  clock: number;
  vramUsedMb: number;
  vramTotalMb: number;
};

export type MonitorMemory = {
  usedMb: number;
  totalMb: number;
  usage: number;
};

export type MonitorFps = {
  current: number;
  avg: number;
  low1: number;
  frametime: number;
};

export type MonitorSample = {
  timestamp: number;
  cpu: MonitorCpu;
  gpu: MonitorGpu;
  memory: MonitorMemory;
  fps: MonitorFps;
};
