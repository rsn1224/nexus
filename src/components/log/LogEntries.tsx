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
  getLevelTextClass: (level: string) => string;
  getLevelDotClass: (level: string) => string;
}

export default function LogEntries({
  logs,
  getLevelTextClass,
  getLevelDotClass,
}: LogEntriesProps): React.ReactElement {
  return (
    <div className="space-y-1">
      {logs.map((log) => (
        <div
          key={`${log.timestamp}-${log.source}-${log.message.slice(0, 20)}`}
          className="font-mono text-xs border-b border-border-subtle pb-1"
        >
          <div className="flex items-start gap-2">
            <div
              className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${getLevelDotClass(log.level)}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-text-muted">{formatTimestamp(log.timestamp)}</span>
                <span className="text-text-muted">•</span>
                <span className="text-text-muted">{log.source}</span>
                <span className="text-text-muted">•</span>
                <span className={getLevelTextClass(log.level)}>{log.level}</span>
              </div>
              <div className="text-text-primary break-words">{truncateMessage(log.message)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
