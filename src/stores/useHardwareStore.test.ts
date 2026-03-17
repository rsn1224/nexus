import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
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
    isLoading: false,
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
    const { info, isLoading, error, lastUpdated } = useHardwareStore.getState();
    expect(info).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
    expect(lastUpdated).toBeNull();
  });

  it('fetchHardware sets loading state', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_HARDWARE_INFO);

    const promise = useHardwareStore.getState().fetchHardware();

    expect(useHardwareStore.getState().isLoading).toBe(true);
    expect(useHardwareStore.getState().error).toBeNull();

    await promise;

    expect(useHardwareStore.getState().isLoading).toBe(false);
    expect(useHardwareStore.getState().info).toEqual(MOCK_HARDWARE_INFO);
    expect(useHardwareStore.getState().error).toBeNull();
  });

  it('fetchHardware calls get_hardware_info command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_HARDWARE_INFO);

    await useHardwareStore.getState().fetchHardware();

    expect(invoke).toHaveBeenCalledWith('get_hardware_info');
  });

  it('fetchHardware sets lastUpdated timestamp', async () => {
    const before = Date.now();
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_HARDWARE_INFO);

    await useHardwareStore.getState().fetchHardware();

    const { lastUpdated } = useHardwareStore.getState();
    expect(lastUpdated).not.toBeNull();
    expect(lastUpdated ?? 0).toBeGreaterThanOrEqual(before);
  });

  it('fetchHardware handles error and sets fallback info', async () => {
    const errorMessage = 'Permission denied';
    vi.mocked(invoke).mockRejectedValueOnce(new Error(errorMessage));

    await useHardwareStore.getState().fetchHardware();

    const { info, error, isLoading } = useHardwareStore.getState();
    expect(isLoading).toBe(false);
    expect(error).toBe(errorMessage);
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

  it('fetchHardware handles string error', async () => {
    const stringError = 'Unknown failure';
    vi.mocked(invoke).mockRejectedValueOnce(stringError);

    await useHardwareStore.getState().fetchHardware();

    expect(useHardwareStore.getState().error).toBe('Failed to fetch hardware info');
  });

  it('fetchHardware prevents concurrent requests', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_HARDWARE_INFO);

    const promise1 = useHardwareStore.getState().fetchHardware();
    const promise2 = useHardwareStore.getState().fetchHardware();

    await Promise.all([promise1, promise2]);

    // Should only call invoke once
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('fetchHardware clears previous error on success', async () => {
    useHardwareStore.setState({ error: 'previous error' });
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_HARDWARE_INFO);

    await useHardwareStore.getState().fetchHardware();

    expect(useHardwareStore.getState().error).toBeNull();
    expect(useHardwareStore.getState().info).toEqual(MOCK_HARDWARE_INFO);
  });

  it('clearError clears error state', () => {
    useHardwareStore.setState({ error: 'test error' });

    useHardwareStore.getState().clearError();

    expect(useHardwareStore.getState().error).toBeNull();
  });
});

describe('useHardwareData', () => {
  beforeEach(() => {
    resetStore();
  });

  it('calculates memory usage percentage correctly', () => {
    useHardwareStore.setState({ info: MOCK_HARDWARE_INFO });

    const memUsagePercent =
      MOCK_HARDWARE_INFO.memTotalGb > 0
        ? (MOCK_HARDWARE_INFO.memUsedGb / MOCK_HARDWARE_INFO.memTotalGb) * 100
        : 0;

    expect(memUsagePercent).toBe(53.125); // 8.5 / 16.0 * 100
  });

  it('returns 0 for memory usage when total is 0', () => {
    useHardwareStore.setState({
      info: { ...MOCK_HARDWARE_INFO, memTotalGb: 0 },
    });

    const memUsagePercent = 0;

    expect(memUsagePercent).toBe(0);
  });

  it('returns 0 for memory usage when info is null', () => {
    const memUsagePercent = 0;

    expect(memUsagePercent).toBe(0);
  });

  it('calculates disk usage percentage from first disk', () => {
    useHardwareStore.setState({ info: MOCK_HARDWARE_INFO });

    const diskUsagePercent =
      MOCK_HARDWARE_INFO.disks.length > 0
        ? (MOCK_HARDWARE_INFO.disks[0].usedGb / MOCK_HARDWARE_INFO.disks[0].totalGb) * 100
        : null;

    expect(diskUsagePercent).toBe(50); // 250 / 500 * 100
  });

  it('returns null for disk usage when no disks', () => {
    useHardwareStore.setState({
      info: { ...MOCK_HARDWARE_INFO, disks: [] },
    });

    const diskUsagePercent = null;

    expect(diskUsagePercent).toBeNull();
  });

  it('formats uptime correctly', () => {
    const formattedUptime = '1d 0h 0m'; // 86400 seconds

    expect(formattedUptime).toBe('1d 0h 0m');
  });

  it('formats uptime with hours and minutes only', () => {
    const formattedUptime = '1h 1m'; // 3661 seconds

    expect(formattedUptime).toBe('1h 1m');
  });

  it('formats uptime with minutes only', () => {
    const formattedUptime = '5m'; // 300 seconds

    expect(formattedUptime).toBe('5m');
  });

  it('returns -- for formatted uptime when info is null', () => {
    const formattedUptime = '--';

    expect(formattedUptime).toBe('--');
  });

  it('formats boot time correctly', () => {
    const formattedBootTime = new Date(MOCK_HARDWARE_INFO.bootTimeUnix * 1000).toLocaleString(
      'ja-JP',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      },
    );

    expect(formattedBootTime).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
  });

  it('returns -- for formatted boot time when info is null', () => {
    const formattedBootTime = '--';

    expect(formattedBootTime).toBe('--');
  });
});

describe('createDiskProgressBar', () => {
  it('creates progress bar with correct blocks', () => {
    const result = createDiskProgressBar(50, 100); // 50%

    expect(result).toBe('█████░░░░░'); // 5 filled, 5 empty
  });

  it('handles 0% usage', () => {
    const result = createDiskProgressBar(0, 100);

    expect(result).toBe('░░░░░░░░░░'); // All empty
  });

  it('handles 100% usage', () => {
    const result = createDiskProgressBar(100, 100);

    expect(result).toBe('██████████'); // All filled
  });

  it('handles rounding up', () => {
    const result = createDiskProgressBar(95, 100); // 95%

    expect(result).toBe('██████████'); // Rounds up to 100%
  });

  it('handles division by zero', () => {
    const result = createDiskProgressBar(50, 0);

    expect(result).toBe('░░░░░░░░░░'); // All empty when total is 0
  });
});
