import { memo } from 'react';

interface Props {
  label: string;
  value: string;
  unit: string;
  percent: number;
  color: 'accent' | 'info' | 'warning';
  moduleId?: string;
}

const COLOR_MAP = {
  accent: {
    bar: 'bg-accent-500 bloom-razer shadow-[0_0_10px_var(--color-accent-500)]',
    icon: 'text-accent-500 bloom-razer',
    labelClass: 'text-text-muted',
    border: '',
  },
  info: {
    bar: 'bg-info-500 shadow-[0_0_10px_var(--color-info-500)]',
    icon: 'text-info-500 shadow-[0_0_12px_var(--color-info-500)]',
    labelClass: 'text-text-muted',
    border: '',
  },
  warning: {
    bar: 'bg-warning-500 shadow-[0_0_10px_var(--color-warning-500)]',
    icon: 'text-warning-500 shadow-[0_0_12px_var(--color-warning-500)]',
    labelClass: 'text-warning-500/60',
    border: 'border-warning-500/30 hover:bg-warning-500/5',
  },
} as const;

export const KpiCard = memo(function KpiCard({
  label,
  value,
  unit,
  percent,
  color,
  moduleId,
}: Props) {
  const c = COLOR_MAP[color];
  const pct = Math.max(0, Math.min(100, percent));

  return (
    <div
      className={`piano-surface p-4 relative overflow-hidden h-24 flex flex-col justify-between hover:bg-white/[0.02] transition-all ${c.border}`}
    >
      <div className="flex justify-between items-start">
        <p className={`text-[9px] tracking-[0.2em] uppercase ${c.labelClass}`}>{label}</p>
        {moduleId && <span className="text-[6px] text-accent-500/20">{moduleId}</span>}
      </div>
      <span className="text-3xl font-black text-text-primary">
        {value}
        <span className="text-sm text-text-muted font-medium ml-1">{unit}</span>
      </span>
      <div className="h-1 bg-white/[0.03] overflow-hidden rounded-full mt-2">
        <div
          className={`h-full ${c.bar} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
