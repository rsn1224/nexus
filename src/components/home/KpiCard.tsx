import { memo, useMemo } from 'react';

type KpiColor = 'warm' | 'accent' | 'purple' | 'info';

interface KpiCardProps {
  label: string;
  value: string;
  color: KpiColor;
  sparkline?: number[];
}

const COLOR_MAP: Record<KpiColor, { text: string; glow: string; spark: string }> = {
  warm: { text: 'text-warm-500', glow: 'glow-warm', spark: 'rgba(245,158,11,0.4)' },
  accent: { text: 'text-accent-500', glow: 'glow-cyan', spark: 'rgba(6,182,212,0.4)' },
  purple: { text: 'text-purple-500', glow: 'glow-purple', spark: 'rgba(139,92,246,0.4)' },
  info: { text: 'text-info-500', glow: 'glow-info', spark: 'rgba(96,165,250,0.4)' },
};

function SparklineSvg({ data, color }: { data: number[]; color: string }) {
  const width = 100;
  const height = 24;
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
      className="w-full h-6"
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

const KpiCard = memo(function KpiCard({ label, value, color, sparkline }: KpiCardProps) {
  const { text, glow, spark } = COLOR_MAP[color];

  return (
    <div
      className={`card-glass rounded-lg p-3 flex flex-col gap-1 flex-1 transition-all duration-200 hover:-translate-y-0.5 hover:${glow}`}
    >
      <span className="text-xs text-text-muted uppercase">{label}</span>
      <span className={`font-mono text-2xl font-bold leading-none ${text}`}>{value}</span>
      {sparkline && sparkline.length >= 2 && (
        <div className="mt-1">
          <SparklineSvg data={sparkline} color={spark} />
        </div>
      )}
    </div>
  );
});

export default KpiCard;
