import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { OptimizePreset, OptimizeStep } from '../types/v2';
import type { OptimizeStore } from './types/optimizeStore';

// =============================================================================
// プリセット定義（ADR-005 / docs/v2/spec.md §4.2）
// =============================================================================

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

const PRESET_STEPS: Record<OptimizePreset, OptimizeStep[]> = {
  gaming: GAMING_STEPS,
  powerSave: POWER_SAVE_STEPS,
  streaming: STREAMING_STEPS,
};

function buildEnabledMap(steps: OptimizeStep[]): Record<string, boolean> {
  return Object.fromEntries(steps.map((s) => [s.id, s.defaultEnabled]));
}

// =============================================================================
// useOptimizeStore
// =============================================================================

export const useOptimizeStore = create<OptimizeStore>((set, get) => ({
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

  selectPreset: (preset: OptimizePreset): void => {
    const steps = PRESET_STEPS[preset];
    log.info({ preset, stepCount: steps.length }, 'optimize: preset selected');
    set({ activePreset: preset, steps, stepEnabled: buildEnabledMap(steps) });
  },

  toggleStep: (stepId: string): void => {
    set((state) => ({
      stepEnabled: {
        ...state.stepEnabled,
        [stepId]: !state.stepEnabled[stepId],
      },
    }));
  },

  applyPreset: async (): Promise<void> => {
    const { activePreset, steps, stepEnabled } = get();
    if (!activePreset) return;

    set({ applying: true, error: null });
    const appliedSteps: string[] = [];
    const rollbackMap: Record<string, Record<string, unknown>> = {};

    try {
      for (const step of steps) {
        if (!stepEnabled[step.id]) continue;
        await invoke(step.invokeCommand, step.args);
        appliedSteps.push(step.id);
        rollbackMap[step.id] = step.args;
        log.info({ step: step.id, command: step.invokeCommand }, 'optimize: step applied');
      }

      set({
        applying: false,
        lastResult: {
          preset: activePreset,
          appliedSteps,
          timestamp: Date.now(),
          rollbackMap,
        },
      });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'optimize: applyPreset failed: %s', msg);
      set({ applying: false, error: msg });
    }
  },

  rollbackPreset: async (): Promise<void> => {
    const { lastResult } = get();
    if (!lastResult) return;

    set({ applying: true, error: null });
    try {
      const steps = PRESET_STEPS[lastResult.preset];
      for (const stepId of [...lastResult.appliedSteps].reverse()) {
        const step = steps.find((s) => s.id === stepId);
        if (!step) continue;
        await invoke(step.invokeCommand, lastResult.rollbackMap[stepId]);
        log.info({ step: stepId }, 'optimize: step rolled back');
      }
      set({ applying: false, lastResult: null });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'optimize: rollbackPreset failed: %s', msg);
      set({ applying: false, error: msg });
    }
  },

  setActiveSection: (section) => {
    set({ activeSection: section });
  },

  toggleOptimizeCategory: (category) => {
    set((state) => ({
      optimizeAllConfig: {
        ...state.optimizeAllConfig,
        [category]: !state.optimizeAllConfig[category],
      },
    }));
  },

  runOptimizeAll: async (): Promise<void> => {
    const { optimizeAllConfig } = get();
    set({ applying: true, error: null });

    const commands: Array<{ command: string; args: Record<string, unknown> }> = [];

    if (optimizeAllConfig.windows) {
      commands.push(
        { command: 'toggle_game_mode', args: {} },
        { command: 'set_power_plan', args: { plan: 'high_performance' } },
        { command: 'set_visual_effects', args: { effect: 'best_performance' } },
      );
    }
    if (optimizeAllConfig.process) {
      commands.push({ command: 'run_boost', args: {} });
    }
    if (optimizeAllConfig.network) {
      commands.push({ command: 'set_nagle_disabled', args: { disabled: true } });
    }
    if (optimizeAllConfig.memory) {
      commands.push({ command: 'manual_memory_cleanup', args: {} });
    }
    if (optimizeAllConfig.timer) {
      commands.push({ command: 'set_timer_resolution', args: { resolution_100ns: 5000 } });
    }
    if (optimizeAllConfig.cpu) {
      commands.push({ command: 'set_core_parking', args: { min_cores_percent: 0 } });
    }

    try {
      for (const { command, args } of commands) {
        await invoke(command, args);
        log.info({ command }, 'optimize: runOptimizeAll step done');
      }
      set({ applying: false });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'optimize: runOptimizeAll failed: %s', msg);
      set({ applying: false, error: msg });
    }
  },

  clearError: (): void => {
    set({ error: null });
  },
}));

// ─── useShallow セレクタ ───────────────────────────────────────────────────

export const useOptimizeState = () =>
  useOptimizeStore(
    useShallow((s) => ({
      activePreset: s.activePreset,
      steps: s.steps,
      stepEnabled: s.stepEnabled,
      lastResult: s.lastResult,
      activeSection: s.activeSection,
      optimizeAllConfig: s.optimizeAllConfig,
      applying: s.applying,
      error: s.error,
    })),
  );

export const useOptimizeActions = () =>
  useOptimizeStore(
    useShallow((s) => ({
      selectPreset: s.selectPreset,
      toggleStep: s.toggleStep,
      applyPreset: s.applyPreset,
      rollbackPreset: s.rollbackPreset,
      setActiveSection: s.setActiveSection,
      toggleOptimizeCategory: s.toggleOptimizeCategory,
      runOptimizeAll: s.runOptimizeAll,
      clearError: s.clearError,
    })),
  );
