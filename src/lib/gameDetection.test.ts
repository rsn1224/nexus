import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('./logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import {
  LAUNCHER_STORAGE_KEYS,
  type LauncherSettings,
  migrateFromLocalStorage,
  type SortMode,
} from './gameDetection';

const mockedInvoke = vi.mocked(invoke);

describe('LAUNCHER_STORAGE_KEYS', () => {
  it('すべてのキーが定義されている', () => {
    expect(LAUNCHER_STORAGE_KEYS.AUTO_BOOST).toBe('nexus:launcher:autoBoostEnabled');
    expect(LAUNCHER_STORAGE_KEYS.FAVORITES).toBe('nexus:launcher:favorites');
    expect(LAUNCHER_STORAGE_KEYS.LAST_PLAYED).toBe('nexus:launcher:lastPlayed');
  });
});

describe('SortMode型', () => {
  it('有効なソートモード値を受け入れる', () => {
    const modes: SortMode[] = ['name', 'size', 'lastPlayed'];
    expect(modes).toHaveLength(3);
  });
});

describe('migrateFromLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('localStorageから設定を読み取りinvokeに渡す', async () => {
    localStorage.setItem(LAUNCHER_STORAGE_KEYS.AUTO_BOOST, 'true');
    localStorage.setItem(LAUNCHER_STORAGE_KEYS.FAVORITES, '[1,2,3]');
    localStorage.setItem(LAUNCHER_STORAGE_KEYS.LAST_PLAYED, '{"1":100}');
    mockedInvoke.mockResolvedValue(undefined);

    const result = await migrateFromLocalStorage();

    expect(result.auto_boost_enabled).toBe(true);
    expect(result.favorites).toEqual([1, 2, 3]);
    expect(result.last_played).toEqual({ '1': 100 });
    expect(mockedInvoke).toHaveBeenCalledWith('migrate_launcher_settings', {
      localSettings: result,
    });
  });

  it('localStorageにデータがない場合はデフォルト値を使う', async () => {
    mockedInvoke.mockResolvedValue(undefined);

    const result = await migrateFromLocalStorage();

    expect(result.auto_boost_enabled).toBe(false);
    expect(result.favorites).toEqual([]);
    expect(result.last_played).toEqual({});
  });

  it('マイグレーション後にlocalStorageのキーを削除する', async () => {
    localStorage.setItem(LAUNCHER_STORAGE_KEYS.AUTO_BOOST, 'true');
    localStorage.setItem(LAUNCHER_STORAGE_KEYS.FAVORITES, '[1]');
    localStorage.setItem(LAUNCHER_STORAGE_KEYS.LAST_PLAYED, '{}');
    mockedInvoke.mockResolvedValue(undefined);

    await migrateFromLocalStorage();

    expect(localStorage.getItem(LAUNCHER_STORAGE_KEYS.AUTO_BOOST)).toBeNull();
    expect(localStorage.getItem(LAUNCHER_STORAGE_KEYS.FAVORITES)).toBeNull();
    expect(localStorage.getItem(LAUNCHER_STORAGE_KEYS.LAST_PLAYED)).toBeNull();
  });

  it('LauncherSettings型の構造を満たす', async () => {
    mockedInvoke.mockResolvedValue(undefined);

    const result: LauncherSettings = await migrateFromLocalStorage();

    expect(typeof result.auto_boost_enabled).toBe('boolean');
    expect(Array.isArray(result.favorites)).toBe(true);
    expect(typeof result.last_played).toBe('object');
  });
});
