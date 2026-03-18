import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

import { invoke } from '@tauri-apps/api/core';
import { useLogStore } from './useLogStore';

const MOCK_LOG_ENTRY = {
  id: '1',
  timestamp: '2024-01-01T00:00:00Z',
  level: 'Info' as const,
  source: 'System',
  message: 'Test log entry',
};

function resetStore(): void {
  useLogStore.setState({
    logs: [],
    analysis: null,
    isLoading: false,
    error: null,
    selectedLevel: 'All',
    selectedSource: '',
    searchQuery: '',
  });
}

describe('useLogStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { logs, analysis, isLoading, error } = useLogStore.getState();
    expect(logs).toEqual([]);
    expect(analysis).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('getSystemLogs stores logs on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_LOG_ENTRY]);
    await useLogStore.getState().getSystemLogs();
    expect(useLogStore.getState().logs).toEqual([MOCK_LOG_ENTRY]);
    expect(useLogStore.getState().isLoading).toBe(false);
  });

  it('getSystemLogs sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('log fetch failed'));
    await useLogStore.getState().getSystemLogs();
    expect(useLogStore.getState().error).toBe('log fetch failed');
    expect(useLogStore.getState().logs).toEqual([]);
  });

  it('getApplicationLogs passes appName parameter', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_LOG_ENTRY]);
    await useLogStore.getState().getApplicationLogs('chrome', 100);
    expect(invoke).toHaveBeenCalledWith('get_application_logs', { appName: 'chrome', limit: 100 });
  });

  it('analyzeLogs does nothing when no logs', async () => {
    await useLogStore.getState().analyzeLogs();
    expect(useLogStore.getState().error).toBe('No logs to analyze');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('analyzeLogs calls analyze_logs when logs exist', async () => {
    useLogStore.setState({ logs: [MOCK_LOG_ENTRY] });
    const mockAnalysis = { summary: 'test', errorCount: 0, warnCount: 0 };
    vi.mocked(invoke).mockResolvedValueOnce(mockAnalysis);
    await useLogStore.getState().analyzeLogs();
    expect(invoke).toHaveBeenCalledWith('analyze_logs', { logs: [MOCK_LOG_ENTRY] });
  });

  it('setSelectedLevel updates selectedLevel', () => {
    useLogStore.getState().setSelectedLevel('Error');
    expect(useLogStore.getState().selectedLevel).toBe('Error');
  });

  it('setSearchQuery updates searchQuery', () => {
    useLogStore.getState().setSearchQuery('kernel');
    expect(useLogStore.getState().searchQuery).toBe('kernel');
  });

  it('clearLogs resets logs and filters', () => {
    useLogStore.setState({ logs: [MOCK_LOG_ENTRY], selectedLevel: 'Error', searchQuery: 'test' });
    useLogStore.getState().clearLogs();
    expect(useLogStore.getState().logs).toEqual([]);
    expect(useLogStore.getState().selectedLevel).toBe('All');
    expect(useLogStore.getState().searchQuery).toBe('');
  });

  it('clearError clears error state', () => {
    useLogStore.setState({ error: 'some error' });
    useLogStore.getState().clearError();
    expect(useLogStore.getState().error).toBeNull();
  });

  it('reset restores initial state', () => {
    useLogStore.setState({ logs: [MOCK_LOG_ENTRY], isLoading: true });
    useLogStore.getState().reset();
    expect(useLogStore.getState().logs).toEqual([]);
    expect(useLogStore.getState().isLoading).toBe(false);
  });
});
