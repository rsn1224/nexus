import { invoke } from '@tauri-apps/api/core';
import type {
  ApplyResult,
  BoostResult,
  CoreParkingState,
  DiagnosticAlert,
  HardwareInfo,
  MemoryCleanerConfig,
  MemoryCleanupResult,
  NetworkQualitySnapshot,
  NexusSettings,
  OptCandidate,
  OptSession,
  PowerPlan,
  RevertResult,
  SystemStatus,
  TcpTuningState,
  TimerResolutionState,
  VisualEffects,
  WindowsSettings,
} from '../types';
import { extractErrorMessage } from './tauri';

function wrap<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err: unknown) => {
    throw new Error(extractErrorMessage(err));
  });
}

export const commands = {
  getSystemStatus: (): Promise<SystemStatus> => wrap(invoke<SystemStatus>('get_system_status')),

  getOptimizationCandidates: (): Promise<OptCandidate[]> =>
    wrap(invoke<OptCandidate[]>('get_optimization_candidates')),

  applyOptimizations: (ids: string[]): Promise<ApplyResult> =>
    wrap(invoke<ApplyResult>('apply_optimizations', { ids })),

  revertAll: (): Promise<RevertResult> => wrap(invoke<RevertResult>('revert_all')),

  diagnose: (): Promise<DiagnosticAlert[]> => wrap(invoke<DiagnosticAlert[]>('diagnose')),

  getHistory: (): Promise<OptSession[]> => wrap(invoke<OptSession[]>('get_history')),

  getV4Settings: (): Promise<NexusSettings> => wrap(invoke<NexusSettings>('get_v4_settings')),

  updateV4Settings: (settings: NexusSettings): Promise<void> =>
    wrap(invoke<void>('update_v4_settings', { settings })),

  getHardwareInfo: (): Promise<HardwareInfo> => wrap(invoke<HardwareInfo>('get_hardware_info')),

  // Network
  getTcpTuningState: (): Promise<TcpTuningState> =>
    wrap(invoke<TcpTuningState>('get_tcp_tuning_state')),
  setNagleDisabled: (disabled: boolean): Promise<void> =>
    wrap(invoke<void>('set_nagle_disabled', { disabled })),
  setDelayedAckDisabled: (disabled: boolean): Promise<void> =>
    wrap(invoke<void>('set_delayed_ack_disabled', { disabled })),
  setNetworkThrottling: (index: number): Promise<void> =>
    wrap(invoke<void>('set_network_throttling', { index })),
  setQosReservedBandwidth: (percent: number): Promise<void> =>
    wrap(invoke<void>('set_qos_reserved_bandwidth', { percent })),
  setTcpAutoTuning: (level: string): Promise<void> =>
    wrap(invoke<void>('set_tcp_auto_tuning', { level })),
  applyGamingNetworkPreset: (): Promise<TcpTuningState> =>
    wrap(invoke<TcpTuningState>('apply_gaming_network_preset')),
  resetNetworkDefaults: (): Promise<TcpTuningState> =>
    wrap(invoke<TcpTuningState>('reset_network_defaults')),
  measureNetworkQuality: (target: string, count: number): Promise<NetworkQualitySnapshot> =>
    wrap(invoke<NetworkQualitySnapshot>('measure_network_quality', { target, count })),

  // Windows Settings
  getWindowsSettings: (): Promise<WindowsSettings> =>
    wrap(invoke<WindowsSettings>('get_windows_settings')),
  setPowerPlan: (plan: PowerPlan): Promise<void> => wrap(invoke<void>('set_power_plan', { plan })),
  toggleGameMode: (): Promise<boolean> => wrap(invoke<boolean>('toggle_game_mode')),
  toggleFullscreenOptimization: (): Promise<boolean> =>
    wrap(invoke<boolean>('toggle_fullscreen_optimization')),
  toggleHardwareGpuScheduling: (): Promise<boolean> =>
    wrap(invoke<boolean>('toggle_hardware_gpu_scheduling')),
  setVisualEffects: (effect: VisualEffects): Promise<void> =>
    wrap(invoke<void>('set_visual_effects', { effect })),

  // Memory
  getMemoryCleanerConfig: (): Promise<MemoryCleanerConfig> =>
    wrap(invoke<MemoryCleanerConfig>('get_memory_cleaner_config')),
  updateMemoryCleanerConfig: (config: MemoryCleanerConfig): Promise<void> =>
    wrap(invoke<void>('update_memory_cleaner_config', { config })),
  manualMemoryCleanup: (): Promise<MemoryCleanupResult> =>
    wrap(invoke<MemoryCleanupResult>('manual_memory_cleanup')),

  // Timer + CoreParking
  getTimerResolution: (): Promise<TimerResolutionState> =>
    wrap(invoke<TimerResolutionState>('get_timer_resolution')),
  setTimerResolution: (resolution100ns: number): Promise<TimerResolutionState> =>
    wrap(invoke<TimerResolutionState>('set_timer_resolution', { resolution100ns })),
  restoreTimerResolution: (): Promise<void> => wrap(invoke<void>('restore_timer_resolution')),
  getCoreParkingState: (): Promise<CoreParkingState> =>
    wrap(invoke<CoreParkingState>('get_core_parking_state')),
  setCoreParking: (minCoresPercent: number): Promise<void> =>
    wrap(invoke<void>('set_core_parking', { minCoresPercent })),

  // Boost
  runBoost: (thresholdPercent?: number): Promise<BoostResult> =>
    wrap(invoke<BoostResult>('run_boost', { thresholdPercent })),
} as const;
