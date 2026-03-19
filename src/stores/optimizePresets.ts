// ─── Optimize Preset Definitions (ADR-005 / docs/v2/spec.md §4.2) ────────────
import type { OptimizePreset, OptimizeStep } from '../types/v2';

const GAMING_STEPS: OptimizeStep[] = [
  {
    id: 'game-mode',
    label: 'Game Mode ON',
    invokeCommand: 'toggle_game_mode',
    args: {},
    risk: 'safe',
    defaultEnabled: true,
  },
  {
    id: 'power-plan-hp',
    label: '電源プラン → 高パフォーマンス',
    invokeCommand: 'set_power_plan',
    args: { plan: 'high_performance' },
    risk: 'safe',
    defaultEnabled: true,
  },
  {
    id: 'visual-perf',
    label: '視覚効果 → 最高パフォーマンス',
    invokeCommand: 'set_visual_effects',
    args: { effect: 'best_performance' },
    risk: 'safe',
    defaultEnabled: true,
  },
  {
    id: 'timer-05ms',
    label: 'Timer Resolution → 0.5ms',
    invokeCommand: 'set_timer_resolution',
    args: { resolution_100ns: 5000 },
    risk: 'safe',
    defaultEnabled: true,
  },
  {
    id: 'nagle-off',
    label: 'Nagle → 無効',
    invokeCommand: 'set_nagle_disabled',
    args: { disabled: true },
    risk: 'medium',
    defaultEnabled: false,
  },
  {
    id: 'boost',
    label: 'Boost（不要プロセス停止）',
    invokeCommand: 'run_boost',
    args: {},
    risk: 'medium',
    defaultEnabled: false,
  },
  {
    id: 'core-parking-0',
    label: 'Core Parking → 0%',
    invokeCommand: 'set_core_parking',
    args: { min_cores_percent: 0 },
    risk: 'medium',
    defaultEnabled: false,
  },
  {
    id: 'mem-cleanup',
    label: 'メモリクリーンアップ',
    invokeCommand: 'manual_memory_cleanup',
    args: {},
    risk: 'safe',
    defaultEnabled: true,
  },
];

const POWER_SAVE_STEPS: OptimizeStep[] = [
  {
    id: 'power-plan-bal',
    label: '電源プラン → バランス',
    invokeCommand: 'set_power_plan',
    args: { plan: 'balanced' },
    risk: 'safe',
    defaultEnabled: true,
  },
  {
    id: 'timer-restore',
    label: 'Timer Resolution → 復元',
    invokeCommand: 'restore_timer_resolution',
    args: {},
    risk: 'safe',
    defaultEnabled: true,
  },
  {
    id: 'core-parking-default',
    label: 'Core Parking → デフォルト',
    invokeCommand: 'set_core_parking',
    args: { min_cores_percent: 25 },
    risk: 'safe',
    defaultEnabled: true,
  },
];

const STREAMING_STEPS: OptimizeStep[] = [
  {
    id: 'game-mode-s',
    label: 'Game Mode ON',
    invokeCommand: 'toggle_game_mode',
    args: {},
    risk: 'safe',
    defaultEnabled: true,
  },
  {
    id: 'power-plan-hp-s',
    label: '電源プラン → 高パフォーマンス',
    invokeCommand: 'set_power_plan',
    args: { plan: 'high_performance' },
    risk: 'safe',
    defaultEnabled: true,
  },
  {
    id: 'timer-1ms',
    label: 'Timer Resolution → 1.0ms',
    invokeCommand: 'set_timer_resolution',
    args: { resolution_100ns: 10000 },
    risk: 'safe',
    defaultEnabled: true,
  },
];

export const PRESET_STEPS: Record<OptimizePreset, OptimizeStep[]> = {
  gaming: GAMING_STEPS,
  powerSave: POWER_SAVE_STEPS,
  streaming: STREAMING_STEPS,
};

export function buildEnabledMap(steps: OptimizeStep[]): Record<string, boolean> {
  return Object.fromEntries(steps.map((s) => [s.id, s.defaultEnabled]));
}
