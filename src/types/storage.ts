export interface DriveInfo {
  name: string;
  totalGb: number;
  freeGb: number;
  usedPercent: number;
}

export interface DiskDrive {
  name: string;
  model: string;
  sizeBytes: number;
  usedBytes: number;
  availableBytes: number;
  fileSystem: string;
  mountPoint: string;
  isRemovable: boolean;
  healthStatus: 'Good' | 'Warning' | 'Critical';
}

export interface StorageInfo {
  drives: DiskDrive[];
  totalSizeBytes: number;
  totalUsedBytes: number;
  totalAvailableBytes: number;
}

export interface CleanupResult {
  tempFilesCleaned: number;
  recycleBinCleaned: number;
  systemCacheCleaned: number;
  totalFreedBytes: number;
}

export interface StorageStore {
  storageInfo: StorageInfo | null;
  cleanupResult: CleanupResult | null;
  analysisResults: string[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  fetchStorageInfo: () => Promise<void>;
  cleanupTempFiles: () => Promise<void>;
  cleanupRecycleBin: () => Promise<void>;
  cleanupSystemCache: () => Promise<void>;
  runFullCleanup: () => Promise<void>;
  analyzeDiskUsage: (driveName: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}
