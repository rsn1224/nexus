import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { GameInfo } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LauncherSettings {
  auto_boost_enabled: boolean;
  favorites: number[];
  last_played: Record<number, number>; // app_id -> timestamp (ms)
}

const AUTO_BOOST_KEY = 'nexus:launcher:autoBoostEnabled';
const FAVORITES_KEY = 'nexus:launcher:favorites'; // number[] JSON
const LAST_PLAYED_KEY = 'nexus:launcher:lastPlayed'; // Record<number, number> JSON

type SortMode = 'name' | 'size' | 'lastPlayed';

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

  // Internal methods
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  migrateFromLocalStorage: () => Promise<void>;
}

// Initialize with defaults, load from Rust on mount
export const useLauncherStore = create<LauncherStore>((set, get) => ({
  games: [],
  isScanning: false,
  autoBoostEnabled: false,
  error: null,
  favorites: [],
  lastPlayed: {},
  sortMode: 'name' as SortMode,
  searchQuery: '',

  loadSettings: async () => {
    try {
      const settings = await invoke<LauncherSettings>('get_launcher_settings_cmd');
      set({
        autoBoostEnabled: settings.auto_boost_enabled,
        favorites: settings.favorites,
        lastPlayed: Object.fromEntries(Object.entries(settings.last_played)),
      });
      log.info('launcher: settings loaded from Rust');
    } catch (err) {
      log.error({ err }, 'launcher: failed to load settings');
      // Try migration from localStorage
      await get().migrateFromLocalStorage();
    }
  },

  saveSettings: async () => {
    try {
      const { autoBoostEnabled, favorites, lastPlayed } = get();
      const settings: LauncherSettings = {
        auto_boost_enabled: autoBoostEnabled,
        favorites,
        last_played: lastPlayed,
      };
      await invoke('save_launcher_settings_cmd', { settings });
      log.info('launcher: settings saved to Rust');
    } catch (err) {
      log.error({ err }, 'launcher: failed to save settings');
    }
  },

  migrateFromLocalStorage: async () => {
    try {
      const localSettings: LauncherSettings = {
        auto_boost_enabled: localStorage.getItem(AUTO_BOOST_KEY) === 'true',
        favorites: JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') as number[],
        last_played: JSON.parse(localStorage.getItem(LAST_PLAYED_KEY) ?? '{}') as Record<
          number,
          number
        >,
      };

      await invoke('migrate_launcher_settings', { localSettings });

      // Update state with migrated settings
      set({
        autoBoostEnabled: localSettings.auto_boost_enabled,
        favorites: localSettings.favorites,
        lastPlayed: localSettings.last_played,
      });

      // Clear localStorage
      localStorage.removeItem(AUTO_BOOST_KEY);
      localStorage.removeItem(FAVORITES_KEY);
      localStorage.removeItem(LAST_PLAYED_KEY);

      log.info('launcher: migrated settings from localStorage');
    } catch (err) {
      log.error({ err }, 'launcher: migration failed, using defaults');
    }
  },

  scanGames: async () => {
    set({ isScanning: true, error: null });

    try {
      const games = await invoke<GameInfo[]>('scan_steam_games');
      log.info({ gameCount: games.length }, 'launcher: Steam games scanned');
      set({ games, isScanning: false });
    } catch (err) {
      log.error({ err }, 'launcher: scan Steam games failed');
      const errorMessage = extractErrorMessage(err);
      set({ error: errorMessage, isScanning: false });
    }
  },

  launchGame: async (appId: number) => {
    set({ error: null });

    try {
      if (get().autoBoostEnabled) {
        try {
          await invoke('run_boost', { thresholdPercent: null });
          log.info('launcher: auto boost executed before game launch');
        } catch (err) {
          log.error({ err }, 'launcher: auto boost failed (launch continues)');
          // boost 失敗はゲーム起動を妨げない
        }
      }

      await invoke('launch_game', { appId });
      log.info({ appId }, 'launcher: game launched');

      // Record last played timestamp
      const nextLastPlayed = { ...get().lastPlayed, [appId]: Date.now() };
      set({ lastPlayed: nextLastPlayed });
      await get().saveSettings();
    } catch (err) {
      log.error({ err, appId }, 'launcher: launch game failed');
      const errorMessage = extractErrorMessage(err);
      set({ error: errorMessage });
    }
  },

  toggleAutoBoost: async () => {
    const newValue = !get().autoBoostEnabled;
    set({ autoBoostEnabled: newValue });
    await get().saveSettings();
    log.info({ autoBoostEnabled: newValue }, 'launcher: auto boost toggled');
  },

  toggleFavorite: async (appId) => {
    const favs = get().favorites;
    const next = favs.includes(appId) ? favs.filter((id) => id !== appId) : [...favs, appId];
    set({ favorites: next });
    await get().saveSettings();
    log.info({ appId }, 'launcher: favorite toggled');
  },

  setSortMode: (mode) => set({ sortMode: mode }),

  setSearchQuery: (query) => set({ searchQuery: query }),
}));

// useShallow セレクタ
export const useLauncherState = () =>
  useLauncherStore(
    useShallow((s) => ({
      games: s.games,
      isScanning: s.isScanning,
      error: s.error,
      favorites: s.favorites,
      lastPlayed: s.lastPlayed,
      sortMode: s.sortMode,
      searchQuery: s.searchQuery,
    })),
  );

export const useLauncherActions = () =>
  useLauncherStore(
    useShallow((s) => ({
      scanGames: s.scanGames,
      launchGame: s.launchGame,
      toggleAutoBoost: s.toggleAutoBoost,
      toggleFavorite: s.toggleFavorite,
      setSortMode: s.setSortMode,
      setSearchQuery: s.setSearchQuery,
    })),
  );
