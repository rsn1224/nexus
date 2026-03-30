import { create } from 'zustand';
import log from '../lib/logger';
import type { HardwareInfo } from '../types';

// ============================================================
// SECTION: Types
// ============================================================

type OnboardingStep = 1 | 2 | 3 | 4;

interface ScanResults {
  hardware: HardwareInfo | null;
  steamGames: SteamGameSummary[] | null;
  settingsLoaded: boolean;
}

interface SteamGameSummary {
  name: string;
  appId: string;
}

interface TaskStatus {
  status: 'idle' | 'running' | 'done' | 'error';
  error?: string;
}

interface OnboardingState {
  currentStep: OnboardingStep;
  scanResults: ScanResults;
  tasks: {
    hardware: TaskStatus;
    steam: TaskStatus;
    settings: TaskStatus;
  };

  nextStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  setTaskStatus: (task: keyof OnboardingState['tasks'], status: TaskStatus) => void;
  setScanResult: <K extends keyof ScanResults>(key: K, value: ScanResults[K]) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  reset: () => void;
}

// ============================================================
// SECTION: Constants
// ============================================================

const STORAGE_KEY = 'nexus:onboarding:done';

const INITIAL_TASKS: OnboardingState['tasks'] = {
  hardware: { status: 'idle' },
  steam: { status: 'idle' },
  settings: { status: 'idle' },
};

const INITIAL_SCAN: ScanResults = {
  hardware: null,
  steamGames: null,
  settingsLoaded: false,
};

// ============================================================
// SECTION: Store
// ============================================================

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  scanResults: { ...INITIAL_SCAN },
  tasks: { ...INITIAL_TASKS },

  nextStep: () =>
    set((s) => {
      const next = Math.min(s.currentStep + 1, 4) as OnboardingStep;
      log.info('onboarding step: %d → %d', s.currentStep, next);
      return { currentStep: next };
    }),

  goToStep: (step) => set({ currentStep: step }),

  setTaskStatus: (task, status) =>
    set((s) => ({
      tasks: { ...s.tasks, [task]: status },
    })),

  setScanResult: (key, value) =>
    set((s) => ({
      scanResults: { ...s.scanResults, [key]: value },
    })),

  completeOnboarding: () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    log.info('onboarding completed');
  },

  skipOnboarding: () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    log.info('onboarding skipped');
  },

  reset: () =>
    set({
      currentStep: 1,
      scanResults: { ...INITIAL_SCAN },
      tasks: { ...INITIAL_TASKS },
    }),
}));

// ============================================================
// SECTION: Helpers
// ============================================================

export function isOnboardingDone(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function allTasksFinished(tasks: OnboardingState['tasks']): boolean {
  return Object.values(tasks).every((t) => t.status === 'done' || t.status === 'error');
}

export type { OnboardingState, OnboardingStep, ScanResults, SteamGameSummary, TaskStatus };
