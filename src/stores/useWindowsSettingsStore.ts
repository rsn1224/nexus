import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { AdvisorResult, WindowsSettings } from '../types';
import { PowerPlan, VisualEffects } from '../types';

interface WindowsSettingsStore {
  settings: WindowsSettings | null;
  advisorResult: AdvisorResult | null;
  isLoading: boolean;
  advisorLoading: boolean;
  error: string | null;
  advisorError: string | null;
  lastUpdated: number | null;
  fetchSettings: () => Promise<void>;
  setPowerPlan: (plan: PowerPlan) => Promise<void>;
  toggleGameMode: () => Promise<void>;
  toggleFullscreenOptimization: () => Promise<void>;
  toggleHardwareGpuScheduling: () => Promise<void>;
  setVisualEffects: (effect: VisualEffects) => Promise<void>;
  fetchAdvisorResult: () => Promise<void>;
  applyRecommendation: (settingId: string) => Promise<void>;
  applyAllSafeRecommendations: () => Promise<void>;
  clearError: () => void;
  clearAdvisorError: () => void;
}

// デフォルト設定
const defaultSettings: WindowsSettings = {
  powerPlan: PowerPlan.Balanced,
  gameMode: true,
  fullscreenOptimization: true,
  hardwareGpuScheduling: false,
  visualEffects: VisualEffects.Balanced,
};

export const useWindowsSettingsStore = create<WindowsSettingsStore>((set, get) => ({
  settings: null,
  advisorResult: null,
  isLoading: false,
  advisorLoading: false,
  error: null,
  advisorError: null,
  lastUpdated: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await invoke<WindowsSettings>('get_windows_settings');
      set({
        settings,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'windows settings fetch failed: %s', errorMessage);
      set({
        settings: defaultSettings,
        error: errorMessage,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    }
  },

  setPowerPlan: async (plan: PowerPlan) => {
    try {
      await invoke('set_power_plan', { plan });
      // 設定を再取得
      await get().fetchSettings();
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'set power plan failed: %s', errorMessage);
      set({ error: errorMessage });
    }
  },

  toggleGameMode: async () => {
    try {
      const newStatus = await invoke<boolean>('toggle_game_mode');
      // ローカル状態を即時更新
      const currentSettings = get().settings;
      if (currentSettings) {
        set({
          settings: {
            ...currentSettings,
            gameMode: newStatus,
          },
        });
        // 設定を再取得して確定
        await get().fetchSettings();
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'toggle game mode failed: %s', errorMessage);
      set({ error: errorMessage });
    }
  },

  toggleFullscreenOptimization: async () => {
    try {
      const newStatus = await invoke<boolean>('toggle_fullscreen_optimization');
      // ローカル状態を即時更新
      const currentSettings = get().settings;
      if (currentSettings) {
        set({
          settings: {
            ...currentSettings,
            fullscreenOptimization: newStatus,
          },
        });
        // 設定を再取得して確定
        await get().fetchSettings();
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'toggle fullscreen optimization failed: %s', errorMessage);
      set({ error: errorMessage });
    }
  },

  toggleHardwareGpuScheduling: async () => {
    try {
      const newStatus = await invoke<boolean>('toggle_hardware_gpu_scheduling');
      // ローカル状態を即時更新
      const currentSettings = get().settings;
      if (currentSettings) {
        set({
          settings: {
            ...currentSettings,
            hardwareGpuScheduling: newStatus,
          },
        });
        // 設定を再取得して確定
        await get().fetchSettings();
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'toggle hardware GPU scheduling failed: %s', errorMessage);
      set({ error: errorMessage });
    }
  },

  setVisualEffects: async (effect: VisualEffects) => {
    try {
      await invoke('set_visual_effects', { effect });
      // 設定を再取得
      await get().fetchSettings();
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'set visual effects failed: %s', errorMessage);
      set({ error: errorMessage });
    }
  },

  clearError: () => set({ error: null }),

  fetchAdvisorResult: async () => {
    set({ advisorLoading: true, advisorError: null });
    try {
      const result = await invoke<AdvisorResult>('get_settings_advice');
      set({
        advisorResult: result,
        advisorLoading: false,
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'advisor result fetch failed: %s', errorMessage);
      set({
        advisorError: errorMessage,
        advisorLoading: false,
      });
    }
  },

  applyRecommendation: async (settingId: string) => {
    set({ advisorLoading: true, advisorError: null });
    try {
      await invoke('apply_recommendation', { settingId });
      // Refresh settings and advisor result
      await get().fetchSettings();
      await get().fetchAdvisorResult();
      set({ advisorLoading: false });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'apply recommendation failed: %s', errorMessage);
      set({
        advisorError: errorMessage,
        advisorLoading: false,
      });
    }
  },

  applyAllSafeRecommendations: async () => {
    set({ advisorLoading: true, advisorError: null });
    try {
      await invoke('apply_all_safe_recommendations');
      // Refresh settings and advisor result
      await get().fetchSettings();
      await get().fetchAdvisorResult();
      set({ advisorLoading: false });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'apply all safe recommendations failed: %s', errorMessage);
      set({
        advisorError: errorMessage,
        advisorLoading: false,
      });
    }
  },

  clearAdvisorError: () => set({ advisorError: null }),
}));

// セレクター関数
export const useWindowsSettings = () => {
  const {
    settings,
    advisorResult,
    isLoading,
    advisorLoading,
    error,
    advisorError,
    fetchSettings,
    setPowerPlan,
    toggleGameMode,
    toggleFullscreenOptimization,
    toggleHardwareGpuScheduling,
    setVisualEffects,
    fetchAdvisorResult,
    applyRecommendation,
    applyAllSafeRecommendations,
  } = useWindowsSettingsStore();

  return {
    settings,
    advisorResult,
    isLoading,
    advisorLoading,
    error,
    advisorError,
    fetchSettings,
    setPowerPlan,
    toggleGameMode,
    toggleFullscreenOptimization,
    toggleHardwareGpuScheduling,
    setVisualEffects,
    fetchAdvisorResult,
    applyRecommendation,
    applyAllSafeRecommendations,
  };
};
