import { memo, useMemo } from 'react';
import type { ResourceSnapshot } from '../../types/pulse';

interface Props {
  snapshots: ResourceSnapshot[];
  field: 'cpuPercent' | 'memUsedMb';
  label: string;
  color: 'accent' | 'warning' | 'danger';
  maxValue?: number;
  height?: number;
}

const COLOR_STROKE: Record<string, string> = {
  accent: 'var(--color-accent-500)',
  warning: 'var(--color-warning-500)',
  danger: 'var(--color-danger-500)',
};

const COLOR_FILL: Record<string, string> = {
  accent: 'var(--color-accent-500)',
  warning: 'var(--color-warning-500)',
  danger: 'var(--color-danger-500)',
};

function buildPath(
  points: number[],
  width: number,
  height: number,
  maxVal: number,
): { line: string; area: string } {
  if (points.length < 2) return { line: '', area: '' };

  const step = width / (points.length - 1);
  const coords = points.map((v, i) => ({
    x: i * step,
    y: height - (v / maxVal) * height,
  }));

  const lineD = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const areaD = `${lineD} L${(width).toFixed(1)},${height} L0,${height} Z`;

  return { line: lineD, area: areaD };
}

export const TimelineGraph = memo(function TimelineGraph({
  snapshots,
  field,
  label,
  color,
  maxValue,
  height = 48,
}: Props) {
  const width = 300;

  const { points, max } = useMemo(() => {
    const vals = snapshots.map((s) => s[field] as number);
    const computed = maxValue ?? Math.max(...vals, 1);
    return { points: vals, max: computed };
  }, [snapshots, field, maxValue]);

  const { line, area } = useMemo(
    () => buildPath(points, width, height, max),
    [points, height, max],
  );

  const stroke = COLOR_STROKE[color];
  const fill = COLOR_FILL[color];

  return (
    <div className="card-glass rounded p-2 flex flex-col gap-1">
      <p className="text-text-secondary text-xs font-mono uppercase tracking-widest px-1">
        {label}
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="w-full"
        style={{ height: `${height}px` }}
      >
        {area && <path d={area} fill={fill} fillOpacity={0.12} />}
        {line && <path d={line} stroke={stroke} strokeWidth={1.5} fill="none" />}
      </svg>
    </div>
  );
});
