import { invoke } from '@tauri-apps/api/core';
import type { NetworkQualitySnapshot, TcpAutoTuningLevel, TcpTuningState } from '../types';

export async function fetchTcpTuningState(): Promise<TcpTuningState> {
  return await invoke<TcpTuningState>('get_tcp_tuning_state');
}

export async function setNagleDisabled(disabled: boolean): Promise<void> {
  await invoke('set_nagle_disabled', { disabled });
}

export async function setDelayedAckDisabled(disabled: boolean): Promise<void> {
  await invoke('set_delayed_ack_disabled', { disabled });
}

export async function setNetworkThrottling(index: number): Promise<void> {
  await invoke('set_network_throttling', { index });
}

export async function setQosReservedBandwidth(percent: number): Promise<void> {
  await invoke('set_qos_reserved_bandwidth', { percent });
}

export async function setTcpAutoTuning(level: TcpAutoTuningLevel): Promise<void> {
  await invoke('set_tcp_auto_tuning', { level });
}

export async function applyGamingNetworkPreset(): Promise<TcpTuningState> {
  return await invoke<TcpTuningState>('apply_gaming_network_preset');
}

export async function resetNetworkDefaults(): Promise<TcpTuningState> {
  return await invoke<TcpTuningState>('reset_network_defaults');
}

export async function measureNetworkQuality(
  target: string,
  count: number,
): Promise<NetworkQualitySnapshot> {
  return await invoke<NetworkQualitySnapshot>('measure_network_quality', { target, count });
}
