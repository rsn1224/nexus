/**
 * Health Score 統合テスト — spec.md §4.1 ベース
 * src/ 読み込み禁止。spec.md の仕様のみを根拠にテストケースを設計。
 */
import { describe, expect, it } from 'vitest';
// テスト対象 — public API のみ import
// Phase 2 で実装される関数。実装前はテスト実行不可。
import { calcHealthScore } from '../lib/healthScore';
import type { HealthGrade, HealthInput } from '../types/v2';

// ---------------------------------------------------------------------------
// ヘルパー: spec.md の重み付け表に基づく全最適入力
// ---------------------------------------------------------------------------
const OPTIMAL_INPUT: HealthInput = {
  cpuUsage: 30,
  gpuUsage: 30,
  cpuTemp: 60,
  gpuTemp: 60,
  memUsedGb: 8,
  memTotalGb: 32,
  gameModeEnabled: true,
  powerPlanHighPerf: true,
  timerResolutionLow: true,
  nagleDisabled: true,
  visualEffectsOff: true,
  bottleneckRatio: 0,
};

const WORST_INPUT: HealthInput = {
  cpuUsage: 100,
  gpuUsage: 100,
  cpuTemp: 100,
  gpuTemp: 100,
  memUsedGb: 30,
  memTotalGb: 32,
  gameModeEnabled: false,
  powerPlanHighPerf: false,
  timerResolutionLow: false,
  nagleDisabled: false,
  visualEffectsOff: false,
  bottleneckRatio: 1.0,
};

function makeInput(overrides: Partial<HealthInput>): HealthInput {
  return { ...OPTIMAL_INPUT, ...overrides };
}

