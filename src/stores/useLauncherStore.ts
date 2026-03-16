import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { GameInfo } from '../types';

const AUTO_BOOST_KEY = 'nexus:launcher:autoBoostEnabled';

interface LauncherStore {
  games: GameInfo[];
  isScanning: boolean;
  autoBoostEnabled: boolean;
  error: string | null;

  scanGames: () => Promise<void>;
  launchGame: (appId: number) => Promise<void>;
  toggleAutoBoost: () => void;
}

export const useLauncherStore = create<LauncherStore>((set, get) => ({
  games: [],
  isScanning: false,
  autoBoostEnabled: localStorage.getItem(AUTO_BOOST_KEY) === 'true',
  error: null,

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
      await invoke('launch_game', { app_id: appId });
      log.info({ appId }, 'launcher: game launched');

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
}));
