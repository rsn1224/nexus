import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

import { invoke } from '@tauri-apps/api/core';
import { useLauncherStore } from '../stores/useLauncherStore';
import { usePulseStore } from '../stores/usePulseStore';

const mockInvoke = vi.mocked(invoke);

describe('useLauncherStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue(undefined);
    // Zustand ストアを初期状態にリセット
    useLauncherStore.setState({
      autoBoostEnabled: false,
      games: [],
      isScanning: false,
      error: null,
      favorites: [],
      lastPlayed: {},
      sortMode: 'name',
      searchQuery: '',
    });
  });

  it('autoBoostEnabled の初期値は false', () => {
    expect(useLauncherStore.getState().autoBoostEnabled).toBe(false);
  });

  it('toggleAutoBoost で true に切り替わる', () => {
    useLauncherStore.getState().toggleAutoBoost();
    expect(useLauncherStore.getState().autoBoostEnabled).toBe(true);
  });

  it('toggleAutoBoost を2回呼ぶと false に戻る', () => {
    useLauncherStore.getState().toggleAutoBoost();
    useLauncherStore.getState().toggleAutoBoost();
    expect(useLauncherStore.getState().autoBoostEnabled).toBe(false);
  });

  it('toggleAutoBoost で Rust 永続化コマンドが呼ばれる', () => {
    useLauncherStore.getState().toggleAutoBoost();
    expect(mockInvoke).toHaveBeenCalledWith('save_launcher_settings_cmd', expect.anything());
  });
});

describe('usePulseStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Zustand ストアを初期状態にリセット
    usePulseStore.setState({
      snapshots: [],
      isPolling: false,
      error: null,
      pollInterval: null,
    });
  });

  it('isPolling の初期値は false', () => {
    expect(usePulseStore.getState().isPolling).toBe(false);
  });

  it('snapshots の初期値は空配列', () => {
    expect(usePulseStore.getState().snapshots).toHaveLength(0);
  });

  it('pollInterval の初期値は null', () => {
    expect(usePulseStore.getState().pollInterval).toBe(null);
  });

  it('error の初期値は null', () => {
    expect(usePulseStore.getState().error).toBe(null);
  });
});
