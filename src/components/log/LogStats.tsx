import type React from 'react';

interface LogStatsProps {
  logCounts: Record<string, number>;
  totalLogs: number;
  filteredLogs: number;
}

export default function LogStats({
  logCounts,
  totalLogs,
  filteredLogs,
}: LogStatsProps): React.ReactElement {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Error':
        return 'text-[var(--color-danger-500)]';
      case 'Warn':
        return 'text-[var(--color-accent-500)]';
      case 'Info':
        return 'text-[var(--color-cyan-500)]';
      default:
        return 'text-[var(--color-text-muted)]';
    }
  };

  return (
    <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] mb-4">
      <div className="flex items-center gap-4 mb-2">
        <span>
          Total: <span className="text-[var(--color-text-primary)]">{totalLogs}</span>
        </span>
        <span>
          Filtered: <span className="text-[var(--color-text-primary)]">{filteredLogs}</span>
        </span>
      </div>
      <div className="flex gap-4">
        {Object.entries(logCounts).map(([level, count]) => (
          <span key={level}>
            {level}: <span className={getLevelColor(level)}>{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
