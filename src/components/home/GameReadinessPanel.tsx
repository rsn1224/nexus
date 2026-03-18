import { useMemo } from 'react';
import { calcReadiness, type ReadinessInput } from '../../lib/gameReadiness';
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

  const axisLabels = [
    { label: 'リソース', score: result.axes.resource },
    { label: '最適化', score: result.axes.optimization },
    { label: 'FPS', score: result.axes.performance, isPerformance: true },
  ];

  return (
    <div className="p-3 bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded mt-4">
      {/* ヘッダー */}
      <div className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-primary)] mb-3">
        GAME READINESS
      </div>

      {/* ゲージ + 3軸 */}
      <div className="flex items-center gap-4 mb-3">
        {/* 円弧ゲージ */}
        <ReadinessGauge score={result.total} rank={result.rank} />

        {/* 3軸スコア */}
        <div className="flex-1 flex flex-col gap-2">
          {axisLabels.map(({ label, score, isPerformance }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.1em] w-[52px]">
                {label}
              </span>
              {isPerformance && score < 0 ? (
                <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
                  N/A
                </span>
              ) : (
                <>
                  <div className="flex-1 h-1.5 bg-[var(--color-base-700)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(0, score)}%`,
                        backgroundColor:
                          score >= 70
                            ? 'var(--color-success-500)'
                            : score >= 40
                              ? 'var(--color-accent-400)'
                              : 'var(--color-danger-500)',
                      }}
                    />
                  </div>
                  <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)] w-[24px] text-right">
                    {score}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 推奨事項 */}
      <RecommendationList recommendations={result.recommendations} />
    </div>
  );
}
