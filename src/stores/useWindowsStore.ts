import { create } from 'zustand';
import log from '../lib/logger';
import { commands } from '../lib/tauri-commands';
import type { PowerPlan, VisualEffects, WindowsSettings } from '../types';

interface WindowsStore {
  settings: WindowsSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  setPowerPlan: (plan: PowerPlan) => Promise<void>;
  toggleGameMode: () => Promise<void>;
  toggleFullscreenOptimization: () => Promise<void>;
  toggleHardwareGpuScheduling: () => Promise<void>;
  setVisualEffects: (effect: VisualEffects) => Promise<void>;
  clearError: () => void;
}

export const useWindowsStore = create<WindowsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await commands.getWindowsSettings();
      set({ settings, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'fetch windows settings failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  setPowerPlan: async (plan) => {
    set({ isLoading: true, error: null });
    try {
      await commands.setPowerPlan(plan);
      const prev = get().settings;
      if (prev) set({ settings: { ...prev, powerPlan: plan }, isLoading: false });
      else set({ isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'set power plan failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  toggleGameMode: async () => {
    set({ isLoading: true, error: null });
    try {
      const gameMode = await commands.toggleGameMode();
      const prev = get().settings;
      if (prev) set({ settings: { ...prev, gameMode }, isLoading: false });
      else set({ isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'toggle game mode failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  toggleFullscreenOptimization: async () => {
    set({ isLoading: true, error: null });
    try {
      const fullscreenOptimization = await commands.toggleFullscreenOptimization();
      const prev = get().settings;
      if (prev) set({ settings: { ...prev, fullscreenOptimization }, isLoading: false });
      else set({ isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'toggle fullscreen optimization failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  toggleHardwareGpuScheduling: async () => {
    set({ isLoading: true, error: null });
    try {
      const hardwareGpuScheduling = await commands.toggleHardwareGpuScheduling();
      const prev = get().settings;
      if (prev) set({ settings: { ...prev, hardwareGpuScheduling }, isLoading: false });
      else set({ isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'toggle hardware gpu scheduling failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  setVisualEffects: async (effect) => {
    set({ isLoading: true, error: null });
    try {
      await commands.setVisualEffects(effect);
      const prev = get().settings;
      if (prev) set({ settings: { ...prev, visualEffects: effect }, isLoading: false });
      else set({ isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'set visual effects failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  clearError: () => set({ error: null }),
}));
