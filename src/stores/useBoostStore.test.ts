import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useBoostStore } from './useBoostStore';

const MOCK_BOOST_RESULT = {
  optimizedProcesses: ['chrome.exe', 'code.exe'],
  freedMemoryMb: 512,
  cpuReductionPercent: 15.5,
};

function resetStore(): void {
  useBoostStore.setState({
    lastResult: null,
    isRunning: false,
    error: null,
  });
}

describe('useBoostStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { lastResult, isRunning, error } = useBoostStore.getState();
    expect(lastResult).toBeNull();
    expect(isRunning).toBe(false);
    expect(error).toBeNull();
  });

  it('runBoost with default threshold sets running state', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_BOOST_RESULT);

    const promise = useBoostStore.getState().runBoost();

    // Check running state during execution
    expect(useBoostStore.getState().isRunning).toBe(true);
    expect(useBoostStore.getState().error).toBeNull();

    await promise;

    expect(useBoostStore.getState().isRunning).toBe(false);
    expect(useBoostStore.getState().lastResult).toEqual(MOCK_BOOST_RESULT);
    expect(useBoostStore.getState().error).toBeNull();
  });

  it('runBoost with custom threshold passes parameter', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_BOOST_RESULT);

    await useBoostStore.getState().runBoost(25);

    expect(invoke).toHaveBeenCalledWith('run_boost', { thresholdPercent: 25 });
  });

  it('runBoost calls run_boost command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_BOOST_RESULT);

    await useBoostStore.getState().runBoost();

    expect(invoke).toHaveBeenCalledWith('run_boost', { thresholdPercent: 15 });
  });

  it('runBoost handles error and sets error state', async () => {
    const errorMessage = 'Permission denied';
    vi.mocked(invoke).mockRejectedValueOnce(new Error(errorMessage));

    await useBoostStore.getState().runBoost();

    expect(useBoostStore.getState().isRunning).toBe(false);
    expect(useBoostStore.getState().lastResult).toBeNull();
    expect(useBoostStore.getState().error).toBe(errorMessage);
  });

  it('runBoost clears previous error on success', async () => {
    useBoostStore.setState({ error: 'previous error' });
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_BOOST_RESULT);

    await useBoostStore.getState().runBoost();

    expect(useBoostStore.getState().error).toBeNull();
    expect(useBoostStore.getState().lastResult).toEqual(MOCK_BOOST_RESULT);
  });

  it('runBoost handles string error', async () => {
    const stringError = 'Unknown failure';
    vi.mocked(invoke).mockRejectedValueOnce(stringError);

    await useBoostStore.getState().runBoost();

    expect(useBoostStore.getState().error).toBe(stringError);
  });

  it('runBoost resets running state even on error', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Test error'));

    const promise = useBoostStore.getState().runBoost();
    expect(useBoostStore.getState().isRunning).toBe(true);

    await promise;
    expect(useBoostStore.getState().isRunning).toBe(false);
  });
});
