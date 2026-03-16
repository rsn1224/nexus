import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';
import log from '../lib/logger';
import type { WatchEvent, WatchedPath } from '../types';

interface BeaconStore {
  // State
  watchedPaths: WatchedPath[];
  events: WatchEvent[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWatchedPaths: () => Promise<void>;
  startWatching: (path: string, isRecursive: boolean) => Promise<WatchedPath>;
  stopWatching: (id: string) => Promise<void>;
  removeWatchedPath: (id: string) => Promise<void>;
  fetchEvents: (limit?: number) => Promise<void>;
  clearEvents: () => Promise<void>;
  validatePath: (path: string) => Promise<boolean>;
  setError: (error: string | null) => void;
}

export const useBeaconStore = create<BeaconStore>((set, get) => ({
  // Initial state
  watchedPaths: [],
  events: [],
  isLoading: false,
  error: null,

  // Actions
  fetchWatchedPaths: async () => {
    set({ isLoading: true, error: null });
    try {
      const paths = await invoke<WatchedPath[]>('list_watched_paths');
      set({ watchedPaths: paths, isLoading: false });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch watched paths';
      set({ error, isLoading: false });
    }
  },

  startWatching: async (path: string, isRecursive: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const watchedPath = await invoke<WatchedPath>('start_watching', {
        path,
        isRecursive,
      });

      // Update local state
      const currentPaths = get().watchedPaths;
      set({
        watchedPaths: [...currentPaths, watchedPath],
        isLoading: false,
      });

      return watchedPath;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start watching';
      set({ error, isLoading: false });
      throw err;
    }
  },

  stopWatching: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('stop_watching', { id });

      // Update local state
      const currentPaths = get().watchedPaths;
      set({
        watchedPaths: currentPaths.map((p) => (p.id === id ? { ...p, isActive: false } : p)),
        isLoading: false,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to stop watching';
      set({ error, isLoading: false });
      throw err;
    }
  },

  removeWatchedPath: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('remove_watched_path', { id });

      // Update local state
      const currentPaths = get().watchedPaths;
      set({
        watchedPaths: currentPaths.filter((p) => p.id !== id),
        isLoading: false,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to remove watched path';
      set({ error, isLoading: false });
      throw err;
    }
  },

  fetchEvents: async (limit?: number) => {
    set({ isLoading: true, error: null });
    try {
      const events = await invoke<WatchEvent[]>('get_events', { limit });
      set({ events, isLoading: false });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch events';
      set({ error, isLoading: false });
    }
  },

  clearEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      await invoke('clear_events');
      set({ events: [], isLoading: false });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to clear events';
      set({ error, isLoading: false });
      throw err;
    }
  },

  validatePath: async (path: string) => {
    try {
      const isValid = await invoke<boolean>('validate_path', { path });
      return isValid;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to validate path';
      set({ error });
      return false;
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));

// File system event listener
let fileWatcherUnlisten: (() => void) | null = null;

export const startFileWatcher = async () => {
  if (fileWatcherUnlisten) {
    return; // Already listening
  }

  try {
    fileWatcherUnlisten = await listen<WatchEvent>('file-system-event', (event) => {
      const watchEvent = event.payload;
      const currentEvents = useBeaconStore.getState().events;

      // Add new event to the beginning (newest first)
      useBeaconStore.setState({
        events: [watchEvent, ...currentEvents].slice(0, 100), // Keep max 100 events
      });
    });
  } catch (err) {
    log.error({ err }, 'beacon: failed to start file watcher');
  }
};

export const stopFileWatcher = () => {
  if (fileWatcherUnlisten) {
    fileWatcherUnlisten();
    fileWatcherUnlisten = null;
  }
};
