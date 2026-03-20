export type WingId = 'core' | 'arsenal' | 'tactics' | 'logs' | 'settings';

export interface WingStatus {
  id: WingId;
  label: string;
  online: boolean;
}

export type FeedLevel = 'info' | 'warn' | 'critical' | 'ok';

export interface FeedEntry {
  id: string;
  level: FeedLevel;
  wing: WingId;
  message: string;
  timestamp: number;
}
