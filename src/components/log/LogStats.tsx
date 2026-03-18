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
        return 'text-danger-500';
      case 'Warn':
        return 'text-accent-500';
      case 'Info':
        return 'text-accent-500';
      default:
        return 'text-text-muted';
    }
  };

  return (
    <div className="font-mono text-xs text-text-secondary mb-4">
      <div className="flex items-center gap-4 mb-2">
        <span>
          Total: <span className="text-text-primary">{totalLogs}</span>
        </span>
        <span>
          Filtered: <span className="text-text-primary">{filteredLogs}</span>
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
