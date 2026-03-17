import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

import { useLauncherStore } from '../stores/useLauncherStore';
import { usePulseStore } from '../stores/usePulseStore';

describe('useLauncherStore', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('autoBoostEnabled の初期値は false（localStorage が空の場合）', () => {
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

  it('toggleAutoBoost で localStorage に保存される', () => {
    useLauncherStore.getState().toggleAutoBoost();
    expect(localStorage.getItem('nexus:launcher:autoBoostEnabled')).toBe('true');
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
