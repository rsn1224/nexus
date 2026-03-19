# NEXUS v2 — ミューテーションテスト フィードバック

> **実行日:** 2026-03-20
> **ブランチ:** `feature/v2-optimize-core`
> **Stryker バージョン:** v4
> **実行時間:** 24 分 54 秒
> **テスト数:** 538 件

---

## 結果サマリー

| ファイル | Killed | Survived | Score | 判定 |
|---------|--------|----------|-------|------|
| `healthScore.ts` | 79 | 26 | **75.24%** | PASS |
| `suggestionEngine.ts` | 100 | 102 | **49.50%** | FAIL |
| 全体（lib/） | 650 | 675 | **49.06%** | — |

**合格ライン:** mutation score >= 70%

---

## healthScore.ts — 75.24%（PASS）

### 生き残りミュータント（26 件）の主要パターン

1. **Grade 判定の境界値ミューテーション（8 件）**
   - `score >= 90` → `score > 90` 等の境界条件変更が検出されない
   - 原因: IT テストが score の計算結果を間接的にテストしているため、特定の境界値スコアを生成する入力が困難

2. **段階的減点の中間値（10 件）**
   - `temp >= warnThreshold` → `temp > warnThreshold` の変更が検出されない
   - `points = 5` → `points = 4` の変更が検出されない
   - 原因: 中間値（warn 閾値ちょうど）のテストケースが不足

3. **label 生成ロジック（5 件）**
   - `pendingCount > 0` → `pendingCount >= 0` が検出されない
   - テンプレートリテラルの文字列変更が検出されない

4. **memUsageRatio 計算（3 件）**
   - `memTotalGb > 0` → `memTotalGb >= 0` が検出されない

### 追加すべきテスト

```typescript
// healthScore.test.ts に追加

// Grade 境界の直接テスト
it('GameMode + PowerPlan のみ有効で score=30 → Grade D', () => {
  const input = makeInput({
    gameModeEnabled: true,
    powerPlanHighPerf: true,
    timerResolutionLow: false,
    nagleDisabled: false,
    visualEffectsOff: false,
    cpuTemp: 95,
    gpuTemp: 95,
    memUsedGb: 31,
    memTotalGb: 32,
    bottleneckRatio: 0.8,
  });
  const result = calcHealthScore(input);
  expect(result.score).toBe(30);
  expect(result.grade).toBe('D');
});

// 段階的減点の中間値テスト
it('cpuTemp=80 のとき CPU 温度ファクターは 5 ポイント（warn 閾値）', () => {
  const result = calcHealthScore(makeInput({ cpuTemp: 80 }));
  const factor = result.factors.find(f => f.name.includes('CPU'));
  expect(factor?.points).toBe(5);
  expect(factor?.status).toBe('suboptimal');
});

it('cpuTemp=90 のとき CPU 温度ファクターは 0 ポイント（critical 閾値）', () => {
  const result = calcHealthScore(makeInput({ cpuTemp: 90 }));
  const factor = result.factors.find(f => f.name.includes('CPU'));
  expect(factor?.points).toBe(0);
  expect(factor?.status).toBe('critical');
});

// label テスト
it('全最適時の label は "最適" を含む', () => {
  const result = calcHealthScore(OPTIMAL_INPUT);
  expect(result.label).toContain('最適');
});

it('改善可能なとき label はポイント数を含む', () => {
  const result = calcHealthScore(makeInput({ gameModeEnabled: false }));
  expect(result.label).toContain('+15');
});

// memTotalGb = 0 のエッジケース
it('memTotalGb=0 のとき memUsageRatio は 0 として扱う', () => {
  const result = calcHealthScore(makeInput({ memUsedGb: 0, memTotalGb: 0 }));
  const factor = result.factors.find(f => f.name.includes('MEM'));
  expect(factor?.points).toBe(10);
});
```

---

## suggestionEngine.ts — 49.50%（FAIL）

### 生き残りミュータント（102 件）の主要パターン

1. **文字列リテラルのミューテーション（~60 件）**
   - `title`, `reason`, `impact`, `category` の文字列が変更されても検出されない
   - 原因: テストが `id` と `priority` のみを検証し、他フィールドの値を検証していない

2. **SuggestionAction の詳細（~25 件）**
   - `invokeCommand` の値（`'toggle_game_mode'` → `''`）が検出されない
   - `args` の値（`{ plan: 'high_performance' }` → `{}`）が検出されない
   - `isDestructive` のフラグ変更が検出されない
   - 原因: テストが `actions[0].invokeCommand` の存在のみチェックし、値を検証していない

