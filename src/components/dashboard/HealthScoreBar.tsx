import { memo } from 'react';
import type { HealthGrade, HealthScore } from '../../types/v2';

interface Props {
  healthScore: HealthScore | null;
  loading: boolean;
  onOptimizeNow: () => void;
}

const GRADE_CLASS: Record<HealthGrade, string> = {
  S: 'text-success-500',
  A: 'text-accent-500',
  B: 'text-accent-400',
  C: 'text-warning-500',
  D: 'text-danger-500',
};

const TRACK_CLASS: Record<HealthGrade, string> = {
  S: 'bg-success-500',
  A: 'bg-accent-500',
  B: 'bg-accent-400',
  C: 'bg-warning-500',
  D: 'bg-danger-500',
};

export const HealthScoreBar = memo(function HealthScoreBar({
  healthScore,
  loading,
  onOptimizeNow,
}: Props) {
  if (!healthScore) {
    return (
      <div className="flex items-center justify-between px-4 h-14 shrink-0 piano-surface border-b border-border-subtle">
        <span className="text-text-secondary text-xs font-mono uppercase tracking-widest">
          {loading ? 'LOADING...' : 'SYSTEM HEALTH: —'}
        </span>
      </div>
    );
  }

  const gradeClass = GRADE_CLASS[healthScore.grade];
  const trackClass = TRACK_CLASS[healthScore.grade];
  const pct = Math.max(0, Math.min(100, healthScore.score));

  return (
    <div className="flex flex-col gap-1 px-4 py-2 shrink-0 piano-surface border-b border-border-subtle">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-text-secondary text-xs font-mono uppercase tracking-widest">
            SYSTEM HEALTH
          </span>
          <span className="text-text-primary text-sm font-mono font-bold">
            {healthScore.score}
            <span className="text-text-secondary text-xs">/100</span>
          </span>
          <span className={`text-xs font-mono font-bold ${gradeClass}`}>[{healthScore.grade}]</span>
        </div>
        <button
          type="button"
          onClick={onOptimizeNow}
          className="text-xs font-mono uppercase tracking-widest px-3 py-1 border border-accent-500 text-accent-500 hover:bg-accent-500/10 transition-colors rounded"
        >
          OPTIMIZE NOW ▶
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 bg-base-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${trackClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-text-secondary text-xs font-mono shrink-0">{healthScore.label}</span>
      </div>
    </div>
  );
});
