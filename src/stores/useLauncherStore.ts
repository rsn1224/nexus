import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { GameInfo } from '../types';

const AUTO_BOOST_KEY = 'nexus:launcher:autoBoostEnabled';
const FAVORITES_KEY = 'nexus:launcher:favorites'; // number[] JSON
const LAST_PLAYED_KEY = 'nexus:launcher:lastPlayed'; // Record<number, number> JSON

type SortMode = 'name' | 'recent' | 'favorites';

interface LauncherStore {
  games: GameInfo[];
  isScanning: boolean;
  autoBoostEnabled: boolean;
  error: string | null;
  favorites: number[];
  lastPlayed: Record<number, number>; // app_id → Unix timestamp (ms)
  sortMode: SortMode;
  searchQuery: string;

  scanGames: () => Promise<void>;
  launchGame: (appId: number) => Promise<void>;
  toggleAutoBoost: () => void;
  toggleFavorite: (appId: number) => void;
  setSortMode: (mode: SortMode) => void;
  setSearchQuery: (query: string) => void;
}

export const useLauncherStore = create<LauncherStore>((set, get) => ({
  games: [],
  isScanning: false,
  autoBoostEnabled: localStorage.getItem(AUTO_BOOST_KEY) === 'true',
  error: null,
  favorites: JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') as number[],
  lastPlayed: JSON.parse(localStorage.getItem(LAST_PLAYED_KEY) ?? '{}') as Record<number, number>,
  sortMode: 'name' as SortMode,
  searchQuery: '',

  scanGames: async () => {
    set({ isScanning: true, error: null });

    try {
      const games = await invoke<GameInfo[]>('scan_steam_games');
      log.info({ gameCount: games.length }, 'launcher: Steam games scanned');
      set({ games, isScanning: false });
    } catch (err) {
      log.error({ err }, 'launcher: scan Steam games failed');
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage, isScanning: false });
    }
  },

  launchGame: async (appId: number) => {
    set({ error: null });

    try {
      await invoke('launch_game', { appId });
      log.info({ appId }, 'launcher: game launched');

      // Record last played timestamp
      const nextLastPlayed = { ...get().lastPlayed, [appId]: Date.now() };
      localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(nextLastPlayed));
      set({ lastPlayed: nextLastPlayed });

      if (get().autoBoostEnabled) {
        try {
          const { useOpsStore } = await import('./useOpsStore');
          await useOpsStore.getState().fetchProcesses();
          log.info('launcher: auto refresh triggered after game launch');
        } catch (err) {
          log.error({ err }, 'launcher: auto refresh failed');
        }
      }
    } catch (err) {
      log.error({ err, appId }, 'launcher: launch game failed');
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage });
    }
  },

  toggleAutoBoost: () => {
    const newValue = !get().autoBoostEnabled;
    set({ autoBoostEnabled: newValue });
    localStorage.setItem(AUTO_BOOST_KEY, newValue.toString());
    log.info({ autoBoostEnabled: newValue }, 'launcher: auto boost toggled');
  },

  toggleFavorite: (appId) => {
    const favs = get().favorites;
    const next = favs.includes(appId) ? favs.filter((id) => id !== appId) : [...favs, appId];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    set({ favorites: next });
    log.info({ appId }, 'launcher: favorite toggled');
  },

  setSortMode: (mode) => set({ sortMode: mode }),

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
