import { memo } from 'react';
import type { HealthGrade, HealthScore } from '../../types/v2';

interface Props {
  healthScore: HealthScore | null;
  loading: boolean;
  onOptimizeNow: () => void;
}

const GRADE_LABEL: Record<HealthGrade, string> = {
  S: 'PEAK_PERFORMANCE',
  A: 'INTEGRITY_OPTIMAL',
  B: 'SYSTEM_STABLE',
  C: 'DEGRADED_STATE',
  D: 'CRITICAL_FAILURE',
};

const CIRCUMFERENCE = 2 * Math.PI * 150;

export const IntegrityRing = memo(function IntegrityRing({
  healthScore,
  loading,
  onOptimizeNow,
}: Props) {
  const pct = healthScore ? Math.max(0, Math.min(100, healthScore.score)) : 0;
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const label = healthScore ? GRADE_LABEL[healthScore.grade] : 'INITIALIZING';

  return (
    <div className="flex flex-col items-center justify-center relative flex-1">
      {/* Background glow ring */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-[500px] h-[500px] border border-info-500 rounded-full blur-3xl" />
      </div>

      {/* SVG Gauge */}
      <div className="relative flex items-center justify-center">
        <svg className="w-80 h-80 -rotate-90" aria-label={`システム整合性 ${pct}%`} role="img">
          <circle
            cx="160"
            cy="160"
            r="150"
            fill="transparent"
            stroke="rgba(68,214,44,0.1)"
            strokeWidth="1"
          />
          <circle
            className="bloom-razer transition-all duration-1000"
            cx="160"
            cy="160"
            r="150"
            fill="transparent"
            stroke="var(--color-accent-500)"
            strokeWidth="4"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="transparent"
            stroke="rgba(0,240,255,0.05)"
            strokeWidth="20"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="text-text-secondary text-[10px] tracking-widest opacity-70">
            システム整合性
          </span>
          <span className="text-8xl font-black tracking-tighter text-accent-500 bloom-razer">
            {loading ? '—' : pct}
            <span className="text-2xl">%</span>
          </span>
          <span className="text-[10px] font-light tracking-[0.3em] text-text-secondary mt-2 uppercase">
            {label}
          </span>
        </div>

        {/* Corner ornaments */}
        <div className="absolute -top-4 -left-4 w-4 h-4 border-t-2 border-l-2 border-accent-500" />
        <div className="absolute -bottom-4 -right-4 w-4 h-4 border-b-2 border-r-2 border-accent-500" />
      </div>

      {/* Optimize button */}
      <button
        type="button"
        onClick={onOptimizeNow}
        disabled={loading}
        className="mt-8 relative group px-10 py-3 bg-linear-to-br from-accent-500 to-accent-600 transition-all active:scale-95 disabled:opacity-40 overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="text-base-900 font-black text-sm tracking-[0.2em] uppercase relative z-10">
          OPTIMIZE NOW
        </span>
      </button>
    </div>
  );
});
