import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useOptimizeStore } from './useOptimizeStore';

function resetStore(): void {
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
      cpu: false,
    },
    applying: false,
    error: null,
  });
}

describe('useOptimizeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const s = useOptimizeStore.getState();
    expect(s.activePreset).toBeNull();
    expect(s.steps).toHaveLength(0);
    expect(s.applying).toBe(false);
    expect(s.error).toBeNull();
  });

  it('selectPreset loads steps for gaming preset', () => {
    useOptimizeStore.getState().selectPreset('gaming');
    const { activePreset, steps, stepEnabled } = useOptimizeStore.getState();
    expect(activePreset).toBe('gaming');
    expect(steps.length).toBeGreaterThan(0);
    const gameModeStep = steps.find((s) => s.id === 'game-mode');
    expect(gameModeStep).toBeDefined();
    expect(stepEnabled['game-mode']).toBe(true);
  });

  it('selectPreset loads steps for powerSave preset', () => {
    useOptimizeStore.getState().selectPreset('powerSave');
    const { activePreset, steps } = useOptimizeStore.getState();
    expect(activePreset).toBe('powerSave');
    expect(steps.length).toBeGreaterThan(0);
  });

  it('selectPreset loads steps for streaming preset', () => {
    useOptimizeStore.getState().selectPreset('streaming');
    const { activePreset, steps } = useOptimizeStore.getState();
    expect(activePreset).toBe('streaming');
    expect(steps.length).toBeGreaterThan(0);
  });

  it('toggleStep flips step enabled state', () => {
    useOptimizeStore.getState().selectPreset('gaming');
    const before = useOptimizeStore.getState().stepEnabled['game-mode'];
    useOptimizeStore.getState().toggleStep('game-mode');
    const after = useOptimizeStore.getState().stepEnabled['game-mode'];
    expect(after).toBe(!before);
  });

  it('applyPreset calls invoke for each enabled step', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    useOptimizeStore.getState().selectPreset('gaming');
    const { stepEnabled, steps } = useOptimizeStore.getState();
    const enabledCount = steps.filter((s) => stepEnabled[s.id]).length;

    await useOptimizeStore.getState().applyPreset();

    expect(invoke).toHaveBeenCalledTimes(enabledCount);
    expect(useOptimizeStore.getState().lastResult).not.toBeNull();
    expect(useOptimizeStore.getState().applying).toBe(false);
  });

  it('applyPreset does not invoke disabled steps', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    useOptimizeStore.getState().selectPreset('gaming');
    // disable all steps
    const { steps } = useOptimizeStore.getState();
    for (const step of steps) {
      useOptimizeStore.setState((s) => ({ stepEnabled: { ...s.stepEnabled, [step.id]: false } }));
    }

    await useOptimizeStore.getState().applyPreset();

    expect(invoke).not.toHaveBeenCalled();
    expect(useOptimizeStore.getState().lastResult?.appliedSteps).toHaveLength(0);
  });

  it('applyPreset sets error on invoke failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('admin required'));
    useOptimizeStore.getState().selectPreset('gaming');

    await useOptimizeStore.getState().applyPreset();

    expect(useOptimizeStore.getState().error).toBe('admin required');
    expect(useOptimizeStore.getState().applying).toBe(false);
  });

  it('applyPreset does nothing when no preset selected', async () => {
    await useOptimizeStore.getState().applyPreset();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('rollbackPreset calls invoke in reverse order and clears lastResult', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    useOptimizeStore.setState({
      lastResult: {
        preset: 'gaming',
        appliedSteps: ['game-mode', 'power-plan-hp'],
        timestamp: Date.now(),
        rollbackMap: {
          'game-mode': {},
          'power-plan-hp': { plan: 'high_performance' },
        },
      },
    });

    await useOptimizeStore.getState().rollbackPreset();

    expect(invoke).toHaveBeenCalledTimes(2);
    expect(useOptimizeStore.getState().lastResult).toBeNull();
    expect(useOptimizeStore.getState().applying).toBe(false);
  });

  it('rollbackPreset does nothing when no lastResult', async () => {
    await useOptimizeStore.getState().rollbackPreset();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('clearError resets error to null', () => {
    useOptimizeStore.setState({ error: 'previous error' });
    useOptimizeStore.getState().clearError();
    expect(useOptimizeStore.getState().error).toBeNull();
  });

  it('setActiveSection updates activeSection', () => {
    useOptimizeStore.getState().setActiveSection('network');
    expect(useOptimizeStore.getState().activeSection).toBe('network');
  });

  it('toggleOptimizeCategory toggles the category flag', () => {
    const before = useOptimizeStore.getState().optimizeAllConfig.windows;
    useOptimizeStore.getState().toggleOptimizeCategory('windows');
    expect(useOptimizeStore.getState().optimizeAllConfig.windows).toBe(!before);
  });
});