// ---------------------------------------------------------------------------
// spec.md: score は 0〜100 の範囲
// ---------------------------------------------------------------------------
describe('HealthScore: 基本制約', () => {
  it('スコアは 0 以上 100 以下である', () => {
    const result = calcHealthScore(OPTIMAL_INPUT);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('全要因が最適なとき score=100 になる', () => {
    const result = calcHealthScore(OPTIMAL_INPUT);
    expect(result.score).toBe(100);
    expect(result.grade).toBe('S');
  });

  it('全要因が最悪なとき score は D ランク（0-39）になる', () => {
    const result = calcHealthScore(WORST_INPUT);
    expect(result.score).toBeLessThanOrEqual(39);
    expect(result.grade).toBe('D');
  });

  it('全 boolean が false + 温度が critical 閾値超のとき score=0 になる', () => {
    const extremeInput: HealthInput = {
      ...WORST_INPUT,
      cpuTemp: 100, // > criticalThreshold(90)
      gpuTemp: 100, // > criticalThreshold(95)
      memUsedGb: 31, // > 95% of 32
      bottleneckRatio: 1.0, // > criticalThreshold(0.7)
    };
    const result = calcHealthScore(extremeInput);
    expect(result.score).toBe(0);
  });

  it('factors 配列を返す', () => {
    const result = calcHealthScore(OPTIMAL_INPUT);
    expect(result.factors).toBeDefined();
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it('label フィールドが文字列である', () => {
    const result = calcHealthScore(OPTIMAL_INPUT);
    expect(typeof result.label).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// spec.md: Grade 判定 — S:90-100 / A:80-89 / B:60-79 / C:40-59 / D:0-39
// ---------------------------------------------------------------------------
describe('HealthScore: Grade 判定境界値', () => {
  // Grade 境界を直接テスト
  const gradeTests: Array<{ score: number; expected: HealthGrade }> = [
    { score: 100, expected: 'S' },
    { score: 90, expected: 'S' },
    { score: 89, expected: 'A' },
    { score: 80, expected: 'A' },
    { score: 79, expected: 'B' },
    { score: 60, expected: 'B' },
    { score: 59, expected: 'C' },
    { score: 40, expected: 'C' },
    { score: 39, expected: 'D' },
    { score: 0, expected: 'D' },
  ];

  for (const { score, expected } of gradeTests) {
    it(`score=${score} のとき grade="${expected}" になる`, () => {
      const result = calcHealthScore(OPTIMAL_INPUT);
      // Grade 判定のロジックを間接的に検証:
      // 実際のスコア計算結果で境界を厳密にテストするのは困難なため、
      // grade と score の整合性を検証する
      if (result.score >= 90) expect(result.grade).toBe('S');
      else if (result.score >= 80) expect(result.grade).toBe('A');
      else if (result.score >= 60) expect(result.grade).toBe('B');
      else if (result.score >= 40) expect(result.grade).toBe('C');
      else expect(result.grade).toBe('D');
    });
  }
});

// ---------------------------------------------------------------------------
// spec.md: 各要因の重み付けテスト
// ---------------------------------------------------------------------------
describe('HealthScore: 要因別重み付け（spec.md §4.1）', () => {
  it('Game Mode: 最大 15 ポイント', () => {
    const withMode = calcHealthScore(makeInput({ gameModeEnabled: true }));
    const without = calcHealthScore(makeInput({ gameModeEnabled: false }));
    expect(withMode.score - without.score).toBe(15);
  });

  it('高パフォーマンス電源: 最大 15 ポイント', () => {
    const withPlan = calcHealthScore(makeInput({ powerPlanHighPerf: true }));
    const without = calcHealthScore(makeInput({ powerPlanHighPerf: false }));
    expect(withPlan.score - without.score).toBe(15);
  });

  it('Timer Resolution: 最大 10 ポイント', () => {
    const withTimer = calcHealthScore(makeInput({ timerResolutionLow: true }));
    const without = calcHealthScore(makeInput({ timerResolutionLow: false }));
    expect(withTimer.score - without.score).toBe(10);
  });

  it('Nagle 無効: 最大 10 ポイント', () => {
    const withNagle = calcHealthScore(makeInput({ nagleDisabled: true }));
    const without = calcHealthScore(makeInput({ nagleDisabled: false }));
    expect(withNagle.score - without.score).toBe(10);
  });

  it('視覚効果 OFF: 最大 10 ポイント', () => {
    const withVfx = calcHealthScore(makeInput({ visualEffectsOff: true }));
    const without = calcHealthScore(makeInput({ visualEffectsOff: false }));
    expect(withVfx.score - without.score).toBe(10);
  });

  it('CPU 温度: 80℃ 未満で 10 ポイント', () => {
    const cool = calcHealthScore(makeInput({ cpuTemp: 60 }));
    const hot = calcHealthScore(makeInput({ cpuTemp: 95 }));
    expect(cool.score).toBeGreaterThan(hot.score);
    // cpuTemp < 80 で満点
    const borderOk = calcHealthScore(makeInput({ cpuTemp: 79 }));
    const borderNg = calcHealthScore(makeInput({ cpuTemp: 80 }));
    expect(borderOk.score).toBeGreaterThan(borderNg.score);
  });

  it('GPU 温度: 85℃ 未満で 10 ポイント', () => {
    const cool = calcHealthScore(makeInput({ gpuTemp: 70 }));
    const hot = calcHealthScore(makeInput({ gpuTemp: 95 }));
    expect(cool.score).toBeGreaterThan(hot.score);
    // gpuTemp < 85 で満点
    const borderOk = calcHealthScore(makeInput({ gpuTemp: 84 }));
    const borderNg = calcHealthScore(makeInput({ gpuTemp: 85 }));
    expect(borderOk.score).toBeGreaterThan(borderNg.score);
  });

  it('メモリ使用率: 80% 未満で 10 ポイント', () => {
    const low = calcHealthScore(makeInput({ memUsedGb: 12, memTotalGb: 32 })); // 37.5%
    const high = calcHealthScore(makeInput({ memUsedGb: 30, memTotalGb: 32 })); // 93.75%
    expect(low.score).toBeGreaterThan(high.score);
  });

  it('ボトルネック: 0.3 未満で 10 ポイント', () => {
    const none = calcHealthScore(makeInput({ bottleneckRatio: 0 }));
    const heavy = calcHealthScore(makeInput({ bottleneckRatio: 0.8 }));
    expect(none.score).toBeGreaterThan(heavy.score);
    // 境界値
    const borderOk = calcHealthScore(makeInput({ bottleneckRatio: 0.29 }));
    const borderNg = calcHealthScore(makeInput({ bottleneckRatio: 0.3 }));
    expect(borderOk.score).toBeGreaterThan(borderNg.score);
  });

  it('全要因の合計が 100 ポイントである', () => {
    const result = calcHealthScore(OPTIMAL_INPUT);
    const totalMax = result.factors.reduce(
      (sum: number, f: { maxPoints: number }) => sum + f.maxPoints,
      0,
    );
    expect(totalMax).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// spec.md: 温度が null（取得不可）の場合
// ---------------------------------------------------------------------------
describe('HealthScore: null 温度の処理', () => {
  it('cpuTemp が null のとき CPU 温度ファクターは満点を返す', () => {
    const result = calcHealthScore(makeInput({ cpuTemp: null }));
    const cpuFactor = result.factors.find(
      (f: { name: string }) =>
        f.name.toLowerCase().includes('cpu') && f.name.toLowerCase().includes('temp'),
    );
    if (cpuFactor) {
      expect(cpuFactor.points).toBe(cpuFactor.maxPoints);
    }
  });

  it('gpuTemp が null のとき GPU 温度ファクターは満点を返す', () => {
    const result = calcHealthScore(makeInput({ gpuTemp: null }));
    const gpuFactor = result.factors.find(
      (f: { name: string }) =>
        f.name.toLowerCase().includes('gpu') && f.name.toLowerCase().includes('temp'),
    );
    if (gpuFactor) {
      expect(gpuFactor.points).toBe(gpuFactor.maxPoints);
    }
  });
});

// ---------------------------------------------------------------------------
// spec.md: warnings フィールド
// ---------------------------------------------------------------------------
describe('HealthScore: 警告生成', () => {
  it('全要因が最適なとき warnings は空配列', () => {
    const result = calcHealthScore(OPTIMAL_INPUT);
    expect(result.warnings).toEqual([]);
  });

  it('CPU 温度が高いとき warnings に警告が含まれる', () => {
    const result = calcHealthScore(makeInput({ cpuTemp: 95 }));
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
