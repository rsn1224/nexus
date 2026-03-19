import type { FrameTimeSnapshot, TimerResolutionState } from '../../types';

export interface ReadinessInput {
  cpuPercent: number | null;
  memUsedMb: number | null;
  memTotalMb: number | null;
  gpuUsagePercent: number | null;
  gpuTempC: number | null;
  diskUsagePercent: number | null;

  isProfileApplied: boolean;
  boostLevel: 'none' | 'soft' | 'medium' | 'hard';
  timerState: TimerResolutionState | null;
  affinityConfigured: boolean;

  frameTime: FrameTimeSnapshot | null;
}

export interface ReadinessResult {
  total: number;
  axes: {
    resource: number;
    optimization: number;
    performance: number;
  };
  rank: ReadinessRank;
  recommendations: Recommendation[];
}

export type ReadinessRank = 'READY' | 'GOOD' | 'FAIR' | 'NOT_READY';

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
}
