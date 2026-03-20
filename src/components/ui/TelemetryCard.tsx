import type React from 'react';
import { memo, useEffect, useRef, useState } from 'react';

type TelemetryStatus = 'optimal' | 'warning' | 'critical';

interface TelemetryCardProps {
  label: string;
  value: number;
  unit: string;
  subLabel?: string;
  status: TelemetryStatus;
  icon?: React.ReactNode;
  progressMax?: number;
  showWaveform?: boolean;
  className?: string;
}

const STATUS_COLORS = {
  optimal: { text: 'text-accent-500', bar: 'bg-accent-500', label: 'OPTIMAL' },
  warning: { text: 'text-warning-500', bar: 'bg-warning-500', label: 'WARNING' },
  critical: { text: 'text-danger-500', bar: 'bg-danger-500', label: 'CRITICAL' },
} as const;

export const TelemetryCard = memo(function TelemetryCard({
  label,
  value,
  unit,
  subLabel,
  status,
  icon,
  progressMax = 100,
  showWaveform = false,
  className = '',
}: TelemetryCardProps): React.ReactElement {
  const colors = STATUS_COLORS[status];
  const progressWidth = progressMax > 0 ? (value / progressMax) * 100 : 0;

  return (
    <div className={`piano-surface p-4 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-text-secondary uppercase tracking-widest">{label}</span>
        {icon && <span className={colors.text}>{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className={`font-black text-4xl ${colors.text}`}>{value.toFixed(1)}</span>
        <span className={`text-xl ${colors.text} opacity-70`}>{unit}</span>
      </div>

      <div className="h-0.5 bg-base-600 w-full mb-2">
        <div
          className={`h-full ${colors.bar} transition-all duration-300`}
          style={{ width: `${Math.min(100, progressWidth)}%` }}
        />
      </div>

      <div className="flex justify-between items-center mb-3">
        {subLabel && <span className="text-text-muted text-xs">{subLabel}</span>}
        <span className={`text-xs ${colors.text}`}>{colors.label}</span>
      </div>

      {showWaveform && <Waveform color={colors.bar} />}
    </div>
  );
});

// ─── Inline Waveform (no recharts dependency) ────────────

const WAVEFORM_POINTS = 30;
const WAVEFORM_W = 300;
const WAVEFORM_H = 40;

const Waveform = memo(function Waveform({ color }: { color: string }) {
  const [points, setPoints] = useState<number[]>(() =>
    Array.from({ length: WAVEFORM_POINTS }, () => Math.random() * WAVEFORM_H),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setPoints((prev) => {
        const next = [...prev.slice(1), Math.random() * WAVEFORM_H];
        return next;
      });
    }, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const step = WAVEFORM_W / (points.length - 1);
  const pathD = points
    .map((y, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(WAVEFORM_H - y).toFixed(1)}`)
    .join(' ');

  const strokeColor = color.includes('accent')
    ? 'var(--color-accent-500)'
    : color.includes('warning')
      ? 'var(--color-warning-500)'
      : 'var(--color-danger-500)';

  return (
    <div className="mt-3 pt-3 border-t border-base-600">
      <svg
        viewBox={`0 0 ${WAVEFORM_W} ${WAVEFORM_H}`}
        preserveAspectRatio="none"
        className="w-full h-10"
        role="img"
        aria-label="telemetry waveform"
      >
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" />
      </svg>
    </div>
  );
});
