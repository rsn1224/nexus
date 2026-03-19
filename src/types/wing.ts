export type WingId =
  | 'home'
  | 'performance' // 旧 'boost'
  | 'games' // 旧 'launcher'
  | 'settings'
  | 'hardware'
  | 'log'
  | 'network' // 旧 'netopt'
  | 'storage';

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
