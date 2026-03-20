import { memo } from 'react';

interface Props {
  percent: number;
  uptimeSeconds: number;
  latencyMs: number;
}

const CIRCUMFERENCE = 2 * Math.PI * 100;

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const StabilityGauge = memo(function StabilityGauge({
  percent,
  uptimeSeconds,
  latencyMs,
}: Props) {
  const pct = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const label = pct >= 90 ? '最適化済み / OPTIMIZED' : pct >= 60 ? 'DEGRADED' : 'CRITICAL';

  return (
    <div className="glass-panel bloom-border p-6 flex flex-col justify-between items-center relative overflow-hidden min-h-[400px]">
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="w-full flex justify-between items-start opacity-30 relative z-10">
        <span className="text-[7px] text-accent-500 tracking-tighter uppercase font-data">
          REF_STRM_X009 / 安定性スコア
        </span>
        <span className="text-[7px] text-accent-500 tracking-tighter font-data">BUFFER_OK</span>
      </div>

      <div className="relative z-10 text-center flex-1 flex flex-col justify-center">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-56 h-56 -rotate-90" aria-label={`安定性 ${pct}%`} role="img">
            <circle cx="112" cy="112" r="100" fill="transparent" stroke="#0a0a0a" strokeWidth="2" />
            <circle
              className="bloom-razer transition-all duration-1000"
              cx="112"
              cy="112"
              r="100"
              fill="transparent"
              stroke="var(--color-accent-500)"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-7xl font-black text-text-primary tracking-tighter font-data">
              {pct}
              <span className="text-2xl text-accent-500 bloom-razer ml-1">%</span>
            </span>
            <span className="text-[11px] text-accent-500 tracking-[0.3em] mt-2 bloom-razer font-bold">
              {label}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full flex gap-4 relative z-10 pt-4 border-t border-accent-500/10">
        <div className="flex-1 text-center">
          <p className="text-[9px] text-text-muted tracking-widest mb-1.5 uppercase">
            稼働時間 / UPTIME
          </p>
          <p className="text-base font-bold text-text-primary tracking-tight font-data">
            {formatUptime(uptimeSeconds)}
          </p>
        </div>
        <div className="w-px bg-accent-500/10 self-stretch" />
        <div className="flex-1 text-center">
          <p className="text-[9px] text-text-muted tracking-widest mb-1.5 uppercase">
            レイテンシ / LATENCY
          </p>
          <p className="text-base font-bold text-text-primary tracking-tight font-data">
            {latencyMs.toFixed(2)}ms
          </p>
        </div>
      </div>
    </div>
  );
});
