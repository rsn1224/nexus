import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { OnboardingState } from './useOnboardingStore';
import { allTasksFinished, isOnboardingDone, useOnboardingStore } from './useOnboardingStore';

const STORAGE_KEY = 'nexus:onboarding:done';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    useOnboardingStore.getState().reset();
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  /** @AC AC-1: ステップ遷移 */
  describe('step navigation', () => {
    it('starts at step 1', () => {
      expect(useOnboardingStore.getState().currentStep).toBe(1);
    });

    it('nextStep advances by 1', () => {
      useOnboardingStore.getState().nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(2);
    });

    it('nextStep does not exceed step 4', () => {
      useOnboardingStore.getState().goToStep(4);
      useOnboardingStore.getState().nextStep();
      expect(useOnboardingStore.getState().currentStep).toBe(4);
    });

    it('goToStep jumps to specific step', () => {
      useOnboardingStore.getState().goToStep(3);
      expect(useOnboardingStore.getState().currentStep).toBe(3);
    });
  });

  /** @AC AC-2: タスクステータス管理 */
  describe('task status', () => {
    it('initializes all tasks as idle', () => {
      const { tasks } = useOnboardingStore.getState();
      expect(tasks.hardware.status).toBe('idle');
      expect(tasks.steam.status).toBe('idle');
      expect(tasks.settings.status).toBe('idle');
    });

    it('updates individual task status', () => {
      useOnboardingStore.getState().setTaskStatus('hardware', { status: 'running' });
      expect(useOnboardingStore.getState().tasks.hardware.status).toBe('running');
      expect(useOnboardingStore.getState().tasks.steam.status).toBe('idle');
    });

    it('stores error message on task failure', () => {
      useOnboardingStore.getState().setTaskStatus('steam', {
        status: 'error',
        error: 'Command not found',
      });
      const { steam } = useOnboardingStore.getState().tasks;
      expect(steam.status).toBe('error');
      expect(steam.error).toBe('Command not found');
    });
  });

  /** @AC AC-3: スキャン結果保存 */
  describe('scan results', () => {
    it('stores hardware info', () => {
      const mockHw = { cpuName: 'Test CPU' } as OnboardingState['scanResults']['hardware'];
      useOnboardingStore.getState().setScanResult('hardware', mockHw);
      expect(useOnboardingStore.getState().scanResults.hardware?.cpuName).toBe('Test CPU');
    });

    it('stores settings loaded flag', () => {
      useOnboardingStore.getState().setScanResult('settingsLoaded', true);
      expect(useOnboardingStore.getState().scanResults.settingsLoaded).toBe(true);
    });
  });

  /** @AC AC-4: オンボーディング完了フラグ */
  describe('completion', () => {
    it('completeOnboarding sets localStorage flag', () => {
      useOnboardingStore.getState().completeOnboarding();
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('skipOnboarding sets localStorage flag', () => {
      useOnboardingStore.getState().skipOnboarding();
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });
  });

  /** @AC AC-5: リセット */
  describe('reset', () => {
    it('resets to initial state', () => {
      useOnboardingStore.getState().goToStep(3);
      useOnboardingStore.getState().setTaskStatus('hardware', { status: 'done' });
      useOnboardingStore.getState().reset();

      const state = useOnboardingStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.tasks.hardware.status).toBe('idle');
    });
  });
});

describe('isOnboardingDone', () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('returns false when flag is not set', () => {
    expect(isOnboardingDone()).toBe(false);
  });

  it('returns true when flag is "true"', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    expect(isOnboardingDone()).toBe(true);
  });
});

describe('allTasksFinished', () => {
  it('returns false when any task is idle', () => {
    expect(
      allTasksFinished({
        hardware: { status: 'done' },
        steam: { status: 'idle' },
        settings: { status: 'done' },
      }),
    ).toBe(false);
  });

  it('returns false when any task is running', () => {
    expect(
      allTasksFinished({
        hardware: { status: 'done' },
        steam: { status: 'running' },
        settings: { status: 'done' },
      }),
    ).toBe(false);
  });

  it('returns true when all tasks are done', () => {
    expect(
      allTasksFinished({
        hardware: { status: 'done' },
        steam: { status: 'done' },
        settings: { status: 'done' },
      }),
    ).toBe(true);
  });

  it('returns true when tasks are mix of done and error', () => {
    expect(
      allTasksFinished({
        hardware: { status: 'done' },
        steam: { status: 'error', error: 'failed' },
        settings: { status: 'done' },
      }),
    ).toBe(true);
  });
});
