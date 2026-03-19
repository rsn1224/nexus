import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { OptimizePreset } from '../types/v2';
import { buildEnabledMap, PRESET_STEPS } from './optimizePresets';
import type { OptimizeStore } from './types/optimizeStore';

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
