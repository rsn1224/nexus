import { create } from 'zustand';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import { defaultWindowsSettings } from '../lib/windowsSettings';
import {
  applyAllSafeRecommendations as cmdApplyAllSafe,
  applyRecommendation as cmdApplyRecommendation,
  fetchAdvisorResult as cmdFetchAdvisorResult,
  fetchWindowsSettings as cmdFetchSettings,
  setPowerPlan as cmdSetPowerPlan,
  setVisualEffects as cmdSetVisualEffects,
  toggleFullscreenOptimization as cmdToggleFullscreen,
  toggleGameMode as cmdToggleGameMode,
  toggleHardwareGpuScheduling as cmdToggleHags,
} from '../lib/windowsSettingsCommands';
import type { PowerPlan, VisualEffects, WindowsSettingsStore } from '../types/settings';

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
      const settings = await cmdFetchSettings();
      set({
        settings,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'windows settings fetch failed: %s', errorMessage);
      set({
        settings: defaultWindowsSettings,
        error: errorMessage,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    }
  },

  setPowerPlan: async (plan: PowerPlan) => {
    try {
      await cmdSetPowerPlan(plan);
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
      const newStatus = await cmdToggleGameMode();
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
      const newStatus = await cmdToggleFullscreen();
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
      const newStatus = await cmdToggleHags();
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
      await cmdSetVisualEffects(effect);
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
      const result = await cmdFetchAdvisorResult();
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
      await cmdApplyRecommendation(settingId);
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
      await cmdApplyAllSafe();
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

export { useWindowsSettings } from '../hooks/windowsSettingsHooks';
