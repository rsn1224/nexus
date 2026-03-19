import { describe, expect, it } from 'vitest';
import type { HealthInput } from '../types/v2';
import { calcHealthScore } from './healthScore';

const perfectInput: HealthInput = {
  gameModeEnabled: true,
  powerPlanHighPerf: true,
  timerResolutionLow: true,
  nagleDisabled: true,
  visualEffectsOff: true,
  cpuTemp: 60,
  gpuTemp: 70,
  cpuUsage: 20,
  gpuUsage: 30,
  memUsedGb: 8,
  memTotalGb: 32,
  bottleneckRatio: 0.05,
};

describe('calcHealthScore', () => {
  it('returns maximum score when all settings optimal', () => {
    const result = calcHealthScore(perfectInput);
    expect(result.score).toBe(100);
    expect(result.grade).toBe('S');
    expect(result.warnings).toHaveLength(0);
  });

  it('returns grade S for score >= 90', () => {
    const result = calcHealthScore(perfectInput);
    expect(result.grade).toBe('S');
  });

  it('deducts 15 points when gameModeEnabled false', () => {
    const input = { ...perfectInput, gameModeEnabled: false };
    const result = calcHealthScore(input);
    expect(result.score).toBe(85);
    expect(result.grade).toBe('A');
  });

  it('deducts 15 points when powerPlanHighPerf false', () => {
    const input = { ...perfectInput, powerPlanHighPerf: false };
    const result = calcHealthScore(input);
    expect(result.score).toBe(85);
  });

  it('deducts 10 points when timerResolutionLow false', () => {
    const input = { ...perfectInput, timerResolutionLow: false };
    const result = calcHealthScore(input);
    expect(result.score).toBe(90);
  });

  it('deducts 10 points when nagleDisabled false', () => {
    const input = { ...perfectInput, nagleDisabled: false };
    const result = calcHealthScore(input);
    expect(result.score).toBe(90);
  });

  it('deducts 10 points when visualEffectsOff false', () => {
    const input = { ...perfectInput, visualEffectsOff: false };
    const result = calcHealthScore(input);
    expect(result.score).toBe(90);
  });

  it('gives grade D when score < 40', () => {
    const input: HealthInput = {
      ...perfectInput,
      gameModeEnabled: false,
      powerPlanHighPerf: false,
      timerResolutionLow: false,
      nagleDisabled: false,
      visualEffectsOff: false,
      cpuTemp: 92,
      gpuTemp: 96,
    };
    const result = calcHealthScore(input);
    expect(result.grade).toBe('D');
  });

  it('adds cpu warning when temp >= 80', () => {
    const input = { ...perfectInput, cpuTemp: 82 };
    const result = calcHealthScore(input);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('CPU');
  });

  it('adds critical cpu factor when temp >= 90', () => {
    const input = { ...perfectInput, cpuTemp: 91 };
    const result = calcHealthScore(input);
    const cpuFactor = result.factors.find((f) => f.name === 'CPU 温度');
    expect(cpuFactor?.status).toBe('critical');
    expect(cpuFactor?.points).toBe(0);
  });

  it('adds gpu warning when temp >= 85', () => {
    const input = { ...perfectInput, gpuTemp: 86 };
    const result = calcHealthScore(input);
    expect(result.warnings.some((w) => w.includes('GPU'))).toBe(true);
  });

  it('deducts points for high memory usage', () => {
    const input = { ...perfectInput, memUsedGb: 26, memTotalGb: 32 };
    const result = calcHealthScore(input);
    expect(result.score).toBeLessThan(100);
    const memFactor = result.factors.find((f) => f.name === 'MEM 使用率');
    expect(memFactor?.status).toBe('suboptimal');
  });

  it('handles null cpuTemp gracefully (treats as optimal)', () => {
    const input = { ...perfectInput, cpuTemp: null };
    const result = calcHealthScore(input);
    const cpuFactor = result.factors.find((f) => f.name === 'CPU 温度');
    expect(cpuFactor?.status).toBe('optimal');
    expect(cpuFactor?.points).toBe(10);
  });

  it('label mentions improvement when pending factors exist', () => {
    const input = { ...perfectInput, gameModeEnabled: false };
    const result = calcHealthScore(input);
    expect(result.label).toContain('改善');
  });

  it('label is optimal message when no pending factors', () => {
    const result = calcHealthScore(perfectInput);
    expect(result.label).toContain('最適');
  });

  it('returns 9 factors total', () => {
    const result = calcHealthScore(perfectInput);
    expect(result.factors).toHaveLength(9);
  });

  it('handles zero total memory without crashing', () => {
    const input = { ...perfectInput, memUsedGb: 0, memTotalGb: 0 };
    expect(() => calcHealthScore(input)).not.toThrow();
  });
});
