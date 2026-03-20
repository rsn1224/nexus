import { memo, useCallback, useEffect } from 'react';
import { buildHealthInput } from '../../lib/buildHealthInput';
import log from '../../lib/logger';
import { extractErrorMessage } from '../../lib/tauri';
import { useHealthActions, useHealthState } from '../../stores/useHealthStore';
import { usePulseStore } from '../../stores/usePulseStore';
import FooterMetrics from './FooterMetrics';
import RingCore from './RingCore';
import StitchAiPanel from './StitchAiPanel';
import TelemetryBentoCard from './TelemetryBentoCard';

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
    <div className="min-h-screen bg-base-900 p-6 relative overflow-hidden">
      {/* Background gradients from Stitch design */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-96 h-96 rounded-full bg-accent-500/3 blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 rounded-full bg-info-500/2 blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="mb-12 relative">
        <div className="absolute -top-6 -left-2 text-[10px] font-mono text-accent-500/60 tracking-widest">
          [CORE_INIT_SYS_V2]
        </div>
        <h1 className="text-7xl font-black tracking-tighter uppercase text-text-primary leading-none mb-3">
          DASHBOARD
        </h1>
        <p className="text-xs font-label tracking-[0.3em] text-text-secondary uppercase flex items-center gap-3">
          System Overview — STATUS: <span className="text-accent-500 animate-pulse">READY</span>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 glass-panel border-l-4 border-danger-500 mb-6">
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        {/* Top: Ring Core spanning full width */}
        <div className="col-span-12">
          <div className="glass-panel p-6 border-t-2 border-accent-500/30 scanning-line relative">
            <div className="reflective-overlay absolute inset-0"></div>
            <div className="absolute top-2 right-3 text-[9px] font-mono text-accent-500/40">
              [CORE_STABILITY_MONITOR]
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-[10px] tracking-[0.3em] text-accent-500 uppercase mb-4">
                SYSTEM HEALTH
              </h3>
              <RingCore
                score={score}
                loading={loading}
                statusLabel={score >= 80 ? 'OPTIMAL' : score >= 60 ? 'GOOD' : 'NEEDS ATTENTION'}
              />
            </div>
          </div>
        </div>

        {/* Middle: Telemetry Cards */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 border-l-4 border-accent-500 hover:bg-accent-500/10 transition-all duration-500">
            <div className="reflective-overlay absolute inset-0"></div>
            <div className="relative z-10">
              <TelemetryBentoCard
                icon="memory"
                category="Processor"
                title="CPU LOAD"
                value={cpuUsage.toFixed(0)}
                unit="%"
                barPercent={cpuUsage}
                barColor={
                  cpuUsage > 80
                    ? 'bg-danger-500'
                    : cpuUsage > 60
                      ? 'bg-warning-500'
                      : 'bg-accent-500'
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
            </div>
          </div>

          <div className="glass-panel p-6 border-l-4 border-transparent hover:border-info-500/60 hover:bg-info-500/10 transition-all duration-500">
            <div className="reflective-overlay absolute inset-0"></div>
            <div className="relative z-10">
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
            </div>
          </div>

          <div className="glass-panel p-6 border-l-4 border-transparent hover:border-info-500/60 hover:bg-info-500/10 transition-all duration-500">
            <div className="reflective-overlay absolute inset-0"></div>
            <div className="relative z-10">
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
          </div>
        </div>

        {/* Bottom: AI Panel */}
        <div className="col-span-12">
          <div className="glass-panel p-6 border-t-2 border-accent-500/30 scanning-line relative">
            <div className="reflective-overlay absolute inset-0"></div>
            <div className="absolute top-4 left-4 text-[9px] font-mono text-accent-500/40">
              [TASK_QUEUE_v2.0]
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-[10px] tracking-[0.3em] text-accent-500 uppercase">
                  AI OPTIMIZATION
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-black text-accent-500 animate-pulse tracking-[0.2em]">
                    SCANNING...
                  </span>
                  <span className="text-[9px] font-mono text-accent-500/50">[0x7F_FF]</span>
                </div>
              </div>
              <StitchAiPanel
                suggestions={suggestionTexts}
                onApply={handleApplySuggestion}
                onRollback={handleRollback}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="col-span-12">
          <div className="glass-panel p-4 border border-accent-500/20">
            <FooterMetrics />
          </div>
        </div>
      </div>
    </div>
  );
});
