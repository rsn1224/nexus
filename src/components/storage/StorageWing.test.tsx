import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../stores/useStorageStore', () => ({
  useStorage: vi.fn(),
  formatBytes: (b: number) => `${b}B`,
  getUsagePercentage: (used: number, total: number) => (total ? (used / total) * 100 : 0),
}));

vi.mock('../../hooks/useInitialData', () => ({
  useInitialData: vi.fn(),
  useStateSync: vi.fn(),
}));

import { useStorage } from '../../stores/useStorageStore';
import StorageWing from './StorageWing';

const mockUseStorage = vi.mocked(useStorage);

const BASE_STORE = {
  storageInfo: null,
  cleanupResult: null,
  analysisResults: [] as string[],
  isLoading: false,
  error: null,
  fetchStorageInfo: vi.fn(),
  cleanupTempFiles: vi.fn(),
  cleanupRecycleBin: vi.fn(),
  cleanupSystemCache: vi.fn(),
  runFullCleanup: vi.fn(),
  analyzeDiskUsage: vi.fn(),
  clearError: vi.fn(),
  reset: vi.fn(),
};

describe('StorageWing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStorage.mockReturnValue({ ...BASE_STORE });
  });

  it('renders refresh button', () => {
    render(<StorageWing />);
    expect(screen.getByText(/REFRESH/i)).toBeTruthy();
  });

  it('renders cleanup buttons', () => {
    render(<StorageWing />);
    expect(screen.getByText('TEMP FILES')).toBeTruthy();
    expect(screen.getByText('RECYCLE BIN')).toBeTruthy();
    expect(screen.getByText('SYSTEM CACHE')).toBeTruthy();
    expect(screen.getByText('FULL CLEANUP')).toBeTruthy();
  });

  it('shows loading indicator when isLoading', () => {
    mockUseStorage.mockReturnValue({ ...BASE_STORE, isLoading: true });
    render(<StorageWing />);
    expect(screen.getByText(/LOADING/i)).toBeTruthy();
  });

  it('shows error banner when error is set', () => {
    mockUseStorage.mockReturnValue({ ...BASE_STORE, error: 'disk error' });
    render(<StorageWing />);
    expect(screen.getByText(/disk error/i)).toBeTruthy();
  });

  it('renders storage overview when storageInfo is provided', () => {
    mockUseStorage.mockReturnValue({
      ...BASE_STORE,
      storageInfo: {
        drives: [
          {
            name: 'C:',
            model: 'SSD',
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
      },
    });
    render(<StorageWing />);
    expect(screen.getByText('OVERVIEW')).toBeTruthy();
    expect(screen.getByText('DRIVES')).toBeTruthy();
    expect(screen.getByText('C:')).toBeTruthy();
  });

  it('renders cleanup results when cleanupResult is provided', () => {
    mockUseStorage.mockReturnValue({
      ...BASE_STORE,
      cleanupResult: {
        tempFilesCleaned: 100_000,
        recycleBinCleaned: 50_000,
        systemCacheCleaned: 20_000,
        totalFreedBytes: 170_000,
      },
    });
    render(<StorageWing />);
    expect(screen.getByText(/SCAN RESULTS/i)).toBeTruthy();
  });
});
