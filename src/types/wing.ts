export type WingId = 'dashboard' | 'gaming' | 'monitor' | 'history' | 'settings';

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
