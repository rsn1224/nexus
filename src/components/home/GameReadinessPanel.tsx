import { useMemo } from 'react';
import { calcReadiness, type ReadinessInput } from '../../lib/gameReadiness';
import { progressWidth } from '../../lib/styles';
import { useFrameTimeState } from '../../stores/useFrameTimeStore';
import { useGameProfileState } from '../../stores/useGameProfileStore';
import { useHardwareData } from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { useTimerState } from '../../stores/useTimerStore';
import ReadinessGauge from './ReadinessGauge';
import RecommendationList from './RecommendationList';

export default function GameReadinessPanel() {
  const latestSnapshot = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );
  const { info: hwInfo, diskUsagePercent } = useHardwareData();
  const { timerState } = useTimerState();
  const { snapshot: frameTimeSnapshot } = useFrameTimeState();
  const { activeProfileId, profiles } = useGameProfileState();

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId],
  );

  const input: ReadinessInput = useMemo(
    () => ({
      cpuPercent: latestSnapshot?.cpuPercent ?? null,
      memUsedMb: latestSnapshot?.memUsedMb ?? null,
      memTotalMb: latestSnapshot?.memTotalMb ?? null,
      gpuUsagePercent: hwInfo?.gpuUsagePercent ?? null,
      gpuTempC: hwInfo?.gpuTempC ?? null,
      diskUsagePercent,
      isProfileApplied: activeProfileId != null,
      boostLevel: activeProfile?.boostLevel ?? 'none',
      timerState,
      affinityConfigured:
        activeProfile?.cpuAffinityGame != null && activeProfile.cpuAffinityGame.length > 0,
      frameTime: frameTimeSnapshot,
    }),
    [
      latestSnapshot,
      hwInfo,
      diskUsagePercent,
      activeProfileId,
      activeProfile,
      timerState,
      frameTimeSnapshot,
    ],
  );

  const result = useMemo(() => calcReadiness(input), [input]);

  const getAxisColor = (score: number): string => {
    if (score >= 80) return 'bg-success-500';
    if (score >= 50) return 'bg-accent-500';
    if (score >= 30) return 'bg-warm-500';
    return 'bg-danger-500';
  };

  const axisLabels = [
    { label: 'リソース', score: result.axes.resource },
    { label: '最適化', score: result.axes.optimization },
    { label: 'FPS', score: result.axes.performance, isPerformance: true },
  ];

  return (
    <div className="card-glass-elevated rounded-xl h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-white/[0.05]">
        <div className="w-0.5 h-3.5 rounded-full bg-accent-500 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">
          GAME READINESS
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-2 px-3 pb-3 pt-2">
        {/* Gauge + axes */}
        <div className="flex items-center gap-3">
          <ReadinessGauge score={result.total} rank={result.rank} size={80} />
          <div className="flex-1 flex flex-col gap-1.5">
            {axisLabels.map(({ label, score, isPerformance }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted w-12 uppercase">{label}</span>
                {isPerformance && score < 0 ? (
                  <span className="text-[10px] text-text-muted">N/A</span>
                ) : (
                  <>
                    <div className="flex-1 h-1 bg-base-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${getAxisColor(score)}`}
                        style={progressWidth(score)}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-text-primary w-5 text-right">
                      {score}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="flex-1 overflow-hidden">
          <RecommendationList recommendations={result.recommendations} />
        </div>
      </div>
    </div>
  );
}
