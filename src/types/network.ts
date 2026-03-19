export interface NetworkAdapter {
  name: string;
  ip: string;
  mac: string;
  isConnected: boolean;
}

export interface DnsPreset {
  name: string;
  primary: string;
  secondary: string;
}

export interface PingResult {
  target: string;
  latencyMs: number | null;
  success: boolean;
}

export interface NetworkDevice {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  status: 'known' | 'unknown' | 'suspicious';
  lastSeen: number;
}

export interface TrafficSnapshot {
  bytesSent: number;
  bytesRecv: number;
  timestamp: number;
}

export type TcpAutoTuningLevel =
  | 'normal'
  | 'disabled'
  | 'highlyRestricted'
  | 'restricted'
  | 'experimental';

export interface TcpTuningState {
  nagleDisabled: boolean;
  delayedAckDisabled: boolean;
  /** -1 = 無制限, 10 = デフォルト */
  networkThrottlingIndex: number;
  /** 0–100% */
  qosReservedBandwidthPct: number;
  tcpAutoTuning: TcpAutoTuningLevel;
  ecnEnabled: boolean;
  rssEnabled: boolean;
}

export interface NetworkQualitySnapshot {
  target: string;
  avgLatencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  sampleCount: number;
  timestamp: number;
}
