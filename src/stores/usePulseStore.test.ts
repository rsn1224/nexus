import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResourceSnapshot } from '../types';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
  UnlistenFn: vi.fn(),
}));

vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { listen } from '@tauri-apps/api/event';
import { usePulseStore } from './usePulseStore';

const MOCK_SNAPSHOT: ResourceSnapshot = {
  timestamp: 1640995200000,
  cpuPercent: 25.5,
  cpuTempC: null,
  memUsedMb: 4096,
  memTotalMb: 8192,
  diskReadKb: 1024,
  diskWriteKb: 2048,
  netRecvKb: 0,
  netSentKb: 0,
};

function resetStore(): void {
  usePulseStore.setState({
    snapshots: [],
    isListening: false,
    error: null,
  });
}

describe('usePulseStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty snapshots and not listening', () => {
    const { snapshots, isListening, error } = usePulseStore.getState();
    expect(snapshots).toEqual([]);
    expect(isListening).toBe(false);
    expect(error).toBeNull();
  });

  it('subscribes to nexus://pulse events', () => {
    const mockUnlisten = vi.fn();
    const mockListen = vi.mocked(listen);
    mockListen.mockResolvedValue(mockUnlisten);

    usePulseStore.getState().subscribe();

    expect(mockListen).toHaveBeenCalledWith('nexus://pulse', expect.any(Function));
  });

  it('handles subscription errors', async () => {
    const mockListen = vi.mocked(listen);
    const testError = new Error('Subscription failed');
    mockListen.mockRejectedValue(testError);

    usePulseStore.getState().subscribe();

    // エラー状態の確認を少し待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    const { error, isListening } = usePulseStore.getState();
    expect(error).toBe('Subscription failed');
    expect(isListening).toBe(false);
  });

  it('prevents duplicate subscriptions', async () => {
    const mockListen = vi.mocked(listen);
    mockListen.mockResolvedValue(vi.fn());

    usePulseStore.getState().subscribe();
    usePulseStore.getState().subscribe();

    expect(mockListen).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes correctly', async () => {
    const mockUnlisten = vi.fn();
    const mockListen = vi.mocked(listen);
    mockListen.mockResolvedValue(mockUnlisten);

    usePulseStore.getState().subscribe();
    // 非同期で unlisten が設定されるのを待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    usePulseStore.getState().unsubscribe();

    expect(mockUnlisten).toHaveBeenCalled();
    const { isListening } = usePulseStore.getState();
    expect(isListening).toBe(false);
  });

  it('processes incoming pulse events', async () => {
    const mockListen = vi.mocked(listen);
    let eventCallback: ((event: { payload: ResourceSnapshot }) => void) | undefined;

    mockListen.mockImplementation((event, callback) => {
      if (event === 'nexus://pulse') {
        eventCallback = callback as (event: { payload: ResourceSnapshot }) => void;
      }
      return Promise.resolve(vi.fn());
    });

    usePulseStore.getState().subscribe();

    // イベントをシミュレート
    expect(eventCallback).toBeDefined();
    eventCallback!({ payload: MOCK_SNAPSHOT });

    const { snapshots } = usePulseStore.getState();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual(MOCK_SNAPSHOT);
  });

  it('limits snapshots to MAX_SNAPSHOTS', async () => {
    const mockListen = vi.mocked(listen);
    let eventCallback: ((event: { payload: ResourceSnapshot }) => void) | undefined;

    mockListen.mockImplementation((event, callback) => {
      if (event === 'nexus://pulse') {
        eventCallback = callback as (event: { payload: ResourceSnapshot }) => void;
      }
      return Promise.resolve(vi.fn());
    });

    usePulseStore.getState().subscribe();

    // 61個のスナップショットを送信（MAX_SNAPSHOTS = 60）
    const baseTime = Date.now();
    for (let i = 0; i < 61; i++) {
      eventCallback?.({ payload: { ...MOCK_SNAPSHOT, timestamp: baseTime + i } });
    }

    const { snapshots } = usePulseStore.getState();
    expect(snapshots).toHaveLength(60);
    expect(snapshots[0].timestamp).toBe(baseTime + 1); // 最も古いものは削除されている
    expect(snapshots[59].timestamp).toBe(baseTime + 60); // 最も新しいものが最後
  });

  it('clears snapshots', () => {
    // スナップショットを追加
    usePulseStore.setState({
      snapshots: [MOCK_SNAPSHOT],
      isListening: false,
      error: null,
    });

    usePulseStore.getState().clearSnapshots();

    const { snapshots } = usePulseStore.getState();
    expect(snapshots).toEqual([]);
  });
});
