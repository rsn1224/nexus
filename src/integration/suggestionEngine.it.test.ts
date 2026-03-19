/**
 * Suggestion Engine 統合テスト — spec.md §4.1 ベース
 * src/ 読み込み禁止。spec.md の仕様のみを根拠にテストケースを設計。
 */
import { describe, expect, it } from 'vitest';
// テスト対象 — public API のみ import
import { generateSuggestions } from '../lib/suggestionEngine';
import type { HealthInput, Suggestion } from '../types/v2';

// ---------------------------------------------------------------------------
// ヘルパー
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

function makeInput(overrides: Partial<HealthInput>): HealthInput {
  return { ...OPTIMAL_INPUT, ...overrides };
}

function findSuggestion(suggestions: Suggestion[], id: string): Suggestion | undefined {
  return suggestions.find((s) => s.id === id);
}

// ---------------------------------------------------------------------------
// spec.md: 全要因が最適なとき提案は生成されない
// ---------------------------------------------------------------------------
describe('SuggestionEngine: 最適状態', () => {
  it('全要因が最適なとき提案は空配列', () => {
    const suggestions = generateSuggestions(OPTIMAL_INPUT);
    expect(suggestions).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// spec.md: Rule ID = "game-mode"
// 条件: gameModeEnabled === false → Priority: critical
// ---------------------------------------------------------------------------
describe('SuggestionEngine: game-mode ルール', () => {
  it('gameModeEnabled=false のとき critical 提案 "game-mode" が生成される', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: false }));
    const s = findSuggestion(suggestions, 'game-mode');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('critical');
    expect(s?.isApplied).toBe(false);
  });

  it('gameModeEnabled=true のとき "game-mode" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: true }));
    const s = findSuggestion(suggestions, 'game-mode');
    expect(s).toBeUndefined();
  });

  it('"game-mode" 提案に actions が含まれる', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: false }));
    const s = findSuggestion(suggestions, 'game-mode');
    expect(s?.actions.length).toBeGreaterThan(0);
    expect(s?.actions[0].invokeCommand).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// spec.md: Rule ID = "power-plan"
