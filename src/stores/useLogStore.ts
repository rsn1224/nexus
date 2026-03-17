import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import type { LogAnalysis, LogEntry, LogLevel } from '../types';

export type LogLevelFilter = 'All' | 'Error' | 'Warn' | 'Info' | 'Debug';

interface LogState {
  // State
  logs: LogEntry[];
  analysis: LogAnalysis | null;
  isLoading: boolean;
  error: string | null;
  selectedLevel: LogLevel | 'All';
  selectedSource: string;
  searchQuery: string;

  // Actions
  getSystemLogs: (level?: string, limit?: number) => Promise<void>;
  getApplicationLogs: (appName: string, limit?: number) => Promise<void>;
  analyzeLogs: () => Promise<void>;
  exportLogs: (format: 'json' | 'csv') => Promise<string>;
  setSelectedLevel: (level: LogLevel | 'All') => void;
  setSelectedSource: (source: string) => void;
  setSearchQuery: (query: string) => void;
  clearLogs: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  logs: [],
  analysis: null,
  isLoading: false,
  error: null,
  selectedLevel: 'All' as LogLevel | 'All',
  selectedSource: '',
  searchQuery: '',
};

export const useLogStore = create<LogState>((set, get) => ({
  ...initialState,

  getSystemLogs: async (level?: string, limit?: number) => {
    set({ isLoading: true, error: null });
    try {
      const logs = (await invoke('get_system_logs', {
        level,
        limit: limit || 1000,
      })) as LogEntry[];
      set({ logs, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch system logs',
        isLoading: false,
      });
    }
  },

  getApplicationLogs: async (appName: string, limit?: number) => {
    set({ isLoading: true, error: null });
    try {
      const logs = (await invoke('get_application_logs', {
        appName,
        limit: limit || 1000,
      })) as LogEntry[];
      set({ logs, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch application logs',
        isLoading: false,
      });
    }
  },

  analyzeLogs: async () => {
    const { logs } = get();
    if (logs.length === 0) {
      set({ error: 'No logs to analyze' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const analysis = (await invoke('analyze_logs', { logs })) as LogAnalysis;
      set({ analysis, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to analyze logs',
        isLoading: false,
      });
    }
  },

  exportLogs: async (format: 'json' | 'csv') => {
    const { logs } = get();
    if (logs.length === 0) {
      set({ error: 'No logs to export' });
      throw new Error('No logs to export');
    }

    try {
      const filePath = (await invoke('export_logs', { logs, format })) as string;
      return filePath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export logs';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  setSelectedLevel: (level) => {
    set({ selectedLevel: level });
  },

  setSelectedSource: (source) => {
    set({ selectedSource: source });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  clearLogs: () => {
    set({
      logs: [],
      analysis: null,
      error: null,
      selectedLevel: 'All',
      selectedSource: '',
      searchQuery: '',
    });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));

// Selectors
export const useLogData = () => {
  const store = useLogStore();

  // Filtered logs based on current filters
  const filteredLogs = store.logs.filter((log) => {
    // Level filter
    if (store.selectedLevel !== 'All' && log.level !== store.selectedLevel) {
      return false;
    }

    // Source filter
    if (store.selectedSource && log.source !== store.selectedSource) {
      return false;
    }

    // Search query filter
    if (store.searchQuery) {
      const query = store.searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query) ||
        log.timestamp.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Get unique sources for dropdown
  const uniqueSources = Array.from(new Set(store.logs.map((log) => log.source))).sort();

  // Get log counts by level
  const logCounts = store.logs.reduce(
    (acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    },
    {} as Record<LogLevel, number>,
  );

  return {
    ...store,
    filteredLogs,
    uniqueSources,
    logCounts,
    hasLogs: store.logs.length > 0,
    hasFilteredLogs: filteredLogs.length > 0,
  };
};

// Utility functions
export const getLogLevelColor = (level: LogLevel): string => {
  switch (level) {
    case 'Error':
      return 'var(--color-danger-500)';
    case 'Warn':
      return 'var(--color-accent-500)';
    case 'Info':
      return 'var(--color-cyan-500)';
    case 'Debug':
      return 'var(--color-text-muted)';
    default:
      return 'var(--color-text-primary)';
  }
};

export const getLogLevelBgColor = (level: LogLevel): string => {
  switch (level) {
    case 'Error':
      return 'var(--color-danger-500)';
    case 'Warn':
      return 'var(--color-accent-500)';
    case 'Info':
      return 'var(--color-cyan-500)';
    case 'Debug':
      return 'var(--color-base-600)';
    default:
      return 'var(--color-base-600)';
  }
};

export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
};

export const truncateMessage = (message: string, maxLength: number = 100): string => {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.substring(0, maxLength)}...`;
};
