import { create } from 'zustand';
import log from '../lib/logger';

const SETTINGS_KEY = 'nexus:settings';

interface PersistedSettings {
  perplexityApiKey: string;
}

interface SettingsStore extends PersistedSettings {
  setPerplexityApiKey: (key: string) => void;
}

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as PersistedSettings;
  } catch {
    // ignore parse errors
  }
  return { perplexityApiKey: '' };
}

function saveSettings(s: PersistedSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...loadSettings(),

  setPerplexityApiKey: (key) => {
    set({ perplexityApiKey: key });
    saveSettings({ perplexityApiKey: key });
    log.info('settings: Perplexity API key updated');
  },
}));
