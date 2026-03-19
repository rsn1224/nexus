export type LogLevel = 'Debug' | 'Info' | 'Warn' | 'Error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  processId?: number;
  threadId?: number;
}

export interface LogAnalysis {
  totalEntries: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
  timeRange: string;
  topSources: [string, number][];
}
