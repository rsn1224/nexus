import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect } from 'react';
import log from '../../lib/logger';
import { extractErrorMessage } from '../../lib/tauri';
import { useHealthActions, useHealthState } from '../../stores/useHealthStore';
import { usePulseStore } from '../../stores/usePulseStore';
import type { TcpTuningState, TimerResolutionState, WindowsSettings } from '../../types';
import { PowerPlan, VisualEffects } from '../../types';
import type { HealthInput } from '../../types/v2';
import FooterMetrics from './FooterMetrics';
import RingCore from './RingCore';
import StitchAiPanel from './StitchAiPanel';
import TelemetryBentoCard from './TelemetryBentoCard';

// =============================================================================
// DashboardWing — Stitch HUD layout
// =============================================================================

async function buildHealthInput(): Promise<HealthInput> {
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

export const DashboardWing = memo(function DashboardWing() {
  const { healthScore, loading, error } = useHealthState();
  const { recalculate, applySuggestion, rollbackSuggestion, clearError } = useHealthActions();
  const suggestions = useHealthState().suggestions;
  const snapshots = usePulseStore((s) => s.snapshots);
  const latestSnapshot = snapshots[snapshots.length - 1] ?? null;

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const input = await buildHealthInput();
      recalculate(input);
    } catch (err) {
      log.error({ err }, 'dashboard: refresh failed: %s', extractErrorMessage(err));
    }
  }, [recalculate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleApplySuggestion = useCallback(
    (suggestionText: string) => {
      const suggestion = suggestions.find((s) => !s.isApplied && s.title.includes(suggestionText));
      if (suggestion) {
        void applySuggestion(suggestion.id);
      }
    },
    [suggestions, applySuggestion],
  );

  const handleRollback = useCallback(() => {
    const applied = suggestions.filter((s) => s.isApplied);
    for (const s of applied) {
      void rollbackSuggestion(s.id);
    }
  }, [suggestions, rollbackSuggestion]);

  const suggestionTexts = suggestions
    .filter((s) => !s.isApplied)
    .slice(0, 2)
    .map((s) => s.title);

  // Prepare telemetry data
  const cpuUsage = latestSnapshot?.cpuPercent ?? 0;
  const cpuTemp = latestSnapshot?.cpuTempC ?? 0;
  const memUsed = latestSnapshot ? (latestSnapshot.memUsedMb / 1024).toFixed(1) : '0';
  const memTotal = latestSnapshot ? (latestSnapshot.memTotalMb / 1024).toFixed(0) : '16';

  const score = typeof healthScore === 'number' ? healthScore : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-danger-500/10 border-b border-danger-500/30">
          <span className="text-danger-500 text-xs">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-danger-500 text-xs hover:text-text-primary"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6 p-6 flex-1 overflow-y-auto">
        {/* Top: Ring Core spanning full width */}
        <div className="col-span-12">
          <RingCore
            score={score}
            loading={loading}
            statusLabel={score >= 80 ? 'OPTIMAL' : score >= 60 ? 'GOOD' : 'NEEDS ATTENTION'}
          />
        </div>

        {/* Middle: Telemetry Cards */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <TelemetryBentoCard
            icon="memory"
            category="Processor"
            title="CPU LOAD"
            value={cpuUsage.toFixed(0)}
            unit="%"
            barPercent={cpuUsage}
            barColor={
              cpuUsage > 80 ? 'bg-danger-500' : cpuUsage > 60 ? 'bg-warning-500' : 'bg-accent-500'
            }
            glowClass={cpuUsage > 80 ? 'glow-red' : cpuUsage > 60 ? 'glow-warm' : 'glow-green'}
            detail="CORE_01: 4.2GHz"
            status={cpuUsage > 80 ? 'HIGH LOAD' : cpuUsage > 60 ? 'MODERATE' : 'OPTIMAL'}
            statusColor={
              cpuUsage > 80
                ? 'text-danger-500'
                : cpuUsage > 60
                  ? 'text-warning-500'
                  : 'text-accent-500'
            }
          />

          <TelemetryBentoCard
            icon="device_thermostat"
            category="Graphics"
            title="GPU TEMP"
            value={cpuTemp.toFixed(0)}
            unit="C"
            barPercent={(cpuTemp / 100) * 100}
            barColor={
              cpuTemp > 80 ? 'bg-danger-500' : cpuTemp > 70 ? 'bg-warning-500' : 'bg-accent-500'
            }
            glowClass={cpuTemp > 80 ? 'glow-red' : cpuTemp > 70 ? 'glow-warm' : 'glow-green'}
            detail="GPU_01: 1.8GHz"
            status={cpuTemp > 80 ? 'OVERHEAT' : cpuTemp > 70 ? 'WARM' : 'HEALTHY'}
            statusColor={
              cpuTemp > 80
                ? 'text-danger-500'
                : cpuTemp > 70
                  ? 'text-warning-500'
                  : 'text-accent-500'
            }
          />

          <TelemetryBentoCard
            icon="storage"
            category="Memory"
            title="RAM USAGE"
            value={memUsed}
            unit="GB"
            barPercent={(parseFloat(memUsed) / parseFloat(memTotal)) * 100}
            barColor="bg-accent-500"
            glowClass="glow-green"
            detail={`Total: ${memTotal}GB`}
            status="HEALTHY"
            statusColor="text-accent-500"
          />
        </div>

        {/* Bottom: AI Panel */}
        <div className="col-span-12">
          <StitchAiPanel
            suggestions={suggestionTexts}
            onApply={handleApplySuggestion}
            onRollback={handleRollback}
            loading={loading}
          />
        </div>

        {/* Footer */}
        <div className="col-span-12">
          <FooterMetrics />
        </div>
      </div>
    </div>
  );
});
