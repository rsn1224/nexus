import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock localStorage for migration
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

import { invoke } from '@tauri-apps/api/core';
import { useLauncherStore } from './useLauncherStore';

const MOCK_GAMES: import('../types').GameInfo[] = [
  {
    app_id: 12345,
    name: 'Test Game 1',
    install_path: 'C:\\Games\\TestGame1',
    size_gb: 15.5,
  },
  {
    app_id: 67890,
    name: 'Test Game 2',
    install_path: 'C:\\Games\\TestGame2',
    size_gb: 32.0,
  },
];

function resetStore(): void {
  useLauncherStore.setState({
    games: [],
    isScanning: false,
    autoBoostEnabled: false,
    error: null,
    favorites: [],
    lastPlayed: {},
    sortMode: 'name',
    searchQuery: '',
  });
  vi.clearAllMocks();
}

// Mock Rust settings
const mockSettings: {
  auto_boost_enabled: boolean;
  favorites: number[];
  last_played: Record<number, number>;
} = {
  auto_boost_enabled: false,
  favorites: [],
  last_played: {},
};

const mockInvoke = vi.mocked(invoke);

describe('useLauncherStore', () => {
  beforeEach(() => {
    resetStore();
    // Mock Rust settings commands
    // biome-ignore lint/suspicious/noExplicitAny: test mock requires loose typing for invoke args
    mockInvoke.mockImplementation((command: string, args?: any) => {
      const a = args as
        | { settings?: typeof mockSettings; localSettings?: typeof mockSettings }
        | undefined;
      switch (command) {
        case 'get_launcher_settings_cmd':
          return Promise.resolve(mockSettings);
        case 'save_launcher_settings_cmd':
          if (a?.settings) {
            Object.assign(mockSettings, a.settings);
          }
          return Promise.resolve();
        case 'migrate_launcher_settings':
          if (a?.localSettings) {
            Object.assign(mockSettings, a.localSettings);
          }
          return Promise.resolve();
        case 'scan_steam_games':
          return Promise.resolve(MOCK_GAMES);
        case 'launch_game':
          return Promise.resolve();
        case 'run_boost':
          return Promise.resolve();
        default:
          return Promise.resolve([]);
      }
    });
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  it('starts with empty state', () => {
    const {
      games,
      isScanning,
      autoBoostEnabled,
      error,
      favorites,
      lastPlayed,
      sortMode,
      searchQuery,
    } = useLauncherStore.getState();

    expect(games).toEqual([]);
    expect(isScanning).toBe(false);
    expect(autoBoostEnabled).toBe(false);
    expect(error).toBeNull();
    expect(favorites).toEqual([]);
    expect(lastPlayed).toEqual({});
    expect(sortMode).toBe('name');
    expect(searchQuery).toBe('');
  });

  it('loads settings from Rust on loadSettings', async () => {
    // Set mock settings
    mockSettings.auto_boost_enabled = true;
    mockSettings.favorites = [12345];
    mockSettings.last_played = { 12345: Date.now() };

    await useLauncherStore.getState().loadSettings();

    const state = useLauncherStore.getState();
    expect(state.autoBoostEnabled).toBe(true);
    expect(state.favorites).toContain(12345);
    expect(state.lastPlayed[12345]).toBeDefined();
  });

  it('saves settings to Rust on saveSettings', async () => {
    // Update state
    useLauncherStore.setState({
      autoBoostEnabled: true,
      favorites: [12345],
      lastPlayed: { 12345: Date.now() },
    });

    await useLauncherStore.getState().saveSettings();

    expect(mockInvoke).toHaveBeenCalledWith('save_launcher_settings_cmd', {
      settings: {
        auto_boost_enabled: true,
        favorites: [12345],
        last_played: { 12345: expect.any(Number) },
      },
    });
  });

  it('migrates from localStorage on loadSettings failure', async () => {
    // Mock localStorage data
    localStorageMock.getItem.mockImplementation((key: string) => {
      switch (key) {
        case 'nexus:launcher:autoBoostEnabled':
          return 'true';
        case 'nexus:launcher:favorites':
          return JSON.stringify([12345]);
        case 'nexus:launcher:lastPlayed':
          return JSON.stringify({ 12345: Date.now() });
        default:
          return null;
      }
    });

    // Mock Rust failure then success
    mockInvoke
      .mockImplementationOnce(() => Promise.reject(new Error('Failed')))
      .mockImplementation((command: string) => {
        if (command === 'migrate_launcher_settings') {
          return Promise.resolve();
        }
        return Promise.resolve(mockSettings);
      });

    await useLauncherStore.getState().loadSettings();

    expect(mockInvoke).toHaveBeenCalledWith('migrate_launcher_settings', {
      localSettings: {
        auto_boost_enabled: true,
        favorites: [12345],
        last_played: { 12345: expect.any(Number) },
      },
    });

    // Check localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('nexus:launcher:autoBoostEnabled');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('nexus:launcher:favorites');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('nexus:launcher:lastPlayed');
  });

  it('scanGames updates games list', async () => {
    await useLauncherStore.getState().scanGames();

    expect(useLauncherStore.getState().games).toEqual(MOCK_GAMES);
    expect(useLauncherStore.getState().isScanning).toBe(false);
    expect(useLauncherStore.getState().error).toBeNull();
  });

  it('launchGame updates last played timestamp', async () => {
    const appId = 12345;
    const before = Date.now();

    await useLauncherStore.getState().launchGame(appId);

    expect(useLauncherStore.getState().lastPlayed[appId]).toBeGreaterThanOrEqual(before);
    expect(mockInvoke).toHaveBeenCalledWith('launch_game', { appId });
  });

  it('toggleAutoBoost toggles state and saves to Rust', async () => {
    useLauncherStore.setState({ autoBoostEnabled: false });

    await useLauncherStore.getState().toggleAutoBoost();

    expect(useLauncherStore.getState().autoBoostEnabled).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('save_launcher_settings_cmd', {
      settings: {
        auto_boost_enabled: true,
        favorites: [],
        last_played: {},
      },
    });
  });

  it('toggleFavorite adds favorite when not present', async () => {
    const appId = 12345;

    await useLauncherStore.getState().toggleFavorite(appId);

    expect(useLauncherStore.getState().favorites).toContain(appId);
    expect(mockInvoke).toHaveBeenCalledWith('save_launcher_settings_cmd', {
      settings: {
        auto_boost_enabled: false,
        favorites: [appId],
        last_played: {},
      },
    });
  });

  it('toggleFavorite removes favorite when present', async () => {
    const appId = 12345;
    useLauncherStore.setState({ favorites: [appId] });

    await useLauncherStore.getState().toggleFavorite(appId);

    expect(useLauncherStore.getState().favorites).not.toContain(appId);
    expect(mockInvoke).toHaveBeenCalledWith('save_launcher_settings_cmd', {
      settings: {
        auto_boost_enabled: false,
        favorites: [],
        last_played: {},
      },
    });
  });

  it('setSortMode updates sort mode', () => {
    useLauncherStore.getState().setSortMode('size');

    expect(useLauncherStore.getState().sortMode).toBe('size');
  });

  it('setSearchQuery updates search query', () => {
    useLauncherStore.getState().setSearchQuery('test');

    expect(useLauncherStore.getState().searchQuery).toBe('test');
  });

  it('launchGame handles error', async () => {
    const errorMessage = 'Game not found';
    mockInvoke.mockRejectedValueOnce(new Error(errorMessage));

    await useLauncherStore.getState().launchGame(99999);

    expect(useLauncherStore.getState().error).toBe(errorMessage);
  });
});
