export interface WatchdogRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: WatchdogCondition[];
  action: WatchdogAction;
  processFilter: ProcessFilter;
  profileId: string | null;
  cooldownSecs: number;
  lastTriggeredAt: number | null;
}

export interface WatchdogCondition {
  metric: WatchdogMetric;
  operator: WatchdogOperator;
  threshold: number;
}

export type WatchdogMetric = 'cpuPercent' | 'memoryMb' | 'diskReadKb' | 'diskWriteKb';
export type WatchdogOperator = 'greaterThan' | 'lessThan' | 'equals';

export type WatchdogAction =
  | { setPriority: { level: string } }
  | { setAffinity: { cores: number[] } }
  | 'suspend'
  | 'terminate';

export interface ProcessFilter {
  includeNames: string[];
  excludeNames: string[];
}

export interface WatchdogEvent {
  timestamp: number;
  ruleId: string;
  ruleName: string;
  processName: string;
  pid: number;
  actionTaken: string;
  metricValue: number;
  threshold: number;
  success: boolean;
  detail: string;
}
