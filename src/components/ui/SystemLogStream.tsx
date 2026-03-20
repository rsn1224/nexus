import type React from 'react';
import { memo } from 'react';

type LogLevel = 'info' | 'warning' | 'error';

interface LogEntry {
  time: string;
  tag: string;
  message: string;
  level: LogLevel;
}

interface SystemLogStreamProps {
  logs: LogEntry[];
  className?: string;
}

const levelIndicator = {
  info: <span className="w-2 h-2 rounded-full bg-text-muted" />,
  warning: <span className="w-2 h-2 rounded-full bg-warning-500" />,
  error: <span className="text-danger-500 text-xs">✕</span>,
};

export const SystemLogStream = memo(function SystemLogStream({
  logs,
  className = '',
}: SystemLogStreamProps): React.ReactElement {
  return (
    <div className={`bg-base-700 border border-border-subtle p-4 ${className}`}>
      {/* Header */}
      <div className="font-mono text-xs text-text-secondary uppercase mb-3">SYSTEM_LOGS_STREAM</div>

      {/* Log Entries */}
      <div className="space-y-1">
        {logs.map((log) => (
          <div
            key={`${log.time}-${log.message}`}
            className="flex items-center gap-3 border-l-2 border-border-subtle pl-3 py-1"
          >
            {/* Time */}
            <span className="font-mono text-xs text-text-secondary min-w-[50px]">{log.time}</span>

            {/* Tag */}
            <span className="font-mono text-xs text-accent-500 min-w-[50px]">{log.tag}</span>

            {/* Message */}
            <span className="text-xs text-text-primary flex-1">{log.message}</span>

            {/* Level Indicator */}
            <span className="flex-shrink-0">{levelIndicator[log.level]}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
