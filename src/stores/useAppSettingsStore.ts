import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import type { AppSettings } from '../types';

interface AppSettingsStore {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  fetchSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  clearError: () => void;
}

// デフォルト設定
const defaultSettings: AppSettings = {
  perplexityApiKey: '',
  startWithWindows: false,
  minimizeToTray: true,
};

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await invoke<AppSettings>('get_app_settings');
      set({
        settings,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      log.error({ err }, 'app settings fetch failed: %s', errorMessage);
      set({
        settings: defaultSettings,
        error: errorMessage,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    }
  },

  saveSettings: async (settings: AppSettings) => {
    try {
      await invoke('save_app_settings', { settings });
      set({
        settings,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      log.error({ err }, 'save app settings failed: %s', errorMessage);
      set({ error: errorMessage });
    }
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    const currentSettings = get().settings || defaultSettings;
    const newSettings = { ...currentSettings, ...updates };
    await get().saveSettings(newSettings);
  },

  clearError: () => {
    set({ error: null });
  },
}));

// セレクター関数
export const useAppSettings = () =>
  useAppSettingsStore(
    useShallow((s: AppSettingsStore) => ({
      settings: s.settings,
      isLoading: s.isLoading,
      error: s.error,
      fetchSettings: s.fetchSettings,
      saveSettings: s.saveSettings,
      updateSettings: s.updateSettings,
    })),
  );
