export interface MemoryCleanerConfig {
  enabled: boolean;
  intervalSeconds: number;
  thresholdMb: number;
}

export interface MemoryCleanupResult {
  success: boolean;
  freedMb: number | null;
  error: string | null;
  timestamp: number;
}
