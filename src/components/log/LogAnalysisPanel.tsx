import type React from 'react';
import type { LogAnalysis } from '../../types';

interface LogAnalysisPanelProps {
  analysis: LogAnalysis;
}

export function LogAnalysisPanel({ analysis }: LogAnalysisPanelProps): React.ReactElement {
  return (
    <div className="space-y-3">
      {/* サマリーセクション */}
      <div className="text-xs text-text-secondary font-semibold">▶ ANALYSIS SUMMARY</div>

      {/* レベル別カウント — 横並び */}
      <div className="grid grid-cols-4 gap-2">
        <StatCell label="TOTAL" value={analysis.totalEntries} />
        <StatCell label="ERROR" value={analysis.errorCount} color="danger" />
        <StatCell label="WARN" value={analysis.warningCount} color="accent" />
        <StatCell label="INFO" value={analysis.infoCount} />
      </div>

      {/* 時間範囲 */}
      <div className="text-xs text-text-muted">RANGE: {analysis.timeRange}</div>

      {/* トップソース */}
      {analysis.topSources.length > 0 && (
        <div>
          <div className="text-xs text-text-muted mb-1">TOP SOURCES</div>
          <div className="space-y-0.5">
            {analysis.topSources.map(([source, count]) => (
              <div
                key={source}
                className="flex items-center justify-between text-xs text-text-secondary px-2 py-0.5 bg-base-800"
              >
                <span className="truncate">{source}</span>
                <span className="text-text-muted ml-2">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 統計セル（内部コンポーネント）
function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: 'danger' | 'accent';
}): React.ReactElement {
  const valueClass =
    color === 'danger'
      ? 'text-danger-500'
      : color === 'accent'
        ? 'text-accent-500'
        : 'text-text-primary';

  return (
    <div className="bg-base-800 px-2 py-1.5 border border-border-subtle">
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`text-[14px] font-mono font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}
