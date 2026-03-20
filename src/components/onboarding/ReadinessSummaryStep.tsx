import type React from 'react';
import { memo, useMemo } from 'react';
import type { ReadinessInput } from '../../lib/gameReadiness';
import { calcReadiness, getRankStyle } from '../../lib/gameReadiness';
import type { ScanResult } from './ScanStep';

interface Props {
  scanResult: ScanResult;
  onNext: () => void;
  onSkip: () => void;
}

const ReadinessSummaryStep = memo(function ReadinessSummaryStep({
  scanResult,
  onNext,
  onSkip,
}: Props): React.ReactElement {
  const readiness = useMemo(() => {
    const input: ReadinessInput = {
      cpuPercent: 30,
      memUsedMb: 8192,
      memTotalMb: 16384,
      gpuUsagePercent: null,
      gpuTempC: null,
      diskUsagePercent: 50,
      isProfileApplied: false,
      boostLevel: 'none',
      timerState: null,
      affinityConfigured: false,
      frameTime: null,
    };
    return calcReadiness(input);
  }, []);

  const rankStyle = getRankStyle(readiness.rank);
  const top3 = readiness.recommendations.slice(0, 3);

  return (
    <div className="wing-enter flex flex-col">
      <h2 className="text-[14px] font-bold font-mono text-text-primary mb-6 text-center">
        READINESS SUMMARY
      </h2>

      {/* Score Gauge */}
      <div className="glass-panel bloom-border p-6 mb-4 flex flex-col items-center">
        <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
          GAME READINESS SCORE
        </div>
        <div className="text-5xl font-data font-bold" style={{ color: rankStyle.color }}>
          {readiness.total}
        </div>
        <div
          className="text-[10px] font-mono font-bold uppercase tracking-widest mt-1 px-3 py-0.5 rounded-full"
          style={{ color: rankStyle.color, backgroundColor: `${rankStyle.color}20` }}
        >
          {rankStyle.label}
        </div>
      </div>

      {/* 3 Axis Scores */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <AxisCard label="RESOURCE" score={readiness.axes.resource} />
        <AxisCard label="OPTIMIZE" score={readiness.axes.optimization} />
        <AxisCard
          label="FPS"
          score={readiness.axes.performance >= 0 ? readiness.axes.performance : null}
        />
      </div>

      {/* Steam Info */}
      <div className="glass-panel bloom-border p-3 mb-4 text-center">
        <span className="text-[10px] font-mono text-text-muted">
          Steam: {scanResult.steamGames} games detected
        </span>
      </div>

      {/* Top 3 Recommendations */}
      {top3.length > 0 && (
        <div className="space-y-2 mb-6">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
            RECOMMENDATIONS
          </div>
          {top3.map((rec) => (
            <div key={rec.id} className="glass-panel bloom-border p-3 flex items-start gap-2">
              <PriorityDot priority={rec.priority} />
              <div className="text-[11px] font-mono text-text-secondary">{rec.message}</div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 bg-accent-500 text-base-900 font-black text-[12px] tracking-widest uppercase rounded-sm hover:brightness-110 transition-all"
      >
        次へ
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="mt-4 text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors uppercase tracking-widest text-center"
      >
        スキップ
      </button>
    </div>
  );
});

const AxisCard = memo(function AxisCard({
  label,
  score,
}: {
  label: string;
  score: number | null;
}): React.ReactElement {
  return (
    <div className="glass-panel bloom-border p-3 text-center">
      <div className="text-[8px] font-mono text-text-muted uppercase tracking-widest">{label}</div>
      <div className="text-xl font-data font-bold text-text-primary">
        {score !== null ? score : '--'}
      </div>
    </div>
  );
});

const PriorityDot = memo(function PriorityDot({
  priority,
}: {
  priority: 'high' | 'medium' | 'low';
}): React.ReactElement {
  const color =
    priority === 'high'
      ? 'bg-danger-500'
      : priority === 'medium'
        ? 'bg-warning-500'
        : 'bg-accent-500';
  return <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${color}`} />;
});

export default ReadinessSummaryStep;
