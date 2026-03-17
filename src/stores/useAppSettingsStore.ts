import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import log from '../lib/logger';
import type { AppSettings } from '../types';

const SETTINGS_KEY = 'nexus:settings';

interface PersistedSettings {
  perplexityApiKey: string;
}

interface AppSettingsStore extends PersistedSettings {
  // Tauri 設定
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // アクション
  fetchSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setPerplexityApiKey: (key: string) => void;
  clearError: () => void;
}

// デフォルト設定
const defaultSettings: AppSettings = {
  perplexityApiKey: '',
  startWithWindows: false,
  minimizeToTray: true,
};

function loadPersistedSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as PersistedSettings;
  } catch {
    // ignore parse errors
  }
  return { perplexityApiKey: '' };
}

function savePersistedSettings(s: PersistedSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
  // localStorage からロードした persisted settings
  ...loadPersistedSettings(),

  // Tauri 設定
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch app settings';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to save app settings';
      log.error({ err }, 'save app settings failed: %s', errorMessage);
      set({ error: errorMessage });
    }
  },

  updateSettings: async (updates: Partial<AppSettings>) => {
    const currentSettings = get().settings || defaultSettings;
    const newSettings = { ...currentSettings, ...updates };
    await get().saveSettings(newSettings);
  },

  setPerplexityApiKey: (key) => {
    set({ perplexityApiKey: key });
    savePersistedSettings({ perplexityApiKey: key });
    log.info('settings: Perplexity API key updated');
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
      perplexityApiKey: s.perplexityApiKey,
      setPerplexityApiKey: s.setPerplexityApiKey,
    })),
  );
