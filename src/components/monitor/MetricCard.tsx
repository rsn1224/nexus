import { memo } from 'react';

interface Props {
  label: string;
  value: string;
  unit: string;
  percent: number;
  warn?: boolean;
  critical?: boolean;
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  unit,
  percent,
  warn = false,
  critical = false,
}: Props) {
  const barClass = critical ? 'bg-danger-500' : warn ? 'bg-warning-500' : 'bg-accent-500';

  const valueClass = critical ? 'text-danger-500' : warn ? 'text-warning-500' : 'text-text-primary';

  const pct = Math.max(0, Math.min(100, percent));

  return (
    <div className="piano-surface rounded p-3 flex flex-col gap-2">
      <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xl font-mono font-bold ${valueClass}`}>{value}</span>
        <span className="text-text-secondary text-xs font-mono">{unit}</span>
      </div>
      <div className="h-1 bg-base-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
