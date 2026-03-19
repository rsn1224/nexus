import { create } from 'zustand';
import log from '../lib/logger';
import { formatBytes, getHealthColor, getUsagePercentage } from '../lib/storage';
import {
  analyzeDiskUsage as cmdAnalyzeDiskUsage,
  cleanupRecycleBin as cmdCleanupRecycleBin,
  cleanupSystemCache as cmdCleanupSystemCache,
  cleanupTempFiles as cmdCleanupTempFiles,
  fetchStorageInfo as cmdFetchStorageInfo,
  runFullCleanup as cmdRunFullCleanup,
} from '../lib/storageCommands';
import { extractErrorMessage } from '../lib/tauri';
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
      const info = await cmdFetchStorageInfo();
      set({
        storageInfo: info,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
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
      const freedBytes = await cmdCleanupTempFiles();
      log.info('temp files cleanup freed: %d bytes', freedBytes);

      // クリーンアップ後にストレージ情報を再取得
      await get().fetchStorageInfo();

      set({
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'cleanup temp files failed: %s', errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
        cleanupResult: null,
        lastUpdated: Date.now(),
      });
    }
  },

  cleanupRecycleBin: async () => {
    set({ isLoading: true, error: null });
    try {
      const freedBytes = await cmdCleanupRecycleBin();
      log.info('recycle bin cleanup freed: %d bytes', freedBytes);

      // クリーンアップ後にストレージ情報を再取得
      await get().fetchStorageInfo();

      set({
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'cleanup recycle bin failed: %s', errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
        cleanupResult: null,
        lastUpdated: Date.now(),
      });
    }
  },

  cleanupSystemCache: async () => {
    set({ isLoading: true, error: null });
    try {
      const freedBytes = await cmdCleanupSystemCache();
      log.info('system cache cleanup freed: %d bytes', freedBytes);

      // クリーンアップ後にストレージ情報を再取得
      await get().fetchStorageInfo();

      set({
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'cleanup system cache failed: %s', errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
        cleanupResult: null,
        lastUpdated: Date.now(),
      });
    }
  },

  runFullCleanup: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await cmdRunFullCleanup();
      log.info('full cleanup result: %O', result);

      // クリーンアップ後にストレージ情報を再取得
      await get().fetchStorageInfo();

      set({
        cleanupResult: result,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'full cleanup failed: %s', errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
        cleanupResult: null,
        lastUpdated: Date.now(),
      });
    }
  },

  analyzeDiskUsage: async (driveName: string) => {
    set({ isLoading: true, error: null });
    try {
      const results = await cmdAnalyzeDiskUsage(driveName);
      log.info('disk usage analysis for %s: %O', driveName, results);

      set({
        analysisResults: results,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      log.error({ err }, 'analyze disk usage failed: %s', errorMessage);
      set({
        analysisResults: [],
        error: errorMessage,
        isLoading: false,
        lastUpdated: Date.now(),
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

export { formatBytes, getHealthColor, getUsagePercentage };
