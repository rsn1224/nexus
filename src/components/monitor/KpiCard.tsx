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
      className={`glass-panel bloom-border p-6 relative overflow-hidden h-32 flex flex-col justify-between group ${c.border}`}
    >
      {/* Top Right Icon */}
      <div className="absolute top-6 right-6">
        <span
          className="material-symbols-outlined text-[20px] text-white/30 group-hover:text-accent-500 transition-colors"
          aria-hidden="true"
        >
          {color === 'accent' ? 'speed' : color === 'info' ? 'network_check' : 'warning'}
        </span>
      </div>

      <div className="flex justify-between items-start">
        <p className={`text-[10px] tracking-widest text-white/60 uppercase ${c.labelClass}`}>
          {label}
        </p>
        {moduleId && <span className="text-[6px] text-accent-500/20 font-data">{moduleId}</span>}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-data text-text-primary">{value}</span>
        <span className="text-xl font-data text-white/40">{unit}</span>
      </div>

      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
        <div
          className={`h-full ${c.bar} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});
