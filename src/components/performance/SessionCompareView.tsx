import type React from 'react';
import { fmtDate, fmtNum } from '../../lib/formatters';
import type { SessionComparisonResult, SessionListItem } from '../../types';
import SummaryPanel from './SummaryPanel';

interface SessionCompareViewProps {
  sessionList: SessionListItem[];
  comparisonResult: SessionComparisonResult | null;
  compareAId: string;
  compareBId: string;
  onSetCompareAId: (id: string) => void;
  onSetCompareBId: (id: string) => void;
  onCompare: () => void;
}

export default function SessionCompareView({
  sessionList,
  comparisonResult,
  compareAId,
  compareBId,
  onSetCompareAId,
  onSetCompareBId,
  onCompare,
}: SessionCompareViewProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        {(['A', 'B'] as const).map((side) => {
          const val = side === 'A' ? compareAId : compareBId;
          const setter = side === 'A' ? onSetCompareAId : onSetCompareBId;
          return (
            <div key={side} className="flex-1">
              <div className="font-mono text-[9px] text-text-muted mb-1">SESSION {side}</div>
              <select
                aria-label={`Session ${side}`}
                value={val}
                onChange={(e) => setter(e.target.value)}
                className="w-full px-2 py-1 font-mono text-[10px] bg-base-800 border border-border-subtle text-text-primary rounded"
              >
                <option value="">選択...</option>
                {sessionList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.gameName} {fmtDate(s.startedAt)}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
        <button
          type="button"
          onClick={onCompare}
          disabled={!compareAId || !compareBId || compareAId === compareBId}
          className="px-3 py-1 font-mono text-[10px] bg-accent-500 text-white rounded disabled:opacity-50"
        >
          COMPARE
        </button>
      </div>

      {comparisonResult && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <SummaryPanel summary={comparisonResult.sessionA} title="Session A" />
            <SummaryPanel summary={comparisonResult.sessionB} title="Session B" />
          </div>
          <div className="bg-base-800 border border-border-subtle rounded p-2 space-y-1">
            <div className="font-mono text-[9px] text-text-muted mb-1">DELTA</div>
            {(
              [
                ['FPS', comparisonResult.fpsDeltaPct, '%'],
                ['1% LOW', comparisonResult.pct1LowDeltaPct, '%'],
                ['0.1% LOW', comparisonResult.pct01LowDeltaPct, '%'],
                ['STUTTER', comparisonResult.stutterDelta, ''],
              ] as [string, number, string][]
            ).map(([label, delta, unit]) => (
              <div key={label} className="flex justify-between font-mono text-[11px]">
                <span className="text-text-muted">{label}</span>
                <span
                  className={
                    delta > 0
                      ? 'text-accent-500'
                      : delta < 0
                        ? 'text-danger-500'
                        : 'text-text-primary'
                  }
                >
                  {delta > 0 ? '+' : ''}
                  {fmtNum(delta)}
                  {unit}
                </span>
              </div>
            ))}
          </div>
          {comparisonResult.autoSummary && (
            <div className="font-mono text-[10px] text-text-secondary">
              {comparisonResult.autoSummary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
