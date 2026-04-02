export interface NetworkAdapter {
  name: string;
  ip: string;
  mac: string;
  isConnected: boolean;
}

export type TcpAutoTuningLevel =
  | 'Normal'
  | 'Disabled'
  | 'HighlyRestricted'
  | 'Restricted'
  | 'Experimental';

export interface TcpTuningState {
  nagleDisabled: boolean;
  delayedAckDisabled: boolean;
  networkThrottlingIndex: number;
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
