export interface ResourceSnapshot {
  timestamp: number;
  cpuPercent: number;
  cpuTempC: number | null;
  memUsedMb: number;
  memTotalMb: number;
  diskReadKb: number;
  diskWriteKb: number;
  netRecvKb: number;
  netSentKb: number;
}
