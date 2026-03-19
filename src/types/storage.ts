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
