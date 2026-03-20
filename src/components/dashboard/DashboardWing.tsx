import { memo, useCallback, useEffect } from 'react';
import { buildHealthInput } from '../../lib/buildHealthInput';
import log from '../../lib/logger';
import { extractErrorMessage } from '../../lib/tauri';
import { useHealthActions, useHealthState } from '../../stores/useHealthStore';
import { usePulseStore } from '../../stores/usePulseStore';
import FooterMetrics from './FooterMetrics';
import RingCore from './RingCore';
import StitchAiPanel from './StitchAiPanel';
import TelemetrySection from './TelemetrySection';

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
      const match = suggestions.find((s) => !s.isApplied && s.title.includes(suggestionText));
      if (match) void applySuggestion(match.id);
    },
    [suggestions, applySuggestion],
  );

  const handleRollback = useCallback(() => {
    for (const s of suggestions.filter((s) => s.isApplied)) {
      void rollbackSuggestion(s.id);
    }
  }, [suggestions, rollbackSuggestion]);

  const suggestionTexts = suggestions
    .filter((s) => !s.isApplied)
    .slice(0, 2)
    .map((s) => s.title);

  const cpuUsage = latestSnapshot?.cpuPercent ?? 0;
  const cpuTemp = latestSnapshot?.cpuTempC ?? 0;
  const memUsed = latestSnapshot ? (latestSnapshot.memUsedMb / 1024).toFixed(1) : '0';
  const memTotal = latestSnapshot ? (latestSnapshot.memTotalMb / 1024).toFixed(0) : '16';
  const score = typeof healthScore === 'number' ? healthScore : 0;

  return (
    <div className="min-h-screen bg-base-900 p-6 relative overflow-hidden">
      <div className="mb-12 relative">
        <h1 className="text-7xl font-black tracking-tighter uppercase text-text-primary leading-none mb-3">
          DASHBOARD
        </h1>
        <p className="text-xs tracking-[0.3em] text-text-secondary uppercase">
          System Overview — STATUS: <span className="text-accent-500 animate-pulse">READY</span>
        </p>
      </div>

      {error && (
        <div className="flex items-center justify-between px-4 py-2 glass-panel border-l-4 border-danger-500 mb-6">
          <span className="text-danger-500 text-xs">{error}</span>
          <button type="button" onClick={clearError} className="text-danger-500 text-xs">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        <div className="col-span-12">
          <div className="glass-panel p-6">
            <RingCore
              score={score}
              loading={loading}
              statusLabel={score >= 80 ? 'OPTIMAL' : score >= 60 ? 'GOOD' : 'NEEDS ATTENTION'}
            />
          </div>
        </div>

        <TelemetrySection
          cpuUsage={cpuUsage}
          cpuTemp={cpuTemp}
          memUsed={memUsed}
          memTotal={memTotal}
        />

        <div className="col-span-12">
          <div className="glass-panel p-6">
            <StitchAiPanel
              suggestions={suggestionTexts}
              onApply={handleApplySuggestion}
              onRollback={handleRollback}
              loading={loading}
            />
          </div>
        </div>

        <div className="col-span-12">
          <div className="glass-panel p-4">
            <FooterMetrics />
          </div>
        </div>
      </div>
    </div>
  );
});
