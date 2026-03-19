import { invoke } from '@tauri-apps/api/core';
import log from './logger';

export type SortMode = 'name' | 'size' | 'lastPlayed';

export interface LauncherSettings {
  auto_boost_enabled: boolean;
  favorites: number[];
  last_played: Record<number, number>;
}

export const LAUNCHER_STORAGE_KEYS = {
  AUTO_BOOST: 'nexus:launcher:autoBoostEnabled',
  FAVORITES: 'nexus:launcher:favorites',
  LAST_PLAYED: 'nexus:launcher:lastPlayed',
} as const;

export async function migrateFromLocalStorage(): Promise<LauncherSettings> {
  const keys = LAUNCHER_STORAGE_KEYS;
  const settings: LauncherSettings = {
    auto_boost_enabled: localStorage.getItem(keys.AUTO_BOOST) === 'true',
    favorites: JSON.parse(localStorage.getItem(keys.FAVORITES) ?? '[]') as number[],
    last_played: JSON.parse(localStorage.getItem(keys.LAST_PLAYED) ?? '{}') as Record<
      number,
      number
    >,
  };

  await invoke('migrate_launcher_settings', { localSettings: settings });

  localStorage.removeItem(keys.AUTO_BOOST);
  localStorage.removeItem(keys.FAVORITES);
  localStorage.removeItem(keys.LAST_PLAYED);

  log.info('launcher: migrated settings from localStorage');
  return settings;
}
