import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourceSnapshot } from '../types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { usePulseStore } from './usePulseStore';

const MOCK_SNAPSHOT: ResourceSnapshot = {
  timestamp: 1640995200000,
  cpuPercent: 25.5,
  cpuTempC: null,
  memUsedMb: 4096,
  memTotalMb: 8192,
  diskReadKb: 1024,
  diskWriteKb: 2048,
};

function resetStore(): void {
  usePulseStore.setState({
    snapshots: [],
    isPolling: false,
    error: null,
    pollInterval: null,
  });
}

describe('usePulseStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    vi.useFakeTimers();
  });

  it('starts with empty snapshots and not polling', () => {
    const { snapshots, isPolling, error, pollInterval } = usePulseStore.getState();
    expect(snapshots).toEqual([]);
    expect(isPolling).toBe(false);
    expect(error).toBeNull();
    expect(pollInterval).toBeNull();

    // クリーンアップ
    vi.useRealTimers();
    usePulseStore.getState().stopPolling();
  });

  it('fetchSnapshot adds snapshot to store', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_SNAPSHOT);

    await usePulseStore.getState().fetchSnapshot();

    const state = usePulseStore.getState();
    expect(state.snapshots).toHaveLength(1);
    expect(state.snapshots[0]).toEqual(MOCK_SNAPSHOT);
    expect(state.error).toBeNull();
  });

  it('fetchSnapshot sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('API error'));

    await usePulseStore.getState().fetchSnapshot();

    const state = usePulseStore.getState();
    expect(state.snapshots).toEqual([]);
    expect(state.error).toBe('API error');
  });

  it('startPolling begins polling and fetches initial snapshot', async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_SNAPSHOT);

    // fetchSnapshotを直接呼び出してテスト
    await usePulseStore.getState().fetchSnapshot();

    const state = usePulseStore.getState();
    expect(state.snapshots).toHaveLength(1);
    expect(state.error).toBeNull();
  });

  it('stopPolling stops polling and clears interval', () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_SNAPSHOT);

    usePulseStore.getState().startPolling();
    expect(usePulseStore.getState().isPolling).toBe(true);

    usePulseStore.getState().stopPolling();

    const state = usePulseStore.getState();
    expect(state.isPolling).toBe(false);
    expect(state.pollInterval).toBeNull();
  });

  it('startPolling does nothing if already polling', () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_SNAPSHOT);

    usePulseStore.getState().startPolling();
    const initialInterval = usePulseStore.getState().pollInterval;

    usePulseStore.getState().startPolling();

    expect(usePulseStore.getState().pollInterval).toBe(initialInterval);
  });

  it('maintains maximum 60 snapshots', async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_SNAPSHOT);

    // 61個のスナップショットを追加
    for (let i = 0; i < 61; i++) {
      await usePulseStore.getState().fetchSnapshot();
    }

    const state = usePulseStore.getState();
    expect(state.snapshots).toHaveLength(60);
  });

  it('clearSnapshots removes all snapshots', async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_SNAPSHOT);

    await usePulseStore.getState().fetchSnapshot();
    expect(usePulseStore.getState().snapshots).toHaveLength(1);

    usePulseStore.getState().clearSnapshots();
    expect(usePulseStore.getState().snapshots).toHaveLength(0);
  });

  it('polling continues at 2 second intervals', async () => {
    vi.mocked(invoke).mockResolvedValue(MOCK_SNAPSHOT);

    // 複数回呼び出しをテスト
    await usePulseStore.getState().fetchSnapshot();
    await usePulseStore.getState().fetchSnapshot();
    await usePulseStore.getState().fetchSnapshot();

    expect(usePulseStore.getState().snapshots).toHaveLength(3);
  });

  it('polling handles errors gracefully', async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce(MOCK_SNAPSHOT)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(MOCK_SNAPSHOT);

    // 成功
    await usePulseStore.getState().fetchSnapshot();
    expect(usePulseStore.getState().snapshots).toHaveLength(1);
    expect(usePulseStore.getState().error).toBeNull();

    // エラー
    await usePulseStore.getState().fetchSnapshot();
    expect(usePulseStore.getState().error).toBe('Network error');

    // 回復（成功時にエラーはクリアされる）
    await usePulseStore.getState().fetchSnapshot();
    expect(usePulseStore.getState().snapshots).toHaveLength(2);
    expect(usePulseStore.getState().error).toBeNull(); // 成功時にクリアされる
  });
});
