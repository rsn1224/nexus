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
  // ── GPU データ追加 ──
  gpuUsagePercent: number | null;
  gpuTempC: number | null;
  gpuVramUsedMb: number | null;
}
