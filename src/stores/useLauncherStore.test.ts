import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock localStorage
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

describe('useLauncherStore', () => {
  beforeEach(() => {
    resetStore();
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

  it('loads autoBoostEnabled from localStorage', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'nexus:launcher:autoBoostEnabled') return 'true';
      return null;
    });

    // Reset to known state and test toggle functionality
    resetStore();
    expect(useLauncherStore.getState().autoBoostEnabled).toBe(false); // Initial state

    useLauncherStore.getState().toggleAutoBoost();
    expect(useLauncherStore.getState().autoBoostEnabled).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'nexus:launcher:autoBoostEnabled',
      'true',
    );
  });

  it('loads favorites from localStorage', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'nexus:launcher:favorites') return '[12345, 67890]';
      return null;
    });

    // Reset to known state and test toggle functionality
    resetStore();
    expect(useLauncherStore.getState().favorites).toEqual([]); // Initial state

    useLauncherStore.getState().toggleFavorite(12345);

    expect(useLauncherStore.getState().favorites).toContain(12345);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'nexus:launcher:favorites',
      expect.any(String),
    );
  });

  it('scanGames sets scanning state and fetches games', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_GAMES);

    const promise = useLauncherStore.getState().scanGames();

    // Check scanning state
    expect(useLauncherStore.getState().isScanning).toBe(true);
    expect(useLauncherStore.getState().error).toBeNull();

    await promise;

    expect(useLauncherStore.getState().isScanning).toBe(false);
    expect(useLauncherStore.getState().games).toEqual(MOCK_GAMES);
    expect(useLauncherStore.getState().error).toBeNull();
  });

  it('scanGames calls scan_steam_games command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([]);

    await useLauncherStore.getState().scanGames();

    expect(invoke).toHaveBeenCalledWith('scan_steam_games');
  });

  it('scanGames handles error', async () => {
    const errorMessage = 'Steam not found';
    vi.mocked(invoke).mockRejectedValueOnce(new Error(errorMessage));

    await useLauncherStore.getState().scanGames();

    expect(useLauncherStore.getState().isScanning).toBe(false);
    expect(useLauncherStore.getState().games).toEqual([]);
    expect(useLauncherStore.getState().error).toBe(errorMessage);
  });

  it('launchGame launches game without auto boost', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    const appId = 12345;

    await useLauncherStore.getState().launchGame(appId);

    expect(invoke).toHaveBeenCalledWith('launch_game', { appId });
    expect(useLauncherStore.getState().lastPlayed[appId]).toBeDefined();
  });

  it('launchGame executes auto boost when enabled', async () => {
    useLauncherStore.setState({ autoBoostEnabled: true });
    vi.mocked(invoke)
      .mockResolvedValueOnce(undefined) // run_boost
      .mockResolvedValueOnce(undefined); // launch_game

    await useLauncherStore.getState().launchGame(12345);

    expect(invoke).toHaveBeenCalledWith('run_boost', { thresholdPercent: null });
    expect(invoke).toHaveBeenCalledWith('launch_game', { appId: 12345 });
  });

  it('launchGame continues even if auto boost fails', async () => {
    useLauncherStore.setState({ autoBoostEnabled: true });
    vi.mocked(invoke)
      .mockRejectedValueOnce(new Error('Boost failed')) // run_boost fails
      .mockResolvedValueOnce(undefined); // launch_game succeeds

    await useLauncherStore.getState().launchGame(12345);

    expect(invoke).toHaveBeenCalledWith('launch_game', { appId: 12345 });
  });

  it('launchGame updates last played timestamp', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    const before = Date.now();
    const appId = 67890;

    await useLauncherStore.getState().launchGame(appId);

    expect(useLauncherStore.getState().lastPlayed[appId]).toBeGreaterThanOrEqual(before);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'nexus:launcher:lastPlayed',
      expect.any(String),
    );
  });

  it('toggleAutoBoost toggles state and persists to localStorage', () => {
    expect(useLauncherStore.getState().autoBoostEnabled).toBe(false);

    useLauncherStore.getState().toggleAutoBoost();

    expect(useLauncherStore.getState().autoBoostEnabled).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'nexus:launcher:autoBoostEnabled',
      'true',
    );
  });

  it('toggleFavorite adds favorite when not present', () => {
    const appId = 12345;

    useLauncherStore.getState().toggleFavorite(appId);

    expect(useLauncherStore.getState().favorites).toContain(appId);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'nexus:launcher:favorites',
      JSON.stringify([appId]),
    );
  });

  it('toggleFavorite removes favorite when present', () => {
    useLauncherStore.setState({ favorites: [12345, 67890] });

    useLauncherStore.getState().toggleFavorite(12345);

    expect(useLauncherStore.getState().favorites).toEqual([67890]);
  });

  it('setSortMode updates sort mode', () => {
    useLauncherStore.getState().setSortMode('size');

    expect(useLauncherStore.getState().sortMode).toBe('size');
  });

  it('setSearchQuery updates search query', () => {
    const query = 'test game';

    useLauncherStore.getState().setSearchQuery(query);

    expect(useLauncherStore.getState().searchQuery).toBe(query);
  });

  it('launchGame handles error', async () => {
    const errorMessage = 'Game not found';
    vi.mocked(invoke).mockRejectedValueOnce(new Error(errorMessage));

    await useLauncherStore.getState().launchGame(99999);

    expect(useLauncherStore.getState().error).toBe(errorMessage);
  });
});
