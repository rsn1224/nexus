import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import {
  applyGamingNetworkPreset,
  fetchTcpTuningState,
  measureNetworkQuality,
  resetNetworkDefaults,
  setDelayedAckDisabled,
  setNagleDisabled,
  setNetworkThrottling,
  setQosReservedBandwidth,
  setTcpAutoTuning,
} from './networkTuning';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  mockInvoke.mockReset();
});

describe('fetchTcpTuningState', () => {
  it('正しいコマンド名でinvokeを呼ぶ', async () => {
    const fakeState = { nagleDisabled: true };
    mockInvoke.mockResolvedValue(fakeState);
    const result = await fetchTcpTuningState();
    expect(mockInvoke).toHaveBeenCalledWith('get_tcp_tuning_state');
    expect(result).toEqual(fakeState);
  });
});

describe('setNagleDisabled', () => {
  it('disabledパラメータを渡してinvokeを呼ぶ', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await setNagleDisabled(true);
    expect(mockInvoke).toHaveBeenCalledWith('set_nagle_disabled', { disabled: true });
  });

  it('falseを渡した場合も正しく動作する', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await setNagleDisabled(false);
    expect(mockInvoke).toHaveBeenCalledWith('set_nagle_disabled', { disabled: false });
  });
});

describe('setDelayedAckDisabled', () => {
  it('disabledパラメータを渡してinvokeを呼ぶ', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await setDelayedAckDisabled(true);
    expect(mockInvoke).toHaveBeenCalledWith('set_delayed_ack_disabled', { disabled: true });
  });
});

describe('setNetworkThrottling', () => {
  it('indexパラメータを渡してinvokeを呼ぶ', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await setNetworkThrottling(5);
    expect(mockInvoke).toHaveBeenCalledWith('set_network_throttling', { index: 5 });
  });
});

describe('setQosReservedBandwidth', () => {
  it('percentパラメータを渡してinvokeを呼ぶ', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await setQosReservedBandwidth(20);
    expect(mockInvoke).toHaveBeenCalledWith('set_qos_reserved_bandwidth', { percent: 20 });
  });
});

describe('setTcpAutoTuning', () => {
  it('levelパラメータを渡してinvokeを呼ぶ', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await setTcpAutoTuning('normal');
    expect(mockInvoke).toHaveBeenCalledWith('set_tcp_auto_tuning', { level: 'normal' });
  });
});

describe('applyGamingNetworkPreset', () => {
  it('正しいコマンド名でinvokeを呼び結果を返す', async () => {
    const fakeState = { nagleDisabled: true };
    mockInvoke.mockResolvedValue(fakeState);
    const result = await applyGamingNetworkPreset();
    expect(mockInvoke).toHaveBeenCalledWith('apply_gaming_network_preset');
    expect(result).toEqual(fakeState);
  });
});

describe('resetNetworkDefaults', () => {
  it('正しいコマンド名でinvokeを呼び結果を返す', async () => {
    const fakeState = { nagleDisabled: false };
    mockInvoke.mockResolvedValue(fakeState);
    const result = await resetNetworkDefaults();
    expect(mockInvoke).toHaveBeenCalledWith('reset_network_defaults');
    expect(result).toEqual(fakeState);
  });
});

describe('measureNetworkQuality', () => {
  it('target・countパラメータを渡してinvokeを呼ぶ', async () => {
    const fakeSnapshot = { latencyMs: 10 };
    mockInvoke.mockResolvedValue(fakeSnapshot);
    const result = await measureNetworkQuality('8.8.8.8', 4);
    expect(mockInvoke).toHaveBeenCalledWith('measure_network_quality', {
      target: '8.8.8.8',
      count: 4,
    });
    expect(result).toEqual(fakeSnapshot);
  });
});
