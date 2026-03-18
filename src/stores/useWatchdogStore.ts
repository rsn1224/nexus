import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
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
      const error = err instanceof Error ? err.message : 'Failed to fetch rules';
      set({ error, isLoading: false });
    }
  },

  addRule: async (rule) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('add_watchdog_rule', { rule });
      await get().fetchRules();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to add rule';
      set({ error, isLoading: false });
    }
  },

  updateRule: async (rule) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('update_watchdog_rule', { rule });
      await get().fetchRules();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update rule';
      set({ error, isLoading: false });
    }
  },

  removeRule: async (ruleId) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('remove_watchdog_rule', { ruleId });
      await get().fetchRules();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to remove rule';
      set({ error, isLoading: false });
    }
  },

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await invoke<WatchdogEvent[]>('get_watchdog_events');
      set({ events, isLoading: false });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch events';
      set({ error, isLoading: false });
    }
  },

  loadPresets: async () => {
    try {
      const presets = await invoke<WatchdogRule[]>('get_watchdog_presets');
      return presets;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to load presets';
      set({ error, isLoading: false });
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
  useWatchdogStore((state) => ({
    fetchRules: state.fetchRules,
    addRule: state.addRule,
    updateRule: state.updateRule,
    removeRule: state.removeRule,
    fetchEvents: state.fetchEvents,
    loadPresets: state.loadPresets,
  }));
