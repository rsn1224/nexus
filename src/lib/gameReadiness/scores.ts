import type { FrameTimeSnapshot } from '../../types';
import { assertNever } from '../../types';
import {
  GPU_TEMP_SCORE_CRITICAL_C,
  GPU_TEMP_SCORE_GOOD_C,
  GPU_TEMP_SCORE_WARN_C,
  TIMER_100NS_PER_MS,
} from '../constants';
import type { ReadinessInput } from './types';

export function calcResourceScore(input: ReadinessInput): number {
  let factors = 0;
  let sum = 0;

  if (input.cpuPercent !== null) {
    sum += Math.max(0, 100 - input.cpuPercent);
    factors++;
  }

  if (input.memUsedMb !== null && input.memTotalMb !== null && input.memTotalMb > 0) {
    const memPercent = (input.memUsedMb / input.memTotalMb) * 100;
    sum += Math.max(0, 100 - memPercent);
    factors++;
  }

  if (input.gpuUsagePercent !== null) {
    sum += Math.max(0, 100 - input.gpuUsagePercent);
    factors++;
  }

  if (input.gpuTempC !== null) {
    const tempScore =
      input.gpuTempC < GPU_TEMP_SCORE_GOOD_C
        ? 100
        : input.gpuTempC < GPU_TEMP_SCORE_WARN_C
          ? 80
          : input.gpuTempC < GPU_TEMP_SCORE_CRITICAL_C
            ? 50
            : 20;
    sum += tempScore;
    factors++;
  }

  if (input.diskUsagePercent !== null) {
    sum += Math.max(0, 100 - input.diskUsagePercent);
    factors++;
  }

  return factors > 0 ? sum / factors : 50;
}

export function calcOptimizationScore(input: ReadinessInput): number {
  let score = 0;

  if (input.isProfileApplied) {
    score += 30;
  }

  switch (input.boostLevel) {
    case 'hard':
      score += 30;
      break;
    case 'medium':
      score += 25;
      break;
    case 'soft':
      score += 15;
      break;
    case 'none':
      score += 0;
      break;
    default:
      return assertNever(input.boostLevel);
  }

  if (input.timerState?.nexusRequested100ns != null) {
    const ms = input.timerState.nexusRequested100ns / TIMER_100NS_PER_MS;
    if (ms <= 0.5) score += 20;
    else if (ms <= 1.0) score += 15;
    else if (ms <= 2.0) score += 10;
    else score += 5;
  }

  if (input.affinityConfigured) {
    score += 20;
  }

  return Math.min(100, score);
}

export function calcPerformanceScore(ft: FrameTimeSnapshot): number {
  let score = 0;

  if (ft.avgFps >= 144) score += 40;
  else if (ft.avgFps >= 120) score += 35;
  else if (ft.avgFps >= 60) score += 30;
  else if (ft.avgFps >= 30) score += 15;
  else score += 5;

  if (ft.avgFps > 0) {
    const ratio = ft.pct1Low / ft.avgFps;
    if (ratio >= 0.8) score += 30;
    else if (ratio >= 0.6) score += 20;
    else if (ratio >= 0.4) score += 10;
    else score += 5;
  }

  if (ft.stutterCount === 0) score += 30;
  else if (ft.stutterCount <= 2) score += 20;
  else if (ft.stutterCount <= 5) score += 10;

  return Math.min(100, score);
}
