import { memo, useMemo } from 'react';

type KpiColor = 'warm' | 'accent' | 'purple' | 'info';

interface KpiCardProps {
  label: string;
  value: string;
  color: KpiColor;
  sparkline?: number[];
  numericValue?: number;
}

const COLOR_MAP: Record<
  KpiColor,
  { text: string; glow: string; spark: string; bar: string; border: string }
> = {
  warm: {
    text: 'text-warm-500',
    glow: 'glow-warm',
    spark: 'rgba(229,229,229,0.35)',
    bar: 'bg-warm-500',
    border: 'border-warm-500/30',
  },
  accent: {
    text: 'text-accent-500',
    glow: 'glow-cyan',
    spark: 'rgba(252,238,10,0.5)',
    bar: 'bg-accent-500',
    border: 'border-accent-500/30',
  },
  purple: {
    text: 'text-purple-500',
    glow: 'glow-purple',
    spark: 'rgba(255,0,60,0.45)',
    bar: 'bg-purple-500',
    border: 'border-purple-500/30',
  },
  info: {
    text: 'text-info-500',
    glow: 'glow-info',
    spark: 'rgba(0,233,254,0.45)',
    bar: 'bg-info-500',
    border: 'border-info-500/30',
  },
};

function SparklineSvg({ data, color }: { data: number[]; color: string }) {
  const width = 100;
  const height = 28;
  const padding = 1;

  const points = useMemo(() => {
    if (data.length < 2) return '';
    const step = (width - padding * 2) / (data.length - 1);
    return data
      .map((v, i) => {
        const x = padding + i * step;
        const y = height - padding - (Math.min(Math.max(v, 0), 100) / 100) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [data]);

  if (data.length < 2) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full h-7"
      role="img"
      aria-label="スパークライングラフ"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const KpiCard = memo(function KpiCard({
  label,
  value,
  color,
  sparkline,
  numericValue,
}: KpiCardProps) {
  const { text, glow, spark, border } = COLOR_MAP[color];
  const isHigh = numericValue !== undefined && numericValue >= 80;
  const isCritical = numericValue !== undefined && numericValue >= 90;

  return (
    <div
      className={`card-glass rounded-xl p-3 flex flex-col gap-1 flex-1 transition-all duration-200 hover:-translate-y-0.5 hover:${glow} border ${
        isHigh ? border : 'border-white/[0.04]'
      }`}
    >
      <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{label}</span>
      <span
        className={`font-mono text-3xl font-bold leading-none ${text} ${isCritical ? 'animate-pulse' : ''}`}
      >
        {value}
      </span>
      {sparkline && sparkline.length >= 2 && (
        <div className="mt-1 opacity-70">
          <SparklineSvg data={sparkline} color={spark} />
        </div>
      )}
    </div>
  );
});

export default KpiCard;
