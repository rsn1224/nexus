import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemProcess } from '../types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../services/perplexityService', () => ({
  getOptimizationSuggestions: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { getOptimizationSuggestions } from '../services/perplexityService';
import { useOpsStore } from './useOpsStore';

const MOCK_PROCESSES: SystemProcess[] = [
  {
    pid: 1234,
    name: 'chrome.exe',
    cpuPercent: 15.2,
    memMb: 512,
    diskReadKb: 10,
    diskWriteKb: 5,
    canTerminate: true,
  },
  {
    pid: 5678,
    name: 'code.exe',
    cpuPercent: 8.1,
    memMb: 256,
    diskReadKb: 0,
    diskWriteKb: 2,
    canTerminate: true,
  },
  {
    pid: 9999,
    name: 'idle',
    cpuPercent: 0.0,
    memMb: 0,
    diskReadKb: 0,
    diskWriteKb: 0,
    canTerminate: false,
  },
];

function resetStore(): void {
  useOpsStore.setState({
    processes: [],
    suggestions: [],
    isLoading: false,
    isSuggestionsLoading: false,
    error: null,
    lastUpdated: null,
  });
}

describe('useOpsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { processes, isLoading, error, lastUpdated } = useOpsStore.getState();
    expect(processes).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
    expect(lastUpdated).toBeNull();
  });

  it('fetchProcesses populates processes on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_PROCESSES);
    await useOpsStore.getState().fetchProcesses();

    const { processes, isLoading, error } = useOpsStore.getState();
    expect(processes).toEqual(MOCK_PROCESSES);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchProcesses sets lastUpdated on success', async () => {
    const before = Date.now();
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_PROCESSES);
    await useOpsStore.getState().fetchProcesses();

    const { lastUpdated } = useOpsStore.getState();
    expect(lastUpdated).not.toBeNull();
    expect(lastUpdated ?? 0).toBeGreaterThanOrEqual(before);
  });

  it('fetchProcesses calls list_processes command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([]);
    await useOpsStore.getState().fetchProcesses();

    expect(invoke).toHaveBeenCalledWith('list_processes');
  });

  it('fetchProcesses sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('permission denied'));
    await useOpsStore.getState().fetchProcesses();

    const { error, isLoading, processes } = useOpsStore.getState();
    expect(error).toBe('permission denied');
    expect(isLoading).toBe(false);
    expect(processes).toEqual([]);
  });

  it('fetchProcesses handles non-Error rejection', async () => {
    vi.mocked(invoke).mockRejectedValueOnce('unknown failure');
    await useOpsStore.getState().fetchProcesses();

    expect(useOpsStore.getState().error).toBe('unknown failure');
  });

  it('fetchProcesses clears previous error on new call', async () => {
    useOpsStore.setState({ error: 'old error' });
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_PROCESSES);
    await useOpsStore.getState().fetchProcesses();

    expect(useOpsStore.getState().error).toBeNull();
  });

  it('fetchProcesses accepts empty process list', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([]);
    await useOpsStore.getState().fetchProcesses();

    expect(useOpsStore.getState().processes).toEqual([]);
    expect(useOpsStore.getState().error).toBeNull();
  });

  // AI Suggestions tests
  it('fetchSuggestions fetches and displays suggestions', async () => {
    const mockProcessNames = ['chrome.exe', 'code.exe', 'node.exe'];
    const mockSuggestions = [
      'Chromeブラウザのタブ数を減らしてください',
      'VSCodeの拡張機能を見直してください',
      'Node.jsプロセスを最適化してください',
    ];

    vi.mocked(invoke).mockResolvedValueOnce(mockProcessNames);
    vi.mocked(getOptimizationSuggestions).mockResolvedValueOnce({
      ok: true,
      data: mockSuggestions,
    });

    await useOpsStore.getState().fetchSuggestions();

    expect(useOpsStore.getState().suggestions).toEqual(mockSuggestions);
    expect(useOpsStore.getState().error).toBeNull();
    expect(useOpsStore.getState().isSuggestionsLoading).toBe(false);
  });

  it('fetchSuggestions handles API key error', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(['chrome.exe']);
    vi.mocked(getOptimizationSuggestions).mockRejectedValueOnce(
      new Error('PERPLEXITY_API_KEY が未設定です'),
    );

    await useOpsStore.getState().fetchSuggestions();

    expect(useOpsStore.getState().error).toBe('PERPLEXITY_API_KEY が未設定です');
    expect(useOpsStore.getState().suggestions).toEqual([]);
    expect(useOpsStore.getState().isSuggestionsLoading).toBe(false);
  });

  it('fetchSuggestions handles Perplexity API failure', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(['chrome.exe']);
    vi.mocked(getOptimizationSuggestions).mockRejectedValueOnce(
      new Error('AI提案の取得に失敗しました'),
    );

    await useOpsStore.getState().fetchSuggestions();

    expect(useOpsStore.getState().error).toBe('AI提案の取得に失敗しました');
    expect(useOpsStore.getState().suggestions).toEqual([]);
    expect(useOpsStore.getState().isSuggestionsLoading).toBe(false);
  });

  it('fetchSuggestions clears previous error on success', async () => {
    useOpsStore.setState({ error: 'old error' });
    vi.mocked(invoke).mockResolvedValueOnce(['chrome.exe']);
    vi.mocked(getOptimizationSuggestions).mockResolvedValueOnce({
      ok: true,
      data: ['Test suggestion'],
    });

    await useOpsStore.getState().fetchSuggestions();

    expect(useOpsStore.getState().error).toBeNull();
    expect(useOpsStore.getState().suggestions).toEqual(['Test suggestion']);
  });
});
