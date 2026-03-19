import { memo, useMemo } from 'react';
import type { SessionListItem } from '../../types/v2';

interface Props {
  sessions: SessionListItem[];
  range: '7d' | '30d';
  onRangeChange: (range: '7d' | '30d') => void;
}

function buildPath(sessions: SessionListItem[], width: number, height: number): string {
  if (sessions.length < 2) return '';

  const step = width / (sessions.length - 1);
  const maxFps = Math.max(...sessions.map((s) => s.summary.avgFps), 1);

  return sessions
    .map((s, i) => {
      const x = i * step;
      const y = height - (s.summary.avgFps / maxFps) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export const TrendChart = memo(function TrendChart({ sessions, range, onRangeChange }: Props) {
  const W = 800;
  const H = 240;

  const filtered = useMemo(() => {
    const now = Date.now();
    const ms = range === '7d' ? 7 * 86400_000 : 30 * 86400_000;
    return sessions
      .filter((s) => new Date(s.startedAt).getTime() >= now - ms)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  }, [sessions, range]);

  const linePath = useMemo(() => buildPath(filtered, W, H), [filtered]);
  const areaPath = linePath ? `${linePath} L${W},${H} L0,${H} Z` : '';

  const peakFps = filtered.length > 0 ? Math.max(...filtered.map((s) => s.summary.avgFps)) : 0;
  const avgLatency =
    filtered.length > 0
      ? filtered.reduce((sum, s) => sum + (s.summary.maxFrameTimeMs ?? 0), 0) / filtered.length
      : 0;

  return (
    <div className="glass-panel p-6 flex flex-col min-h-[400px]">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="font-black text-[10px] tracking-[0.3em] text-accent-500 uppercase flex items-center gap-3">
            <span className="glow-green-icon">📊</span>
            PERFORMANCE TREND / 性能推移
          </h3>
          <p className="text-text-muted text-[9px] tracking-[0.2em] mt-1.5">
            {'HISTORICAL VOLATILITY REPORT // NODE: 7-X'}
          </p>
        </div>
        <div className="flex p-1 bg-black/40 border border-white/5">
          {(['7d', '30d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`px-5 py-2 text-[9px] font-black tracking-[0.2em] uppercase transition-all ${
                range === r
                  ? 'bg-accent-500 text-base-900 shadow-[0_0_20px_rgba(68,214,44,0.4)]'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="flex-1 relative mb-6">
        {filtered.length < 2 ? (
          <div className="flex items-center justify-center h-full text-text-secondary text-xs">
            NOT ENOUGH DATA
          </div>
        ) : (
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Performance trend chart"
          >
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity="0.3" />
                <stop offset="80%" stopColor="var(--color-accent-500)" stopOpacity="0.05" />
                <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g stroke="rgba(68,214,44,0.05)" strokeDasharray="2,4" strokeWidth="0.5">
              <line x1="0" y1={H * 0.25} x2={W} y2={H * 0.25} />
              <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} />
              <line x1="0" y1={H * 0.75} x2={W} y2={H * 0.75} />
            </g>
            {areaPath && <path d={areaPath} fill="url(#trendGrad)" />}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="var(--color-accent-500)"
                strokeWidth="3"
                strokeLinecap="round"
                className="drop-shadow-[0_0_12px_rgba(68,214,44,0.6)]"
              />
            )}
          </svg>
        )}
      </div>

      {/* Bottom Stats */}
      <div className="pt-4 border-t border-white/3 flex justify-between items-center bg-white/1 -mx-6 px-6">
        <div className="flex gap-12">
          <div>
            <p className="text-[8px] text-text-muted uppercase tracking-[0.2em] mb-1.5">PEAK FPS</p>
            <p className="text-text-primary font-black text-2xl tracking-tighter">
              {peakFps.toFixed(0)}
              <span className="text-[12px] opacity-40 ml-1">FPS</span>
            </p>
          </div>
          <div>
            <p className="text-[8px] text-text-muted uppercase tracking-[0.2em] mb-1.5">
              AVG FRAME TIME
            </p>
            <p className="text-text-primary font-black text-2xl tracking-tighter">
              {avgLatency.toFixed(1)}
              <span className="text-[12px] opacity-40 ml-1">MS</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-text-muted uppercase tracking-[0.2em] mb-1.5">PROJECTION</p>
          <p className="text-accent-500 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-end gap-3">
            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full pulse-node" />
            STABLE OUTLOOK
          </p>
        </div>
      </div>
    </div>
  );
});