// 条件: powerPlanHighPerf === false → Priority: critical
// ---------------------------------------------------------------------------
describe('SuggestionEngine: power-plan ルール', () => {
  it('powerPlanHighPerf=false のとき critical 提案 "power-plan" が生成される', () => {
    const suggestions = generateSuggestions(makeInput({ powerPlanHighPerf: false }));
    const s = findSuggestion(suggestions, 'power-plan');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('critical');
  });

  it('powerPlanHighPerf=true のとき "power-plan" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ powerPlanHighPerf: true }));
    const s = findSuggestion(suggestions, 'power-plan');
    expect(s).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// spec.md: Rule ID = "timer-res"
// 条件: timerResolutionLow === false → Priority: recommended
// ---------------------------------------------------------------------------
describe('SuggestionEngine: timer-res ルール', () => {
  it('timerResolutionLow=false のとき recommended 提案 "timer-res" が生成される', () => {
    const suggestions = generateSuggestions(makeInput({ timerResolutionLow: false }));
    const s = findSuggestion(suggestions, 'timer-res');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('recommended');
  });

  it('timerResolutionLow=true のとき "timer-res" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ timerResolutionLow: true }));
    const s = findSuggestion(suggestions, 'timer-res');
    expect(s).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// spec.md: Rule ID = "nagle"
// 条件: nagleDisabled === false → Priority: recommended
// ---------------------------------------------------------------------------
describe('SuggestionEngine: nagle ルール', () => {
  it('nagleDisabled=false のとき recommended 提案 "nagle" が生成される', () => {
    const suggestions = generateSuggestions(makeInput({ nagleDisabled: false }));
    const s = findSuggestion(suggestions, 'nagle');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('recommended');
  });

  it('nagleDisabled=true のとき "nagle" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ nagleDisabled: true }));
    const s = findSuggestion(suggestions, 'nagle');
    expect(s).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// spec.md: Rule ID = "visual-effects"
// 条件: visualEffectsOff === false → Priority: recommended
// ---------------------------------------------------------------------------
describe('SuggestionEngine: visual-effects ルール', () => {
  it('visualEffectsOff=false のとき recommended 提案 "visual-effects" が生成される', () => {
    const suggestions = generateSuggestions(makeInput({ visualEffectsOff: false }));
    const s = findSuggestion(suggestions, 'visual-effects');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('recommended');
  });

  it('visualEffectsOff=true のとき "visual-effects" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ visualEffectsOff: true }));
    const s = findSuggestion(suggestions, 'visual-effects');
    expect(s).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// spec.md: Rule ID = "cpu-thermal"
// 条件: cpuTemp >= 80 → Priority: critical
// ---------------------------------------------------------------------------
describe('SuggestionEngine: cpu-thermal ルール', () => {
  it('cpuTemp=95 のとき critical 提案 "cpu-thermal" が生成される', () => {
    const suggestions = generateSuggestions(makeInput({ cpuTemp: 95 }));
    const s = findSuggestion(suggestions, 'cpu-thermal');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('critical');
  });

  it('cpuTemp=80 のとき "cpu-thermal" 提案が生成される（境界値）', () => {
    const suggestions = generateSuggestions(makeInput({ cpuTemp: 80 }));
    const s = findSuggestion(suggestions, 'cpu-thermal');
    expect(s).toBeDefined();
  });

  it('cpuTemp=79 のとき "cpu-thermal" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ cpuTemp: 79 }));
    const s = findSuggestion(suggestions, 'cpu-thermal');
    expect(s).toBeUndefined();
  });

  it('cpuTemp=null のとき "cpu-thermal" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ cpuTemp: null }));
    const s = findSuggestion(suggestions, 'cpu-thermal');
    expect(s).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// spec.md: Rule ID = "gpu-thermal"
// 条件: gpuTemp >= 85 → Priority: critical
// ---------------------------------------------------------------------------
describe('SuggestionEngine: gpu-thermal ルール', () => {
  it('gpuTemp=90 のとき critical 提案 "gpu-thermal" が生成される', () => {
    const suggestions = generateSuggestions(makeInput({ gpuTemp: 90 }));
    const s = findSuggestion(suggestions, 'gpu-thermal');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('critical');
  });

  it('gpuTemp=85 のとき "gpu-thermal" 提案が生成される（境界値）', () => {
    const suggestions = generateSuggestions(makeInput({ gpuTemp: 85 }));
    const s = findSuggestion(suggestions, 'gpu-thermal');
    expect(s).toBeDefined();
  });

  it('gpuTemp=84 のとき "gpu-thermal" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ gpuTemp: 84 }));
    const s = findSuggestion(suggestions, 'gpu-thermal');
    expect(s).toBeUndefined();
  });

  it('gpuTemp=null のとき "gpu-thermal" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ gpuTemp: null }));
    const s = findSuggestion(suggestions, 'gpu-thermal');
    expect(s).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// spec.md: Rule ID = "mem-pressure"
// 条件: memUsageRatio >= 0.8 → Priority: recommended
// ---------------------------------------------------------------------------
describe('SuggestionEngine: mem-pressure ルール', () => {
  it('メモリ使用率 90% のとき recommended 提案 "mem-pressure" が生成される', () => {
    const suggestions = generateSuggestions(makeInput({ memUsedGb: 28.8, memTotalGb: 32 })); // 90%
    const s = findSuggestion(suggestions, 'mem-pressure');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('recommended');
  });

  it('メモリ使用率 80% のとき "mem-pressure" 提案が生成される（境界値）', () => {
    const suggestions = generateSuggestions(makeInput({ memUsedGb: 25.6, memTotalGb: 32 })); // 80%
    const s = findSuggestion(suggestions, 'mem-pressure');
    expect(s).toBeDefined();
  });

  it('メモリ使用率 50% のとき "mem-pressure" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ memUsedGb: 16, memTotalGb: 32 })); // 50%
    const s = findSuggestion(suggestions, 'mem-pressure');
    expect(s).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// spec.md: Rule ID = "bottleneck"
// 条件: bottleneckRatio >= 0.3 → Priority: critical
// ---------------------------------------------------------------------------
describe('SuggestionEngine: bottleneck ルール', () => {
  it('bottleneckRatio=0.5 のとき critical 提案 "bottleneck" が生成される', () => {
    const suggestions = generateSuggestions(makeInput({ bottleneckRatio: 0.5 }));
    const s = findSuggestion(suggestions, 'bottleneck');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('critical');
  });

  it('bottleneckRatio=0.3 のとき "bottleneck" 提案が生成される（境界値）', () => {
    const suggestions = generateSuggestions(makeInput({ bottleneckRatio: 0.3 }));
    const s = findSuggestion(suggestions, 'bottleneck');
    expect(s).toBeDefined();
  });

  it('bottleneckRatio=0.29 のとき "bottleneck" 提案は生成されない', () => {
    const suggestions = generateSuggestions(makeInput({ bottleneckRatio: 0.29 }));
    const s = findSuggestion(suggestions, 'bottleneck');
    expect(s).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// spec.md: 複数ルールの同時発火
// ---------------------------------------------------------------------------
describe('SuggestionEngine: 複数ルールの同時発火', () => {
  it('全要因が最悪のとき全ルール（thermal 含む）が発火する', () => {
    const input = makeInput({
      gameModeEnabled: false,
      powerPlanHighPerf: false,
      timerResolutionLow: false,
      nagleDisabled: false,
      visualEffectsOff: false,
      cpuTemp: 95,
      gpuTemp: 95,
      memUsedGb: 30,
      memTotalGb: 32,
      bottleneckRatio: 0.5,
    });
    const suggestions = generateSuggestions(input);

    expect(findSuggestion(suggestions, 'game-mode')).toBeDefined();
    expect(findSuggestion(suggestions, 'power-plan')).toBeDefined();
    expect(findSuggestion(suggestions, 'timer-res')).toBeDefined();
    expect(findSuggestion(suggestions, 'nagle')).toBeDefined();
    expect(findSuggestion(suggestions, 'visual-effects')).toBeDefined();
    expect(findSuggestion(suggestions, 'cpu-thermal')).toBeDefined();
    expect(findSuggestion(suggestions, 'gpu-thermal')).toBeDefined();
    expect(findSuggestion(suggestions, 'mem-pressure')).toBeDefined();
    expect(findSuggestion(suggestions, 'bottleneck')).toBeDefined();
  });

  it('critical 提案が recommended 提案より前にソートされる', () => {
    const input = makeInput({
      gameModeEnabled: false, // critical
      timerResolutionLow: false, // recommended
    });
    const suggestions = generateSuggestions(input);

    const criticalIdx = suggestions.findIndex((s) => s.priority === 'critical');
    const recommendedIdx = suggestions.findIndex((s) => s.priority === 'recommended');

    if (criticalIdx >= 0 && recommendedIdx >= 0) {
      expect(criticalIdx).toBeLessThan(recommendedIdx);
    }
  });
});

// ---------------------------------------------------------------------------
// spec.md: Suggestion の構造的整合性
// ---------------------------------------------------------------------------
describe('SuggestionEngine: Suggestion 構造', () => {
  it('各 Suggestion は必須フィールドを持つ', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: false }));
    const s = suggestions[0];

    expect(s.id).toBeDefined();
    expect(typeof s.id).toBe('string');
    expect(s.priority).toBeDefined();
    expect(s.title).toBeDefined();
    expect(typeof s.title).toBe('string');
    expect(s.reason).toBeDefined();
    expect(s.impact).toBeDefined();
    expect(s.category).toBeDefined();
    expect(s.actions).toBeDefined();
    expect(Array.isArray(s.actions)).toBe(true);
    expect(typeof s.isApplied).toBe('boolean');
    expect(typeof s.canRollback).toBe('boolean');
  });

  it('SuggestionAction は invokeCommand を持つ', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: false }));
    const s = findSuggestion(suggestions, 'game-mode');
    if (s && s.actions.length > 0) {
      expect(typeof s.actions[0].invokeCommand).toBe('string');
      expect(s.actions[0].invokeCommand.length).toBeGreaterThan(0);
    }
  });
});
