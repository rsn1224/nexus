/**
 * Optimize Preset 統合テスト — spec.md §4.2 ベース
 * src/ 読み込み禁止。spec.md の仕様のみを根拠にテストケースを設計。
 *
 * NOTE: プリセットデータは useOptimizeStore 内の PRESET_STEPS に定義されている。
 * IT では store の selectPreset() を呼んで steps を取得し、spec.md と照合する。
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useOptimizeStore } from '../stores/useOptimizeStore';
import type { OptimizePreset, OptimizeStep } from '../types/v2';

function getSteps(preset: OptimizePreset): OptimizeStep[] {
  useOptimizeStore.getState().selectPreset(preset);
  return useOptimizeStore.getState().steps;
}

beforeEach(() => {
  useOptimizeStore.setState({
    activePreset: null,
    steps: [],
    stepEnabled: {},
    lastResult: null,
    activeSection: 'optimize_all',
    optimizeAllConfig: {
      windows: true,
      process: true,
      network: true,
      memory: true,
      timer: true,
      cpu: true,
    },
    applying: false,
    error: null,
  });
});

// ---------------------------------------------------------------------------
// spec.md §4.2: Gaming Preset — 8 ステップ
// ---------------------------------------------------------------------------
describe('OptimizePreset: Gaming', () => {
  it('gaming プリセットは 8 ステップを持つ', () => {
    const steps = getSteps('gaming');
    expect(steps.length).toBe(8);
  });

  it('Game Mode ON は safe でデフォルト有効', () => {
    const steps = getSteps('gaming');
    const step = steps.find((s) => s.invokeCommand === 'toggle_game_mode');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('Power Plan → High Performance は safe でデフォルト有効', () => {
    const steps = getSteps('gaming');
    const step = steps.find((s) => s.invokeCommand === 'set_power_plan');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('Visual Effects → Best Performance は safe でデフォルト有効', () => {
    const steps = getSteps('gaming');
    const step = steps.find((s) => s.invokeCommand === 'set_visual_effects');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('Timer Resolution → 0.5ms は safe でデフォルト有効', () => {
    const steps = getSteps('gaming');
    const step = steps.find((s) => s.invokeCommand === 'set_timer_resolution');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('Memory Cleanup は safe でデフォルト有効', () => {
    const steps = getSteps('gaming');
    const step = steps.find((s) => s.invokeCommand === 'manual_memory_cleanup');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('Nagle → Disabled は medium でデフォルト無効', () => {
    const steps = getSteps('gaming');
    const step = steps.find((s) => s.invokeCommand === 'set_nagle_disabled');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('medium');
    expect(step?.defaultEnabled).toBe(false);
  });

  it('Boost は medium でデフォルト無効', () => {
    const steps = getSteps('gaming');
    const step = steps.find((s) => s.invokeCommand === 'run_boost');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('medium');
    expect(step?.defaultEnabled).toBe(false);
  });

  it('Core Parking → 0% は medium でデフォルト無効', () => {
    const steps = getSteps('gaming');
    const step = steps.find((s) => s.invokeCommand === 'set_core_parking');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('medium');
    expect(step?.defaultEnabled).toBe(false);
  });

  it('全 safe ステップがデフォルト有効である', () => {
    const steps = getSteps('gaming');
    const safeSteps = steps.filter((s) => s.risk === 'safe');
    expect(safeSteps.length).toBe(5);
    for (const step of safeSteps) {
      expect(step.defaultEnabled).toBe(true);
    }
  });

  it('全 medium ステップがデフォルト無効である', () => {
    const steps = getSteps('gaming');
    const mediumSteps = steps.filter((s) => s.risk === 'medium');
    expect(mediumSteps.length).toBe(3);
    for (const step of mediumSteps) {
      expect(step.defaultEnabled).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// spec.md §4.2: Power Save Preset — 3 ステップ
// ---------------------------------------------------------------------------
describe('OptimizePreset: Power Save', () => {
  it('powerSave プリセットは 3 ステップを持つ', () => {
    const steps = getSteps('powerSave');
    expect(steps.length).toBe(3);
  });

  it('Power Plan → Balanced が含まれる', () => {
    const steps = getSteps('powerSave');
    const step = steps.find((s) => s.invokeCommand === 'set_power_plan');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('Timer Resolution → Restore が含まれる', () => {
    const steps = getSteps('powerSave');
    const step = steps.find((s) => s.invokeCommand === 'restore_timer_resolution');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('Core Parking → Default が含まれる', () => {
    const steps = getSteps('powerSave');
    const step = steps.find((s) => s.invokeCommand === 'set_core_parking');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('全ステップが safe でデフォルト有効', () => {
    const steps = getSteps('powerSave');
    for (const step of steps) {
      expect(step.risk).toBe('safe');
      expect(step.defaultEnabled).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// spec.md §4.2: Streaming Preset — 3 ステップ
// ---------------------------------------------------------------------------
describe('OptimizePreset: Streaming', () => {
  it('streaming プリセットは 3 ステップを持つ', () => {
    const steps = getSteps('streaming');
    expect(steps.length).toBe(3);
  });

  it('Game Mode ON が含まれる', () => {
    const steps = getSteps('streaming');
    const step = steps.find((s) => s.invokeCommand === 'toggle_game_mode');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('Power Plan → High Performance が含まれる', () => {
    const steps = getSteps('streaming');
    const step = steps.find((s) => s.invokeCommand === 'set_power_plan');
    expect(step).toBeDefined();
  });

  it('Timer Resolution → 1.0ms が含まれる', () => {
    const steps = getSteps('streaming');
    const step = steps.find((s) => s.invokeCommand === 'set_timer_resolution');
    expect(step).toBeDefined();
    expect(step?.risk).toBe('safe');
    expect(step?.defaultEnabled).toBe(true);
  });

  it('全ステップが safe でデフォルト有効', () => {
    const steps = getSteps('streaming');
    for (const step of steps) {
      expect(step.risk).toBe('safe');
      expect(step.defaultEnabled).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 構造的整合性
// ---------------------------------------------------------------------------
describe('OptimizePreset: 構造的整合性', () => {
  const presets: OptimizePreset[] = ['gaming', 'powerSave', 'streaming'];

  for (const preset of presets) {
    it(`${preset} プリセットの全ステップが必須フィールドを持つ`, () => {
      const steps = getSteps(preset);
      for (const step of steps) {
        expect(typeof step.id).toBe('string');
        expect(step.id.length).toBeGreaterThan(0);
        expect(typeof step.label).toBe('string');
        expect(step.label.length).toBeGreaterThan(0);
        expect(typeof step.invokeCommand).toBe('string');
        expect(step.invokeCommand.length).toBeGreaterThan(0);
        expect(step.args).toBeDefined();
        expect(['safe', 'medium', 'high']).toContain(step.risk);
        expect(typeof step.defaultEnabled).toBe('boolean');
      }
    });
  }

  it('全プリセットでステップ ID が一意である', () => {
    for (const preset of presets) {
      const steps = getSteps(preset);
      const ids = steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