3. **rollbackAction のミューテーション（~10 件）**
   - `canRollback: true` → `canRollback: false` が検出されない
   - `rollbackAction` の中身が検出されない

4. **category の割り当て（~7 件）**
   - `'windows_optimization'` → `''` が検出されない

### 追加すべきテスト

```typescript
// suggestionEngine.test.ts に追加

// === 文字列リテラル検証 ===

describe('SuggestionEngine: フィールド値の正確性', () => {
  it('game-mode の title が正しい', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: false }));
    const s = findSuggestion(suggestions, 'game-mode');
    expect(s?.title).toContain('Game Mode');
  });

  it('game-mode の category が windows_optimization', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: false }));
    const s = findSuggestion(suggestions, 'game-mode');
    expect(s?.category).toBe('windows_optimization');
  });

  it('game-mode の impact が "+15" を含む', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: false }));
    const s = findSuggestion(suggestions, 'game-mode');
    expect(s?.impact).toContain('+15');
  });

  it('power-plan の category が windows_optimization', () => {
    const suggestions = generateSuggestions(makeInput({ powerPlanHighPerf: false }));
    const s = findSuggestion(suggestions, 'power-plan');
    expect(s?.category).toBe('windows_optimization');
  });

  it('timer-res の category が timer_optimization', () => {
    const suggestions = generateSuggestions(makeInput({ timerResolutionLow: false }));
    const s = findSuggestion(suggestions, 'timer-res');
    expect(s?.category).toBe('timer_optimization');
  });

  it('nagle の category が network_optimization', () => {
    const suggestions = generateSuggestions(makeInput({ nagleDisabled: false }));
    const s = findSuggestion(suggestions, 'nagle');
    expect(s?.category).toBe('network_optimization');
  });

  it('cpu-thermal の category が thermal_warning', () => {
    const suggestions = generateSuggestions(makeInput({ cpuTemp: 90 }));
    const s = findSuggestion(suggestions, 'cpu-thermal');
    expect(s?.category).toBe('thermal_warning');
  });

  it('mem-pressure の category が memory_optimization', () => {
    const suggestions = generateSuggestions(makeInput({ memUsedGb: 28, memTotalGb: 32 }));
    const s = findSuggestion(suggestions, 'mem-pressure');
    expect(s?.category).toBe('memory_optimization');
  });

  it('bottleneck の category が process_optimization', () => {
    const suggestions = generateSuggestions(makeInput({ bottleneckRatio: 0.5 }));
    const s = findSuggestion(suggestions, 'bottleneck');
    expect(s?.category).toBe('process_optimization');
  });
});

// === SuggestionAction 検証 ===

describe('SuggestionEngine: Action の正確性', () => {
  it('game-mode の invokeCommand が toggle_game_mode', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: false }));
    const s = findSuggestion(suggestions, 'game-mode');
    expect(s?.actions[0].invokeCommand).toBe('toggle_game_mode');
  });

  it('power-plan の invokeCommand が set_power_plan', () => {
    const suggestions = generateSuggestions(makeInput({ powerPlanHighPerf: false }));
    const s = findSuggestion(suggestions, 'power-plan');
    expect(s?.actions[0].invokeCommand).toBe('set_power_plan');
    expect(s?.actions[0].args).toEqual({ plan: 'high_performance' });
  });

  it('timer-res の invokeCommand が set_timer_resolution', () => {
    const suggestions = generateSuggestions(makeInput({ timerResolutionLow: false }));
    const s = findSuggestion(suggestions, 'timer-res');
    expect(s?.actions[0].invokeCommand).toBe('set_timer_resolution');
    expect(s?.actions[0].args).toEqual({ resolution_100ns: 5000 });
  });

  it('nagle の invokeCommand が set_nagle_disabled', () => {
    const suggestions = generateSuggestions(makeInput({ nagleDisabled: false }));
    const s = findSuggestion(suggestions, 'nagle');
    expect(s?.actions[0].invokeCommand).toBe('set_nagle_disabled');
    expect(s?.actions[0].args).toEqual({ disabled: true });
  });

  it('visual-effects の invokeCommand が set_visual_effects', () => {
    const suggestions = generateSuggestions(makeInput({ visualEffectsOff: false }));
    const s = findSuggestion(suggestions, 'visual-effects');
    expect(s?.actions[0].invokeCommand).toBe('set_visual_effects');
    expect(s?.actions[0].args).toEqual({ effect: 'best_performance' });
  });

  it('mem-pressure の invokeCommand が manual_memory_cleanup', () => {
    const suggestions = generateSuggestions(makeInput({ memUsedGb: 28, memTotalGb: 32 }));
    const s = findSuggestion(suggestions, 'mem-pressure');
    expect(s?.actions[0].invokeCommand).toBe('manual_memory_cleanup');
  });

  it('cpu-thermal は actions が空（対処不可）', () => {
    const suggestions = generateSuggestions(makeInput({ cpuTemp: 90 }));
    const s = findSuggestion(suggestions, 'cpu-thermal');
    expect(s?.actions).toEqual([]);
  });

  it('bottleneck は actions が空（警告のみ）', () => {
    const suggestions = generateSuggestions(makeInput({ bottleneckRatio: 0.5 }));
    const s = findSuggestion(suggestions, 'bottleneck');
    expect(s?.actions).toEqual([]);
  });
});

// === Rollback 検証 ===

describe('SuggestionEngine: Rollback', () => {
  it('game-mode は canRollback=true', () => {
    const suggestions = generateSuggestions(makeInput({ gameModeEnabled: false }));
    const s = findSuggestion(suggestions, 'game-mode');
    expect(s?.canRollback).toBe(true);
    expect(s?.rollbackAction).not.toBeNull();
  });

  it('power-plan は canRollback=true + rollback args に balanced', () => {
    const suggestions = generateSuggestions(makeInput({ powerPlanHighPerf: false }));
    const s = findSuggestion(suggestions, 'power-plan');
    expect(s?.canRollback).toBe(true);
    expect(s?.rollbackAction?.args).toEqual({ plan: 'balanced' });
  });

  it('cpu-thermal は canRollback=false', () => {
    const suggestions = generateSuggestions(makeInput({ cpuTemp: 90 }));
    const s = findSuggestion(suggestions, 'cpu-thermal');
    expect(s?.canRollback).toBe(false);
    expect(s?.rollbackAction).toBeNull();
  });

  it('mem-pressure は canRollback=false', () => {
    const suggestions = generateSuggestions(makeInput({ memUsedGb: 28, memTotalGb: 32 }));
    const s = findSuggestion(suggestions, 'mem-pressure');
    expect(s?.canRollback).toBe(false);
  });
});

// === heavy-process ルール ===

describe('SuggestionEngine: heavy-process ルール', () => {
  it('heavyProcessCount=3 のとき recommended 提案が生成される', () => {
    const suggestions = generateSuggestions(OPTIMAL_INPUT, 3);
    const s = findSuggestion(suggestions, 'heavy-process');
    expect(s).toBeDefined();
    expect(s?.priority).toBe('recommended');
    expect(s?.actions[0].invokeCommand).toBe('run_boost');
  });

  it('heavyProcessCount=2 のとき生成されない', () => {
    const suggestions = generateSuggestions(OPTIMAL_INPUT, 2);
    const s = findSuggestion(suggestions, 'heavy-process');
    expect(s).toBeUndefined();
  });

  it('heavyProcessCount=0（デフォルト）のとき生成されない', () => {
    const suggestions = generateSuggestions(OPTIMAL_INPUT);
    const s = findSuggestion(suggestions, 'heavy-process');
    expect(s).toBeUndefined();
  });
});
```

---

## 改善ロードマップ

| 優先度 | 対象 | 追加テスト数 | 予想スコア改善 |
|--------|------|------------|--------------|
| 高 | suggestionEngine: category 検証 | 9 | +7% |
| 高 | suggestionEngine: invokeCommand + args 検証 | 8 | +12% |
| 高 | suggestionEngine: rollback 検証 | 4 | +5% |
| 高 | suggestionEngine: heavy-process ルール | 3 | +3% |
| 中 | healthScore: 段階的減点の中間値 | 3 | +4% |
| 中 | healthScore: label 検証 | 2 | +2% |
| 低 | healthScore: memTotalGb=0 エッジケース | 1 | +1% |

**予想スコア改善後:**
- healthScore.ts: 75% → ~82%
- suggestionEngine.ts: 49% → ~76%

---

*End of mutation-feedback.md*
