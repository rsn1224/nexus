import { create } from 'zustand';
import log from '../lib/logger';

const SETTINGS_KEY = 'nexus:settings';

export const POLL_INTERVAL_OPTIONS: { label: string; value: number }[] = [
  { label: '1秒', value: 1000 },
  { label: '2秒', value: 2000 },
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
];

interface PersistedSettings {
  pollIntervalMs: number;
  perplexityApiKey: string;
}

interface SettingsStore extends PersistedSettings {
  setPollInterval: (ms: number) => void;
  setPerplexityApiKey: (key: string) => void;
}

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as PersistedSettings;
  } catch {
    // ignore parse errors
  }
  return { pollIntervalMs: 2000, perplexityApiKey: '' };
}

function saveSettings(s: PersistedSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...loadSettings(),

  setPollInterval: (ms) => {
    set({ pollIntervalMs: ms });
    saveSettings({ pollIntervalMs: ms, perplexityApiKey: get().perplexityApiKey });
    log.info({ pollIntervalMs: ms }, 'settings: poll interval changed');
  },

  setPerplexityApiKey: (key) => {
    set({ perplexityApiKey: key });
    saveSettings({ pollIntervalMs: get().pollIntervalMs, perplexityApiKey: key });
    log.info('settings: Perplexity API key updated');
  },
}));
