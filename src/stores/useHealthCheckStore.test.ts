import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HealthCheckInput, HealthCheckResult } from '../types';
import { useHealthCheckStore } from './useHealthCheckStore';

// Mock invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock logger
vi.mock('../lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useHealthCheckStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useHealthCheckStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should have initial state', () => {
    const state = useHealthCheckStore.getState();

    expect(state.result).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastCheckTime).toBeNull();
  });

  it('should handle successful health check', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValue({
      items: [
        {
          id: 'storage-ok',
          label: 'ストレージ空き容量',
          severity: 'ok',
          message: '空き容量 100.0GB（使用率 80%）',
          fixAction: null,
        },
      ],
      overall: 'ok',
      timestamp: Date.now(),
    } as HealthCheckResult);

    const input: HealthCheckInput = {
      diskFreeGb: 100,
      diskTotalGb: 500,
      cpuTempC: 55,
      gpuTempC: 60,
      memUsedMb: 8192,
      memTotalMb: 16384,
      heavyProcesses: [],
    };

    await useHealthCheckStore.getState().runHealthCheck(input);

    const state = useHealthCheckStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.result).toBeDefined();
    expect(state.result?.overall).toBe('ok');
    expect(state.result?.items).toHaveLength(1);
    expect(state.lastCheckTime).toBeDefined();
    expect(state.lastCheckTime).toBeGreaterThan(0);
  });

  it('should handle health check failure', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValue(new Error('API error'));

    const input: HealthCheckInput = {
      diskFreeGb: 100,
      diskTotalGb: 500,
      cpuTempC: 55,
      gpuTempC: 60,
      memUsedMb: 8192,
      memTotalMb: 16384,
      heavyProcesses: [],
    };

    await useHealthCheckStore.getState().runHealthCheck(input);

    const state = useHealthCheckStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('API error');
    expect(state.result).toBeNull();
    expect(state.lastCheckTime).toBeNull();
  });

  it('should reset state', () => {
    // Set some state
    useHealthCheckStore.setState({
      result: {
        items: [],
        overall: 'ok',
        timestamp: Date.now(),
      },
      isLoading: true,
      error: 'Some error',
      lastCheckTime: Date.now(),
    });

    // Reset
    useHealthCheckStore.getState().reset();

    const state = useHealthCheckStore.getState();
    expect(state.result).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastCheckTime).toBeNull();
  });

  it('should handle loading state correctly', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    // Create a promise that we can control
    let resolvePromise: ((value: HealthCheckResult) => void) | undefined;
    const promise = new Promise<HealthCheckResult>((resolve) => {
      resolvePromise = resolve;
    });
    vi.mocked(invoke).mockReturnValue(promise);

    const input: HealthCheckInput = {
      diskFreeGb: 100,
      diskTotalGb: 500,
      cpuTempC: 55,
      gpuTempC: 60,
      memUsedMb: 8192,
      memTotalMb: 16384,
      heavyProcesses: [],
    };

    // Start the health check
    const healthCheckPromise = useHealthCheckStore.getState().runHealthCheck(input);

    // Should be loading
    let state = useHealthCheckStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();

    // Resolve the promise
    if (resolvePromise) {
      resolvePromise({
        items: [],
        overall: 'ok',
        timestamp: Date.now(),
      });
    }

    // Wait for completion
    await healthCheckPromise;

    // Should no longer be loading
    state = useHealthCheckStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.result).toBeDefined();
  });
});
