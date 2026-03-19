import { memo, useMemo } from 'react';

interface Props {
  cpuPercent: number;
}

const CORE_IDS = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'cA', 'cB'];
const WARN_THRESHOLD = 75;
const CRITICAL_THRESHOLD = 90;

export const CoreLoadChart = memo(function CoreLoadChart({ cpuPercent }: Props) {
  const bars = useMemo(
    () =>
      CORE_IDS.map((id, i) => {
        const base = cpuPercent * (0.3 + Math.sin(i * 0.8) * 0.7);
        return { id, h: Math.max(5, Math.min(100, base + (i % 3) * 8)) };
      }),
    [cpuPercent],
  );

  return (
    <div className="piano-surface p-5 relative overflow-hidden flex-1 min-h-[220px]">
      <div className="absolute top-2 left-4 text-[7px] text-accent-500/30 tracking-widest uppercase">
        VIS_LOG_DATA_FEED_01.12
      </div>
      <div className="absolute top-2 right-4 flex items-center gap-2 text-[10px] text-text-secondary tracking-widest">
        <span className="w-1.5 h-1.5 bg-accent-500 rounded-full bloom-razer" />
        {'コア負荷分散 / CORE_LOAD_DISTRIBUTION'}
      </div>
      <div className="absolute inset-0 grid-bg opacity-10" />

      <div className="relative h-full flex items-end gap-1.5 pt-8">
        {bars.map((bar) => {
          const isWarn = bar.h >= WARN_THRESHOLD && bar.h < CRITICAL_THRESHOLD;
          const isCritical = bar.h >= CRITICAL_THRESHOLD;
          const barColor = isCritical
            ? 'bg-danger-500/40 border-t border-t-danger-500/80 shadow-[inset_0_0_20px_rgba(255,49,49,0.2)] bloom-red'
            : isWarn
              ? 'bg-warning-500/30 border-t border-t-warning-500/70 shadow-[inset_0_0_15px_rgba(255,215,0,0.1)]'
              : 'bg-accent-500/20 border-t border-t-accent-500/60';

          return (
            <div
              key={bar.id}
              className={`flex-1 transition-all duration-300 hover:bg-accent-500/40 cursor-pointer ${barColor}`}
              style={{ height: `${bar.h}%` }}
            />
          );
        })}
      </div>
    </div>
  );
});
