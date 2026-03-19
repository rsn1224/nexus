import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNetworkTuningActions, useNetworkTuningState } from './networkTuningHooks';

vi.mock('../stores/useNetworkTuningStore', () => {
  const mockStore = vi.fn();
  return { useNetworkTuningStore: mockStore };
});

import { useNetworkTuningStore } from '../stores/useNetworkTuningStore';

const mockState = {
  tcpState: { nagleDisabled: false },
  qualitySnapshot: null,
  isLoading: false,
  isApplying: true,
  isMeasuring: false,
  error: null,
};

const mockActions = {
  fetchTcpState: vi.fn(),
  setNagleDisabled: vi.fn(),
  setDelayedAckDisabled: vi.fn(),
  setNetworkThrottling: vi.fn(),
  setQosReservedBandwidth: vi.fn(),
  setTcpAutoTuning: vi.fn(),
  applyGamingPreset: vi.fn(),
  resetDefaults: vi.fn(),
  measureNetworkQuality: vi.fn(),
  clearError: vi.fn(),
};

describe('useNetworkTuningState', () => {
  beforeEach(() => {
    vi.mocked(useNetworkTuningStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockState) => unknown)(mockState);
      }
      return mockState;
    });
  });

  it('ネットワーク状態を正しい形で返す', () => {
    const { result } = renderHook(() => useNetworkTuningState());

    expect(result.current).toEqual(
      expect.objectContaining({
        tcpState: mockState.tcpState,
        qualitySnapshot: null,
        isLoading: false,
        isApplying: true,
        isMeasuring: false,
        error: null,
      }),
    );
  });
});

describe('useNetworkTuningActions', () => {
  beforeEach(() => {
    vi.mocked(useNetworkTuningStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockActions) => unknown)(mockActions);
      }
      return mockActions;
    });
  });

  it('アクション関数を正しい形で返す', () => {
    const { result } = renderHook(() => useNetworkTuningActions());

    expect(result.current).toEqual(
      expect.objectContaining({
        fetchTcpState: expect.any(Function),
        setNagleDisabled: expect.any(Function),
        setDelayedAckDisabled: expect.any(Function),
        applyGamingPreset: expect.any(Function),
        resetDefaults: expect.any(Function),
        measureNetworkQuality: expect.any(Function),
        clearError: expect.any(Function),
      }),
    );
  });
});
