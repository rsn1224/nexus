import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemProcess } from '../types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
  UnlistenFn: vi.fn(),
}));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../services/perplexityService', () => ({
  getOptimizationSuggestions: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
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
    isListening: false,
  });
}

describe('useOpsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { processes, isLoading, error, lastUpdated, isListening } = useOpsStore.getState();
    expect(processes).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
    expect(lastUpdated).toBeNull();
    expect(isListening).toBe(false);
  });

  it('subscribes to nexus://ops events', () => {
    const mockUnlisten = vi.fn();
    const mockListen = vi.mocked(listen);
    mockListen.mockResolvedValue(mockUnlisten);

    useOpsStore.getState().subscribe();

    expect(mockListen).toHaveBeenCalledWith('nexus://ops', expect.any(Function));
  });

  it('handles subscription errors', async () => {
    const mockListen = vi.mocked(listen);
    const testError = new Error('Subscription failed');
    mockListen.mockRejectedValue(testError);

    useOpsStore.getState().subscribe();

    // エラー状態の確認を少し待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    const { error, isListening } = useOpsStore.getState();
    expect(error).toBe('Subscription failed');
    expect(isListening).toBe(false);
  });

  it('prevents duplicate subscriptions', async () => {
    const mockListen = vi.mocked(listen);
    mockListen.mockResolvedValue(vi.fn());

    useOpsStore.getState().subscribe();
    useOpsStore.getState().subscribe();

    expect(mockListen).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes correctly', async () => {
    const mockUnlisten = vi.fn();
    const mockListen = vi.mocked(listen);
    mockListen.mockResolvedValue(mockUnlisten);

    useOpsStore.getState().subscribe();
    // 非同期で unlisten が設定されるのを待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    useOpsStore.getState().unsubscribe();

    expect(mockUnlisten).toHaveBeenCalled();
    const { isListening } = useOpsStore.getState();
    expect(isListening).toBe(false);
  });

  it('processes incoming ops events', async () => {
    const mockListen = vi.mocked(listen);
    let eventCallback: ((event: { payload: SystemProcess[] }) => void) | undefined;

    mockListen.mockImplementation((event, callback) => {
      if (event === 'nexus://ops') {
        eventCallback = callback as (event: { payload: SystemProcess[] }) => void;
      }
      return Promise.resolve(vi.fn());
    });

    useOpsStore.getState().subscribe();

    // イベントをシミュレート
    expect(eventCallback).toBeDefined();
    eventCallback?.({ payload: MOCK_PROCESSES });

    const { processes, lastUpdated } = useOpsStore.getState();
    expect(processes).toEqual(MOCK_PROCESSES);
    expect(lastUpdated).toBeGreaterThan(0);
  });

  it('fetchSuggestions works correctly', async () => {
    const mockSuggestions = ['Kill high CPU processes', 'Close unused applications'];
    vi.mocked(invoke).mockResolvedValueOnce(['chrome', 'code']);
    vi.mocked(getOptimizationSuggestions).mockResolvedValueOnce({
      ok: true,
      data: mockSuggestions,
    });

    await useOpsStore.getState().fetchSuggestions();

    const { suggestions, isSuggestionsLoading, error } = useOpsStore.getState();
    expect(suggestions).toEqual(mockSuggestions);
    expect(isSuggestionsLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('handles fetchSuggestions errors', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(['chrome']);
    vi.mocked(getOptimizationSuggestions).mockResolvedValueOnce({
      ok: false,
      error: 'API failed',
    });

    await useOpsStore.getState().fetchSuggestions();

    const { suggestions, isSuggestionsLoading, error } = useOpsStore.getState();
    expect(suggestions).toEqual([]);
    expect(isSuggestionsLoading).toBe(false);
    expect(error).toBe('API failed');
  });

  it('killProcess works correctly', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    await useOpsStore.getState().killProcess(1234);

    expect(vi.mocked(invoke)).toHaveBeenCalledWith('kill_process', { pid: 1234 });
  });

  it('setProcessPriority works correctly', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    await useOpsStore.getState().setProcessPriority(1234, 'high');

    expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_process_priority', {
      pid: 1234,
      priority: 'high',
    });
  });

  it('handles process action errors', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Process not found'));

    await useOpsStore.getState().killProcess(9999);

    const { error } = useOpsStore.getState();
    expect(error).toBeTruthy();
  });

  it('preserves processes data when killProcess fails', async () => {
    // Set initial state with processes
    useOpsStore.setState({ processes: MOCK_PROCESSES, lastUpdated: 12345 });

    vi.mocked(invoke).mockRejectedValueOnce(new Error('Process not found'));

    await useOpsStore.getState().killProcess(9999);

    const { processes, error, lastUpdated } = useOpsStore.getState();
    expect(processes).toEqual(MOCK_PROCESSES); // Should be preserved
    expect(lastUpdated).toBe(12345); // Should be preserved
    expect(error).toBe('Process not found'); // Error should be set
  });

  it('preserves processes data when fetchSuggestions fails', async () => {
    // Set initial state with processes
    useOpsStore.setState({ processes: MOCK_PROCESSES, lastUpdated: 12345 });

    vi.mocked(invoke).mockRejectedValueOnce(new Error('API error'));

    await useOpsStore.getState().fetchSuggestions();

    const { processes, error, lastUpdated, isSuggestionsLoading } = useOpsStore.getState();
    expect(processes).toEqual(MOCK_PROCESSES); // Should be preserved
    expect(lastUpdated).toBe(12345); // Should be preserved
    expect(error).toBe('API error'); // Error should be set
    expect(isSuggestionsLoading).toBe(false); // Loading state should be reset
  });

  it('preserves lastUpdated when subscribe fails', async () => {
    // Set initial state with data
    useOpsStore.setState({
      processes: MOCK_PROCESSES,
      lastUpdated: 12345,
      suggestions: ['existing suggestion'],
    });

    const mockListen = vi.mocked(listen);
    const testError = new Error('Subscription failed');
    mockListen.mockRejectedValue(testError);

    useOpsStore.getState().subscribe();

    // エラー状態の確認を少し待つ
    await new Promise((resolve) => setTimeout(resolve, 0));

    const { processes, lastUpdated, suggestions, error, isListening } = useOpsStore.getState();
    expect(processes).toEqual(MOCK_PROCESSES); // Should be preserved
    expect(lastUpdated).toBe(12345); // Should be preserved
    expect(suggestions).toEqual(['existing suggestion']); // Should be preserved
    expect(error).toBe('Subscription failed'); // Error should be set
    expect(isListening).toBe(false); // Listening state should be reset
  });
});
