import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useNetworkTuningStore } from './useNetworkTuningStore';

const MOCK_TCP_STATE = {
  nagleDisabled: false,
  delayedAckDisabled: false,
  networkThrottlingIndex: 10,
  qosReservedBandwidthPct: 20,
  tcpAutoTuning: 'normal' as const,
  ecnEnabled: false,
  rssEnabled: true,
};

const MOCK_QUALITY_SNAPSHOT = {
  target: '8.8.8.8',
  avgLatencyMs: 10,
  jitterMs: 2,
  packetLossPct: 0,
  sampleCount: 4,
  timestamp: 1_700_000_000,
};

function resetStore(): void {
  useNetworkTuningStore.setState({
    tcpState: null,
    qualitySnapshot: null,
    isLoading: false,
    isApplying: false,
    isMeasuring: false,
    error: null,
  });
}

describe('useNetworkTuningStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { tcpState, isLoading, error } = useNetworkTuningStore.getState();
    expect(tcpState).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchTcpState stores state on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_TCP_STATE);
    await useNetworkTuningStore.getState().fetchTcpState();
    expect(useNetworkTuningStore.getState().tcpState).toEqual(MOCK_TCP_STATE);
    expect(useNetworkTuningStore.getState().isLoading).toBe(false);
  });

  it('fetchTcpState sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('tcp error'));
    await useNetworkTuningStore.getState().fetchTcpState();
    expect(useNetworkTuningStore.getState().error).toBe('tcp error');
  });

  it('setNagleDisabled calls command and updates state', async () => {
    useNetworkTuningStore.setState({ tcpState: MOCK_TCP_STATE });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useNetworkTuningStore.getState().setNagleDisabled(true);
    expect(invoke).toHaveBeenCalledWith('set_nagle_disabled', { disabled: true });
    expect(useNetworkTuningStore.getState().tcpState?.nagleDisabled).toBe(true);
  });

  it('setNagleDisabled sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('nagle error'));
    await useNetworkTuningStore.getState().setNagleDisabled(true);
    expect(useNetworkTuningStore.getState().error).toBe('nagle error');
    expect(useNetworkTuningStore.getState().isApplying).toBe(false);
  });

  it('applyGamingPreset stores new state on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_TCP_STATE);
    await useNetworkTuningStore.getState().applyGamingPreset();
    expect(invoke).toHaveBeenCalledWith('apply_gaming_network_preset');
    expect(useNetworkTuningStore.getState().tcpState).toEqual(MOCK_TCP_STATE);
  });

  it('measureNetworkQuality stores quality snapshot', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_QUALITY_SNAPSHOT);
    await useNetworkTuningStore.getState().measureNetworkQuality('8.8.8.8', 4);
    expect(useNetworkTuningStore.getState().qualitySnapshot).toEqual(MOCK_QUALITY_SNAPSHOT);
    expect(useNetworkTuningStore.getState().isMeasuring).toBe(false);
  });

  it('clearError resets error', () => {
    useNetworkTuningStore.setState({ error: 'test' });
    useNetworkTuningStore.getState().clearError();
    expect(useNetworkTuningStore.getState().error).toBeNull();
  });
});
