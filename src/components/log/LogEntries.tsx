import type React from 'react';
import { formatTimestamp, truncateMessage } from '../../stores/useLogStore';

interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

interface LogEntriesProps {
  logs: LogEntry[];
}

const LEVEL_BADGE: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Error: {
    bg: 'bg-danger-500/10',
    border: 'border-danger-500/40',
    text: 'text-danger-400',
    dot: 'bg-danger-500',
  },
  Warn: {
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/40',
    text: 'text-warning-400',
    dot: 'bg-warning-500',
  },
  Info: {
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/30',
    text: 'text-accent-400',
    dot: 'bg-accent-500',
  },
  Debug: {
    bg: 'bg-base-700/60',
    border: 'border-white/[0.06]',
    text: 'text-text-muted',
    dot: 'bg-text-muted',
  },
};

function getLevelBadge(level: string) {
  return (
    LEVEL_BADGE[level] ?? {
      bg: 'bg-base-700/40',
      border: 'border-white/[0.04]',
      text: 'text-text-muted',
      dot: 'bg-text-muted',
    }
  );
}

export default function LogEntries({ logs }: LogEntriesProps): React.ReactElement {
  return (
    <div className="space-y-1">
      {logs.map((log) => {
        const badge = getLevelBadge(log.level);
        return (
          <div
            key={`${log.timestamp}-${log.source}-${log.message.slice(0, 20)}`}
            className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            {/* Level badge */}
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${badge.bg} ${badge.border} ${badge.text} shrink-0 mt-0.5`}
            >
              {log.level}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-mono text-[10px] text-text-muted">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className="text-text-muted opacity-30">•</span>
                <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                  {log.source}
                </span>
              </div>
              <div className="text-xs text-text-primary break-words leading-relaxed">
                {truncateMessage(log.message)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
