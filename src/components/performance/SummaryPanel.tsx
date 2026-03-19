import type React from 'react';
import { fmtNum } from '../../lib/formatters';
import type { SessionSummary } from '../../types';

interface SummaryPanelProps {
  summary: SessionSummary;
  title?: string;
}

export default function SummaryPanel({ summary, title }: SummaryPanelProps): React.ReactElement {
  return (
    <div className="bg-base-800 border border-border-subtle rounded-lg p-2 space-y-1 flex-1">
      {title && <div className="text-xs text-text-muted mb-2 uppercase">{title}</div>}
      {(
        [
          ['AVG FPS', fmtNum(summary.avgFps)],
          ['1% LOW', fmtNum(summary.pct1Low)],
          ['0.1% LOW', fmtNum(summary.pct01Low)],
          ['STUTTER', String(summary.totalStutterCount)],
          ['MIN FPS', fmtNum(summary.minFps)],
        ] as [string, string][]
      ).map(([label, value]) => (
        <div key={label} className="flex justify-between font-mono text-xs">
          <span className="text-text-muted">{label}</span>
          <span className="text-text-primary">{value}</span>
        </div>
      ))}
    </div>
  );
}
