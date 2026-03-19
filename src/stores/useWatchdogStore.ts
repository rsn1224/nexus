import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { WatchdogEvent, WatchdogRule } from '../types';

interface WatchdogStoreState {
  rules: WatchdogRule[];
  events: WatchdogEvent[];
  isLoading: boolean;
  error: string | null;
}

interface WatchdogStoreActions {
  fetchRules: () => Promise<void>;
  addRule: (rule: WatchdogRule) => Promise<void>;
  updateRule: (rule: WatchdogRule) => Promise<void>;
  removeRule: (ruleId: string) => Promise<void>;
  fetchEvents: () => Promise<void>;
  loadPresets: () => Promise<WatchdogRule[]>;
}

type WatchdogStore = WatchdogStoreState & WatchdogStoreActions;

export const useWatchdogStore = create<WatchdogStore>()((set, get) => ({
  // State
  rules: [],
  events: [],
  isLoading: false,
  error: null,

  // Actions
  fetchRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const rules = await invoke<WatchdogRule[]>('get_watchdog_rules');
      set({ rules, isLoading: false });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'watchdog: ルール取得失敗: %s', msg);
      set({ error: msg, isLoading: false });
    }
  },

  addRule: async (rule) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('add_watchdog_rule', { rule });
      await get().fetchRules();
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'watchdog: ルール追加失敗: %s', msg);
      set({ error: msg, isLoading: false });
    }
  },

  updateRule: async (rule) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('update_watchdog_rule', { rule });
      await get().fetchRules();
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'watchdog: ルール更新失敗: %s', msg);
      set({ error: msg, isLoading: false });
    }
  },

  removeRule: async (ruleId) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('remove_watchdog_rule', { ruleId });
      await get().fetchRules();
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'watchdog: ルール削除失敗: %s', msg);
      set({ error: msg, isLoading: false });
    }
  },

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await invoke<WatchdogEvent[]>('get_watchdog_events');
      set({ events, isLoading: false });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'watchdog: イベント取得失敗: %s', msg);
      set({ error: msg, isLoading: false });
    }
  },

  loadPresets: async () => {
    try {
      const presets = await invoke<WatchdogRule[]>('get_watchdog_presets');
      return presets;
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'watchdog: プリセット取得失敗: %s', msg);
      set({ error: msg, isLoading: false });
      return [];
    }
  },
}));

// Selectors for optimized re-renders
export const useWatchdogRules = () => useWatchdogStore((state) => state.rules);
export const useWatchdogEvents = () => useWatchdogStore((state) => state.events);
export const useWatchdogLoading = () => useWatchdogStore((state) => state.isLoading);
export const useWatchdogError = () => useWatchdogStore((state) => state.error);
export const useWatchdogActions = () =>
  useWatchdogStore(
    useShallow((state) => ({
      fetchRules: state.fetchRules,
      addRule: state.addRule,
      updateRule: state.updateRule,
      removeRule: state.removeRule,
      fetchEvents: state.fetchEvents,
      loadPresets: state.loadPresets,
    })),
  );
