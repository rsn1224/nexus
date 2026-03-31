import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { commands } from '../lib/tauri-commands';
import type { NexusSettings } from '../types';

interface SettingsStore {
  settings: NexusSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: NexusSettings) => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await commands.getV4Settings();
      set({ settings, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'fetch v4 settings failed: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  updateSettings: async (settings: NexusSettings) => {
    set({ isSaving: true, error: null });
    try {
      await commands.updateV4Settings(settings);
      set({ settings, isSaving: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'update v4 settings failed: %s', msg);
      set({ isSaving: false, error: msg });
    }
  },

  clearError: () => set({ error: null }),
}));

export const useSettings = () =>
  useSettingsStore(
    useShallow((s) => ({
      settings: s.settings,
      isLoading: s.isLoading,
      isSaving: s.isSaving,
      error: s.error,
      fetchSettings: s.fetchSettings,
      updateSettings: s.updateSettings,
    })),
  );
