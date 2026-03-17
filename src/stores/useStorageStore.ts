import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { CleanupResult, StorageInfo } from '../types';

interface StorageStore {
  storageInfo: StorageInfo | null;
  cleanupResult: CleanupResult | null;
  analysisResults: string[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Actions
  fetchStorageInfo: () => Promise<void>;
  cleanupTempFiles: () => Promise<void>;
  cleanupRecycleBin: () => Promise<void>;
  cleanupSystemCache: () => Promise<void>;
  runFullCleanup: () => Promise<void>;
  analyzeDiskUsage: (driveName: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useStorageStore = create<StorageStore>((set, get) => ({
  storageInfo: null,
  cleanupResult: null,
  analysisResults: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchStorageInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await invoke<StorageInfo>('get_storage_info');
      set({
        storageInfo: info,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch storage information';
      log.error({ err }, 'fetch storage info failed: %s', errorMessage);
      set({
        storageInfo: null,
        error: errorMessage,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    }
  },

  cleanupTempFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const freedBytes = await invoke<number>('cleanup_temp_files');
      log.info('temp files cleanup freed: %d bytes', freedBytes);

      // クリーンアップ後にストレージ情報を再取得
      await get().fetchStorageInfo();

      set({
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup temp files';
      log.error({ err }, 'cleanup temp files failed: %s', errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  cleanupRecycleBin: async () => {
    set({ isLoading: true, error: null });
    try {
      const freedBytes = await invoke<number>('cleanup_recycle_bin');
      log.info('recycle bin cleanup freed: %d bytes', freedBytes);

      // クリーンアップ後にストレージ情報を再取得
      await get().fetchStorageInfo();

      set({
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup recycle bin';
      log.error({ err }, 'cleanup recycle bin failed: %s', errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  cleanupSystemCache: async () => {
    set({ isLoading: true, error: null });
    try {
      const freedBytes = await invoke<number>('cleanup_system_cache');
      log.info('system cache cleanup freed: %d bytes', freedBytes);

      // クリーンアップ後にストレージ情報を再取得
      await get().fetchStorageInfo();

      set({
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup system cache';
      log.error({ err }, 'cleanup system cache failed: %s', errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  runFullCleanup: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await invoke<CleanupResult>('run_full_cleanup');
      log.info('full cleanup result: %O', result);

      // クリーンアップ後にストレージ情報を再取得
      await get().fetchStorageInfo();

      set({
        cleanupResult: result,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run full cleanup';
      log.error({ err }, 'full cleanup failed: %s', errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  analyzeDiskUsage: async (driveName: string) => {
    set({ isLoading: true, error: null });
    try {
      const results = await invoke<string[]>('analyze_disk_usage', { driveName });
      log.info('disk usage analysis for %s: %O', driveName, results);

      set({
        analysisResults: results,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze disk usage';
      log.error({ err }, 'analyze disk usage failed: %s', errorMessage);
      set({
        analysisResults: [],
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      storageInfo: null,
      cleanupResult: null,
      analysisResults: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
  },
}));

// セレクター関数
export const useStorage = () => {
  const {
    storageInfo,
    cleanupResult,
    analysisResults,
    isLoading,
    error,
    fetchStorageInfo,
    cleanupTempFiles,
    cleanupRecycleBin,
    cleanupSystemCache,
    runFullCleanup,
    analyzeDiskUsage,
    clearError,
    reset,
  } = useStorageStore();

  return {
    storageInfo,
    cleanupResult,
    analysisResults,
    isLoading,
    error,
    fetchStorageInfo,
    cleanupTempFiles,
    cleanupRecycleBin,
    cleanupSystemCache,
    runFullCleanup,
    analyzeDiskUsage,
    clearError,
    reset,
  };
};

// ユーティリティ関数
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(1)} ${units[i]}`;
};

export const getHealthColor = (status: string): string => {
  switch (status) {
    case 'Good':
      return 'var(--color-success-500)';
    case 'Warning':
      return 'var(--color-warning-500)';
    case 'Critical':
      return 'var(--color-danger-500)';
    default:
      return 'var(--color-text-muted)';
  }
};

export const getUsagePercentage = (used: number, total: number): number => {
  if (total === 0) return 0;
  return (used / total) * 100;
};
