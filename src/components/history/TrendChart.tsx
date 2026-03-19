import { memo, useMemo } from 'react';
import type { SessionListItem } from '../../types/v2';

interface Props {
  sessions: SessionListItem[];
  range: '7d' | '30d';
}

function buildPoints(
  sessions: SessionListItem[],
  width: number,
  height: number,
): { avg: string; low: string } {
  if (sessions.length < 2) return { avg: '', low: '' };

  const step = width / (sessions.length - 1);
  const maxFps = Math.max(...sessions.map((s) => s.summary.avgFps), 1);

  const avgCoords = sessions.map((s, i) => ({
    x: i * step,
    y: height - (s.summary.avgFps / maxFps) * height,
  }));
  const lowCoords = sessions.map((s, i) => ({
    x: i * step,
    y: height - (s.summary.pct1Low / maxFps) * height,
  }));

  const toPath = (pts: typeof avgCoords) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return { avg: toPath(avgCoords), low: toPath(lowCoords) };
}

export const TrendChart = memo(function TrendChart({ sessions, range }: Props) {
  const W = 400;
  const H = 80;

  const filtered = useMemo(() => {
    const now = Date.now();
    const ms = range === '7d' ? 7 * 86400_000 : 30 * 86400_000;
    return sessions
      .filter((s) => new Date(s.startedAt).getTime() >= now - ms)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  }, [sessions, range]);

  const { avg, low } = useMemo(() => buildPoints(filtered, W, H), [filtered]);

  if (filtered.length < 2) {
    return (
      <div className="piano-surface rounded p-3 flex items-center justify-center h-24">
        <span className="text-text-secondary text-xs font-mono">NOT ENOUGH DATA</span>
      </div>
    );
  }

  return (
    <div className="piano-surface rounded p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">FPS TREND</p>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-accent-500" />
            <span className="text-text-secondary">AVG</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-warning-500" />
            <span className="text-text-secondary">1% LOW</span>
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="FPS トレンドグラフ"
        className="w-full h-20"
      >
        {avg && (
          <path
            d={avg}
            stroke="var(--color-accent-500)"
            strokeWidth={1.5}
            fill="none"
            strokeLinejoin="round"
          />
        )}
        {low && (
          <path
            d={low}
            stroke="var(--color-warning-500)"
            strokeWidth={1.5}
            fill="none"
            strokeLinejoin="round"
            strokeDasharray="4 2"
          />
        )}
      </svg>
    </div>
  );
});
