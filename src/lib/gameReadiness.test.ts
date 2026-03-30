import { describe, expect, it } from 'vitest';
import { calcReadiness, getRankStyle, type ReadinessInput } from './gameReadiness';

const baseInput: ReadinessInput = {
  cpuPercent: 30,
  memUsedMb: 8000,
  memTotalMb: 16000,
  gpuUsagePercent: 20,
  gpuTempC: 65,
  diskUsagePercent: 50,
  isProfileApplied: false,
  boostLevel: 'none',
  timerState: null,
  affinityConfigured: false,
  frameTime: null,
};

describe('calcReadiness', () => {
  it('ゲーム非実行時にリソース + 最適化の2軸で計算する', () => {
    const result = calcReadiness(baseInput);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.axes.performance).toBe(-1); // N/A
  });

  it('全最適化適用時にスコアが高くなる', () => {
    const optimized: ReadinessInput = {
      ...baseInput,
      isProfileApplied: true,
      boostLevel: 'hard',
      timerState: {
        current100ns: 5000,
        nexusRequested100ns: 5000,
        default100ns: 156250,
        minimum100ns: 5000,
        maximum100ns: 156250,
      },
      affinityConfigured: true,
    };
    const result = calcReadiness(optimized);
    const resultBase = calcReadiness(baseInput);
    expect(result.total).toBeGreaterThan(resultBase.total);
  });

  it('ゲーム実行中はフレームタイムが反映される', () => {
    const gaming: ReadinessInput = {
      ...baseInput,
      isProfileApplied: true,
      boostLevel: 'medium',
      frameTime: {
        pid: 1234,
        processName: 'game.exe',
        avgFps: 144,
        pct1Low: 120,
        pct01Low: 90,
        stutterCount: 0,
        lastFrameTimeMs: 6.9,
        frameTimes: [],
        timestamp: Date.now(),
      },
    };
    const result = calcReadiness(gaming);
    expect(result.axes.performance).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it('高 CPU でリソーススコアが下がる', () => {
    const highCpu = calcReadiness({ ...baseInput, cpuPercent: 95 });
    const lowCpu = calcReadiness({ ...baseInput, cpuPercent: 10 });
    expect(highCpu.axes.resource).toBeLessThan(lowCpu.axes.resource);
  });

  it('スタッター多発で推奨事項が生成される', () => {
    const stuttery: ReadinessInput = {
      ...baseInput,
      frameTime: {
        pid: 1234,
        processName: 'game.exe',
        avgFps: 60,
        pct1Low: 20,
        pct01Low: 10,
        stutterCount: 10,
        lastFrameTimeMs: 16.6,
        frameTimes: [],
        timestamp: Date.now(),
      },
    };
    const result = calcReadiness(stuttery);
    expect(result.recommendations.some((r) => r.id === 'stutter')).toBe(true);
  });

  it('プロファイル未適用で推奨事項が生成される', () => {
    const result = calcReadiness(baseInput);
    expect(result.recommendations.some((r) => r.id === 'no-profile')).toBe(true);
  });

  it('全データ null でもクラッシュしない', () => {
    const empty: ReadinessInput = {
      cpuPercent: null,
      memUsedMb: null,
      memTotalMb: null,
      gpuUsagePercent: null,
      gpuTempC: null,
      diskUsagePercent: null,
      isProfileApplied: false,
      boostLevel: 'none',
      timerState: null,
      affinityConfigured: false,
      frameTime: null,
    };
    const result = calcReadiness(empty);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it('スコアが 0〜100 にクランプされる', () => {
    const result = calcReadiness(baseInput);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.axes.resource).toBeGreaterThanOrEqual(0);
    expect(result.axes.resource).toBeLessThanOrEqual(100);
  });
});

describe('getRankStyle', () => {
  it('READY ランクのスタイルを返す', () => {
    const style = getRankStyle('READY');
    expect(style.label).toBe('GAME READY');
    expect(style.className).toContain('success');
  });

  it('NOT_READY ランクのスタイルを返す', () => {
    const style = getRankStyle('NOT_READY');
    expect(style.label).toBe('NOT READY');
    expect(style.className).toContain('danger');
  });
});
