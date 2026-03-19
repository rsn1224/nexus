import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect } from 'react';
import log from '../../lib/logger';
import { extractErrorMessage } from '../../lib/tauri';
import { useHealthActions, useHealthState } from '../../stores/useHealthStore';
import { usePulseStore } from '../../stores/usePulseStore';
import type { TcpTuningState, TimerResolutionState, WindowsSettings } from '../../types';
import { PowerPlan, VisualEffects } from '../../types';
import type { HealthInput } from '../../types/v2';
import { AppliedBadgeRow } from './AppliedBadgeRow';
import { HealthScoreBar } from './HealthScoreBar';
import { SuggestionList } from './SuggestionList';

// =============================================================================
// DashboardWing — AI 提案一覧・ヘルススコア・ワンクリック最適化
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
  const { healthScore, appliedActions, loading, error } = useHealthState();
  const { recalculate, applySuggestion, rollbackSuggestion, clearError } = useHealthActions();

  const suggestions = useHealthState().suggestions;

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

  const handleOptimizeNow = useCallback((): void => {
    const pending = suggestions.filter(
      (s) => !s.isApplied && s.actions.length > 0 && s.priority === 'critical',
    );
    for (const s of pending) {
      void applySuggestion(s.id);
    }
  }, [suggestions, applySuggestion]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <HealthScoreBar
        healthScore={healthScore}
        loading={loading}
        onOptimizeNow={handleOptimizeNow}
      />

      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-danger-500/10 border-b border-danger-500/30">
          <span className="text-danger-500 text-xs font-mono">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-danger-500 text-xs font-mono hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <SuggestionList
        suggestions={suggestions}
        onApply={applySuggestion}
        onRollback={rollbackSuggestion}
        loading={loading}
      />

      <AppliedBadgeRow appliedActions={appliedActions} />
    </div>
  );
});
