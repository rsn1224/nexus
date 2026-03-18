import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useStorageStore } from './useStorageStore';

const MOCK_STORAGE_INFO = {
  drives: [
    {
      name: 'C:',
      model: 'Samsung SSD',
      sizeBytes: 512_000_000_000,
      usedBytes: 256_000_000_000,
      availableBytes: 256_000_000_000,
      fileSystem: 'NTFS',
      mountPoint: 'C:\\',
      isRemovable: false,
      healthStatus: 'Good' as const,
    },
  ],
  totalSizeBytes: 512_000_000_000,
  totalUsedBytes: 256_000_000_000,
  totalAvailableBytes: 256_000_000_000,
};

const MOCK_CLEANUP_RESULT = {
  tempFilesCleaned: 42,
  recycleBinCleaned: 10,
  systemCacheCleaned: 8,
  totalFreedBytes: 1_073_741_824,
};

function resetStore(): void {
  useStorageStore.setState({
    storageInfo: null,
    cleanupResult: null,
    analysisResults: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });
}

describe('useStorageStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { storageInfo, cleanupResult, isLoading, error } = useStorageStore.getState();
    expect(storageInfo).toBeNull();
    expect(cleanupResult).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchStorageInfo sets storageInfo on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_STORAGE_INFO);
    await useStorageStore.getState().fetchStorageInfo();
    expect(useStorageStore.getState().storageInfo).toEqual(MOCK_STORAGE_INFO);
    expect(useStorageStore.getState().isLoading).toBe(false);
    expect(useStorageStore.getState().error).toBeNull();
  });

  it('fetchStorageInfo sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('disk error'));
    await useStorageStore.getState().fetchStorageInfo();
    expect(useStorageStore.getState().error).toBe('disk error');
    expect(useStorageStore.getState().isLoading).toBe(false);
  });

  it('runFullCleanup sets cleanupResult on success', async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce(MOCK_CLEANUP_RESULT)
      .mockResolvedValueOnce(MOCK_STORAGE_INFO);
    await useStorageStore.getState().runFullCleanup();
    expect(useStorageStore.getState().cleanupResult).toEqual(MOCK_CLEANUP_RESULT);
  });

  it('analyzeDiskUsage sets analysisResults on success', async () => {
    const results = ['dir1 - 10GB', 'dir2 - 5GB'];
    vi.mocked(invoke).mockResolvedValueOnce(results);
    await useStorageStore.getState().analyzeDiskUsage('C:');
    expect(useStorageStore.getState().analysisResults).toEqual(results);
    expect(invoke).toHaveBeenCalledWith('analyze_disk_usage', { driveName: 'C:' });
  });

  it('clearError clears error state', () => {
    useStorageStore.setState({ error: 'some error' });
    useStorageStore.getState().clearError();
    expect(useStorageStore.getState().error).toBeNull();
  });

  it('reset restores initial state', () => {
    useStorageStore.setState({ storageInfo: MOCK_STORAGE_INFO, isLoading: true });
    useStorageStore.getState().reset();
    const { storageInfo, isLoading, error } = useStorageStore.getState();
    expect(storageInfo).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });
});
