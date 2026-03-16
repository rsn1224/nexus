import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { SignalFeed, SignalResult } from '../types';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface SignalStore {
  feeds: SignalFeed[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  fetchFeeds: () => Promise<void>;
  addFeed: (
    label: string,
    url: string,
    kind: 'rss' | 'http',
    intervalSecs: number,
  ) => Promise<void>;
  removeFeed: (id: string) => Promise<void>;
  toggleFeed: (id: string) => Promise<void>;
  checkFeedNow: (id: string) => Promise<SignalResult[]>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSignalStore = create<SignalStore>((set) => ({
  feeds: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchFeeds: async () => {
    set({ isLoading: true, error: null });
    try {
      const feeds = await invoke<SignalFeed[]>('list_signal_feeds');
      log.info({ count: feeds.length }, 'signal: feeds fetched');
      set({ feeds, lastUpdated: Date.now() });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'signal: fetch feeds failed');
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  addFeed: async (label: string, url: string, kind: 'rss' | 'http', intervalSecs: number) => {
    set({ isLoading: true, error: null });
    try {
      const newFeed = await invoke<SignalFeed>('add_signal_feed', {
        label,
        url,
        kind,
        intervalSecs,
      });

      set((state) => ({
        feeds: [...state.feeds, newFeed],
        lastUpdated: Date.now(),
      }));

      log.info({ id: newFeed.id, label }, 'signal: feed added');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'signal: add feed failed');
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  removeFeed: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('remove_signal_feed', { id });

      set((state) => ({
        feeds: state.feeds.filter((f) => f.id !== id),
        lastUpdated: Date.now(),
      }));

      log.info({ id }, 'signal: feed removed');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'signal: remove feed failed');
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFeed: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('toggle_signal_feed', { id });

      set((state) => ({
        feeds: state.feeds.map((f) => (f.id === id ? { ...f, isActive: !f.isActive } : f)),
        lastUpdated: Date.now(),
      }));

      log.info({ id }, 'signal: feed toggled');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'signal: toggle feed failed');
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  checkFeedNow: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const results = await invoke<SignalResult[]>('check_feed_now', { id });

      // Update the feed with latest result
      set((state) => ({
        feeds: state.feeds.map((f) =>
          f.id === id
            ? {
                ...f,
                lastChecked: Date.now(),
                lastResult: results[0],
              }
            : f,
        ),
        lastUpdated: Date.now(),
      }));

      log.info({ id, resultCount: results.length }, 'signal: feed checked');
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'signal: check feed failed');
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
