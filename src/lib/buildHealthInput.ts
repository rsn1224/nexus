import { invoke } from '@tauri-apps/api/core';
import { usePulseStore } from '../stores/usePulseStore';
import type { TcpTuningState, TimerResolutionState, WindowsSettings } from '../types';
import { PowerPlan, VisualEffects } from '../types';
import type { HealthInput } from '../types/v2';

export async function buildHealthInput(): Promise<HealthInput> {
  const [winSettings, tcpState, timerState] = await Promise.all([
    invoke<WindowsSettings>('get_windows_settings').catch(() => null),
    invoke<TcpTuningState>('get_tcp_tuning_state').catch(() => null),
    invoke<TimerResolutionState>('get_timer_resolution').catch(() => null),
  ]);

  const snapshots = usePulseStore.getState().snapshots;
  const snapshot = snapshots[snapshots.length - 1];

  const memUsedGb = snapshot ? snapshot.memUsedMb / 1024 : 0;
  const memTotalGb = snapshot ? snapshot.memTotalMb / 1024 : 16;
  const cpuUsage = snapshot?.cpuPercent ?? 0;
  const cpuTemp = snapshot?.cpuTempC ?? null;

  return {
    cpuUsage,
    gpuUsage: 0,
    cpuTemp,
    gpuTemp: null,
    memUsedGb,
    memTotalGb,
    gameModeEnabled: winSettings?.gameMode ?? false,
    powerPlanHighPerf: winSettings?.powerPlan === PowerPlan.HighPerformance,
    timerResolutionLow: timerState != null ? timerState.current100ns <= 5000 : false,
    nagleDisabled: tcpState?.nagleDisabled ?? false,
    visualEffectsOff: winSettings?.visualEffects === VisualEffects.BestPerformance,
    bottleneckRatio: 0,
  };
}
