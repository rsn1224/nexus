import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
  UnlistenFn: vi.fn(),
}));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { listen } from '@tauri-apps/api/event';
import { createDiskProgressBar, useHardwareStore } from './useHardwareStore';

const MOCK_HARDWARE_INFO: import('../types').HardwareInfo = {
  cpuName: 'Intel Core i7-9700K',
  cpuCores: 8,
  cpuThreads: 8,
  cpuBaseGhz: 3.6,
  cpuTempC: 45.5,
  memTotalGb: 16.0,
  memUsedGb: 8.5,
  osName: 'Windows 11',
  osVersion: '21H2',
  hostname: 'DESKTOP-ABC123',
  uptimeSecs: 86400,
  bootTimeUnix: 1640995200,
  disks: [
    {
      mount: 'C:',
      kind: 'NTFS',
      totalGb: 500,
      usedGb: 250,
    },
    {
      mount: 'D:',
      kind: 'NTFS',
      totalGb: 1000,
      usedGb: 750,
    },
  ],
  gpuName: 'NVIDIA GeForce RTX 3080',
  gpuVramTotalMb: 10240,
  gpuVramUsedMb: 5120,
  gpuTempC: 65.0,
  gpuUsagePercent: 75.5,
};

function resetStore(): void {
  useHardwareStore.setState({
    info: null,
    isListening: false,
    error: null,
    lastUpdated: null,
  });
  vi.clearAllMocks();
}

describe('useHardwareStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('starts with empty state', () => {
    const { info, isListening, error, lastUpdated } = useHardwareStore.getState();
    expect(info).toBeNull();
    expect(isListening).toBe(false);
    expect(error).toBeNull();
    expect(lastUpdated).toBeNull();
  });

  it('subscribes to nexus://hardware events', () => {
    const mockUnlisten = vi.fn();
    const mockListen = vi.mocked(listen);
    mockListen.mockResolvedValue(mockUnlisten);

    useHardwareStore.getState().subscribe();

    expect(mockListen).toHaveBeenCalledWith('nexus://hardware', expect.any(Function));
  });

  it('handles subscription errors', async () => {
    const mockListen = vi.mocked(listen);
    const testError = new Error('Subscription failed');
    mockListen.mockRejectedValue(testError);

    useHardwareStore.getState().subscribe();

    // エラー状態の確認を少し待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    const { error, isListening, info } = useHardwareStore.getState();
    expect(error).toBe('Subscription failed');
    expect(isListening).toBe(false);
    expect(info).toEqual({
      cpuName: 'Unknown CPU',
      cpuCores: 0,
      cpuThreads: 0,
      cpuBaseGhz: 0,
      cpuTempC: null,
      memTotalGb: 0,
      memUsedGb: 0,
      osName: 'Unknown OS',
      osVersion: 'Unknown',
      hostname: 'Unknown',
      uptimeSecs: 0,
      bootTimeUnix: 0,
      disks: [],
      gpuName: null,
      gpuVramTotalMb: null,
      gpuVramUsedMb: null,
      gpuTempC: null,
      gpuUsagePercent: null,
    });
  });

  it('prevents duplicate subscriptions', async () => {
    const mockListen = vi.mocked(listen);
    mockListen.mockResolvedValue(vi.fn());

    useHardwareStore.getState().subscribe();
    useHardwareStore.getState().subscribe();

    expect(mockListen).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes correctly', async () => {
    const mockUnlisten = vi.fn();
    const mockListen = vi.mocked(listen);
    mockListen.mockResolvedValue(mockUnlisten);

    useHardwareStore.getState().subscribe();
    // 非同期で unlisten が設定されるのを待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    useHardwareStore.getState().unsubscribe();

    expect(mockUnlisten).toHaveBeenCalled();
    const { isListening } = useHardwareStore.getState();
    expect(isListening).toBe(false);
  });

  it('processes incoming hardware events', async () => {
    const mockListen = vi.mocked(listen);
    let eventCallback: ((event: { payload: import('../types').HardwareInfo }) => void) | undefined;

    mockListen.mockImplementation((event, callback) => {
      if (event === 'nexus://hardware') {
        eventCallback = callback as (event: { payload: import('../types').HardwareInfo }) => void;
      }
      return Promise.resolve(vi.fn());
    });

    useHardwareStore.getState().subscribe();

    // イベントをシミュレート
    expect(eventCallback).toBeDefined();
    eventCallback?.({ payload: MOCK_HARDWARE_INFO });

    const { info, lastUpdated } = useHardwareStore.getState();
    expect(info).toEqual(MOCK_HARDWARE_INFO);
    expect(lastUpdated).toBeGreaterThan(0);
  });

  it('clearError removes error state', () => {
    useHardwareStore.setState({
      info: null,
      isListening: false,
      error: 'Test error',
      lastUpdated: null,
    });

    useHardwareStore.getState().clearError();

    const { error } = useHardwareStore.getState();
    expect(error).toBeNull();
  });

  describe('createDiskProgressBar', () => {
    it('creates correct progress bar', () => {
      expect(createDiskProgressBar(250, 500)).toBe('█████░░░░░');
      expect(createDiskProgressBar(0, 100)).toBe('░░░░░░░░░░');
      expect(createDiskProgressBar(100, 100)).toBe('██████████');
      expect(createDiskProgressBar(50, 100)).toBe('█████░░░░░');
    });
  });
});
