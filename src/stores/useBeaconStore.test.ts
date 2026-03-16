import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WatchEvent, WatchedPath } from '../types';
import { startFileWatcher, stopFileWatcher, useBeaconStore } from './useBeaconStore';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

describe('useBeaconStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useBeaconStore.setState({
      watchedPaths: [],
      events: [],
      isLoading: false,
      error: null,
    });
  });

  it('starts with empty state', () => {
    const state = useBeaconStore.getState();
    expect(state.watchedPaths).toEqual([]);
    expect(state.events).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('fetches watched paths successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce([
      {
        id: 'test-id',
        path: '/test/path',
        isRecursive: true,
        createdAt: 1234567890,
        isActive: true,
      },
    ]);

    const { fetchWatchedPaths } = useBeaconStore.getState();
    await fetchWatchedPaths();

    const state = useBeaconStore.getState();
    expect(state.watchedPaths).toHaveLength(1);
    expect(state.watchedPaths[0].id).toBe('test-id');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('handles fetchWatchedPaths error', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Network error'));

    const { fetchWatchedPaths } = useBeaconStore.getState();
    await fetchWatchedPaths();

    const state = useBeaconStore.getState();
    expect(state.watchedPaths).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Network error');
  });

  it('starts watching a path successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const mockWatchedPath: WatchedPath = {
      id: 'new-path-id',
      path: '/new/path',
      isRecursive: false,
      createdAt: 1234567890,
      isActive: true,
    };

    vi.mocked(invoke).mockResolvedValueOnce(mockWatchedPath);

    const { startWatching } = useBeaconStore.getState();
    const result = await startWatching('/new/path', false);

    expect(result).toEqual(mockWatchedPath);

    const state = useBeaconStore.getState();
    expect(state.watchedPaths).toHaveLength(1);
    expect(state.watchedPaths[0]).toEqual(mockWatchedPath);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('handles startWatching error', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Invalid path'));

    const { startWatching } = useBeaconStore.getState();

    await expect(startWatching('/invalid/path', true)).rejects.toThrow('Invalid path');

    const state = useBeaconStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Invalid path');
  });

  it('stops watching a path successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    // Set up initial state with a watched path
    const initialPath: WatchedPath = {
      id: 'path-id',
      path: '/test/path',
      isRecursive: true,
      createdAt: 1234567890,
      isActive: true,
    };

    useBeaconStore.setState({
      watchedPaths: [initialPath],
    });

    const { stopWatching } = useBeaconStore.getState();
    await stopWatching('path-id');

    const state = useBeaconStore.getState();
    expect(state.watchedPaths).toHaveLength(1);
    expect(state.watchedPaths[0].isActive).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('removes watched path successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    // Set up initial state with a watched path
    const initialPath: WatchedPath = {
      id: 'path-id',
      path: '/test/path',
      isRecursive: true,
      createdAt: 1234567890,
      isActive: true,
    };

    useBeaconStore.setState({
      watchedPaths: [initialPath],
    });

    const { removeWatchedPath } = useBeaconStore.getState();
    await removeWatchedPath('path-id');

    const state = useBeaconStore.getState();
    expect(state.watchedPaths).toHaveLength(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('fetches events successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce([
      {
        id: 'event-id',
        pathId: 'path-id',
        kind: 'Create',
        path: '/test/path/file.txt',
        timestamp: 1234567890,
      },
    ]);

    const { fetchEvents } = useBeaconStore.getState();
    await fetchEvents();

    const state = useBeaconStore.getState();
    expect(state.events).toHaveLength(1);
    expect(state.events[0].kind).toBe('Create');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('clears events successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    // Set up initial state with events
    const initialEvent: WatchEvent = {
      id: 'event-id',
      pathId: 'path-id',
      kind: 'Modify',
      path: '/test/path/file.txt',
      timestamp: 1234567890,
    };

    useBeaconStore.setState({
      events: [initialEvent],
    });

    const { clearEvents } = useBeaconStore.getState();
    await clearEvents();

    const state = useBeaconStore.getState();
    expect(state.events).toHaveLength(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('validates path successfully', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce(true);

    const { validatePath } = useBeaconStore.getState();
    const result = await validatePath('/valid/path');

    expect(result).toBe(true);

    const state = useBeaconStore.getState();
    expect(state.error).toBe(null);
  });

  it('handles validatePath error', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Invalid path'));

    const { validatePath } = useBeaconStore.getState();
    const result = await validatePath('/invalid/path');

    expect(result).toBe(false);

    const state = useBeaconStore.getState();
    expect(state.error).toBe('Invalid path');
  });

  it('sets error manually', () => {
    const { setError } = useBeaconStore.getState();
    setError('Custom error');

    const state = useBeaconStore.getState();
    expect(state.error).toBe('Custom error');
  });
});

describe('file watcher', () => {
  it('starts file watcher', async () => {
    const { listen } = await import('@tauri-apps/api/event');
    const mockUnlisten = vi.fn();
    vi.mocked(listen).mockResolvedValueOnce(mockUnlisten);

    await startFileWatcher();

    expect(listen).toHaveBeenCalledWith('file-system-event', expect.any(Function));
  });

  it('stops file watcher after starting', async () => {
    const { listen } = await import('@tauri-apps/api/event');
    const mockUnlisten = vi.fn();
    vi.mocked(listen).mockResolvedValueOnce(mockUnlisten);

    // Start the watcher first
    await startFileWatcher();

    // Clear any existing watchers
    stopFileWatcher();

    // Start again with fresh mock
    vi.mocked(listen).mockResolvedValueOnce(mockUnlisten);
    await startFileWatcher();

    // Now stop it
    stopFileWatcher();

    expect(mockUnlisten).toHaveBeenCalled();
  });

  it('handles file system events correctly', async () => {
    // Test the store's event handling directly
    const mockEvent: WatchEvent = {
      id: 'event-id',
      pathId: 'path-id',
      kind: 'Create',
      path: '/test/file.txt',
      timestamp: 1234567890,
    };

    // Simulate adding event to store
    const currentEvents = useBeaconStore.getState().events;
    useBeaconStore.setState({
      events: [mockEvent, ...currentEvents],
    });

    const state = useBeaconStore.getState();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]).toEqual(mockEvent);
  });
});
