import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStorage } from './storageHooks';

vi.mock('../stores/useStorageStore', () => {
  const mockStore = vi.fn();
  return { useStorageStore: mockStore };
});

import { useStorageStore } from '../stores/useStorageStore';

const mockStoreState = {
  storageInfo: { totalGb: 500, usedGb: 200 },
  cleanupResult: null,
  analysisResults: [],
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

describe('useStorage', () => {
  beforeEach(() => {
    vi.mocked(useStorageStore).mockReturnValue(mockStoreState);
  });

  it('ストレージ情報とアクションを正しい形で返す', () => {
    const { result } = renderHook(() => useStorage());

    expect(result.current).toEqual(
      expect.objectContaining({
        storageInfo: mockStoreState.storageInfo,
        cleanupResult: null,
        analysisResults: [],
        isLoading: false,
        error: null,
        fetchStorageInfo: expect.any(Function),
        cleanupTempFiles: expect.any(Function),
        cleanupRecycleBin: expect.any(Function),
        cleanupSystemCache: expect.any(Function),
        runFullCleanup: expect.any(Function),
        analyzeDiskUsage: expect.any(Function),
        clearError: expect.any(Function),
        reset: expect.any(Function),
      }),
    );
  });

  it('storageInfo が null の場合も正しく返す', () => {
    vi.mocked(useStorageStore).mockReturnValue({
      ...mockStoreState,
      storageInfo: null,
    });

    const { result } = renderHook(() => useStorage());

    expect(result.current.storageInfo).toBeNull();
  });

  it('エラーがある場合も正しく返す', () => {
    vi.mocked(useStorageStore).mockReturnValue({
      ...mockStoreState,
      error: 'disk error',
    });

    const { result } = renderHook(() => useStorage());

    expect(result.current.error).toBe('disk error');
  });
});
