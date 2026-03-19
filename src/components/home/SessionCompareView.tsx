import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import type { SessionListItem } from '../../types';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDelta(pct: number): { text: string; cls: string } {
  if (pct > 0) return { text: `+${pct.toFixed(1)}%`, cls: 'text-success-500' };
  if (pct < 0) return { text: `${pct.toFixed(1)}%`, cls: 'text-danger-500' };
  return { text: '±0%', cls: 'text-text-muted' };
}

interface SessionCompareViewProps {
  sessions: SessionListItem[];
}

export default function SessionCompareView({ sessions }: SessionCompareViewProps) {
  const { compareSessions, comparisonResult, isLoading } = useSessionStore();
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  const handleCompare = () => {
    if (aId && bId && aId !== bId) {
      void compareSessions(aId, bId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(['A', 'B'] as const).map((side) => {
          const value = side === 'A' ? aId : bId;
          const setter = side === 'A' ? setAId : setBId;
          return (
            <div key={side} className="flex-1">
              <div className="text-[9px] text-text-muted mb-1">SESSION {side}</div>
              <select
                aria-label={`Session ${side}`}
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full px-2 py-1 font-mono text-[10px] bg-base-700 border border-border-subtle text-text-primary"
              >
                <option value="">SELECT...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.gameName} {formatDate(s.startedAt)}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleCompare}
        disabled={!aId || !bId || aId === bId || isLoading}
        className={`w-full py-[5px] text-[10px] font-bold border transition-colors ${
          !aId || !bId || aId === bId || isLoading
            ? 'bg-base-800 text-text-muted border-border-subtle cursor-not-allowed'
            : 'bg-accent-500 text-base-900 border-accent-500 cursor-pointer hover:bg-accent-600'
        }`}
      >
        {isLoading ? 'COMPARING...' : 'COMPARE'}
      </button>

      {comparisonResult && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
          <div className="text-[9px] text-text-muted">COMPARISON RESULT</div>
          <div className="flex flex-col gap-1">
            {(
              [
                {
                  label: 'AVG FPS',
                  aVal: comparisonResult.sessionA.avgFps,
                  bVal: comparisonResult.sessionB.avgFps,
                  delta: comparisonResult.fpsDeltaPct,
                },
                {
                  label: '1% LOW',
                  aVal: comparisonResult.sessionA.pct1Low,
                  bVal: comparisonResult.sessionB.pct1Low,
                  delta: comparisonResult.pct1LowDeltaPct,
                },
                {
                  label: '0.1% LOW',
                  aVal: comparisonResult.sessionA.pct01Low,
                  bVal: comparisonResult.sessionB.pct01Low,
                  delta: comparisonResult.pct01LowDeltaPct,
                },
              ] as const
            ).map(({ label, aVal, bVal, delta }) => {
              const { text, cls } = formatDelta(delta);
              return (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[10px] text-text-muted">{label}</span>
                  <div className="flex gap-4 font-mono text-[10px]">
                    <span className="text-text-secondary">{aVal.toFixed(1)}</span>
                    <span className="text-text-muted">→</span>
                    <span className="text-text-secondary">{bVal.toFixed(1)}</span>
                    <span className={cls}>{text}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-text-muted">STUTTER Δ</span>
              <span
                className={`font-mono text-[10px] ${comparisonResult.stutterDelta <= 0 ? 'text-success-500' : 'text-danger-500'}`}
              >
                {comparisonResult.stutterDelta > 0 ? '+' : ''}
                {comparisonResult.stutterDelta}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-border-subtle">
            <div className="text-[9px] text-text-muted mb-1">SUMMARY</div>
            <div className="text-[10px] text-text-secondary leading-relaxed">
              {comparisonResult.autoSummary}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
