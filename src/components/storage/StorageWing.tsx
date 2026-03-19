import type React from 'react';
import { useState } from 'react';
import { useInitialData } from '../../hooks/useInitialData';
import { formatBytes, getUsagePercentage, useStorage } from '../../stores/useStorageStore';
import { Button, ErrorBanner } from '../ui';

export default function StorageWing(): React.ReactElement {
  const {
    storageInfo,
    cleanupResult,
    analysisResults,
    isLoading,
    error,
    fetchStorageInfo,
    cleanupTempFiles,
    cleanupRecycleBin,
    cleanupSystemCache,
    runFullCleanup,
    analyzeDiskUsage,
    clearError,
  } = useStorage();

  // Local states
  const [selectedDrive, setSelectedDrive] = useState<string>('');

  // 初回データフェッチ
  useInitialData(() => fetchStorageInfo(), [fetchStorageInfo]);

  const handleRefresh = async (): Promise<void> => {
    clearError();
    await fetchStorageInfo();
  };

  const handleAnalyzeDrive = async (driveName: string): Promise<void> => {
    setSelectedDrive(driveName);
    await analyzeDiskUsage(driveName);
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isLoading}>
          ↻ REFRESH
        </Button>
      </div>

      {/* Error Banner */}
      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {/* Storage Overview */}
      {storageInfo && (
        <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
          <div className="font-mono text-[10px] text-text-muted mb-2">OVERVIEW</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-text-secondary">Total Size</span>
              <span className="font-mono text-[11px] text-text-primary">
                {formatBytes(storageInfo.totalSizeBytes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-text-secondary">Used</span>
              <span className="font-mono text-[11px] text-text-primary">
                {formatBytes(storageInfo.totalUsedBytes)} (
                {getUsagePercentage(storageInfo.totalUsedBytes, storageInfo.totalSizeBytes).toFixed(
                  1,
                )}
                %)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-text-secondary">Available</span>
              <span className="font-mono text-[11px] text-text-primary">
                {formatBytes(storageInfo.totalAvailableBytes)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drives List */}
      {storageInfo && (
        <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
          <div className="font-mono text-[10px] text-text-muted mb-2">DRIVES</div>
          <div className="space-y-2">
            {storageInfo.drives.map((drive) => (
              <div key={drive.name} className="border-b border-border-subtle pb-2 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-text-primary font-bold">
                      {drive.name}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        drive.healthStatus === 'Critical'
                          ? 'bg-danger-500'
                          : drive.healthStatus === 'Warning'
                            ? 'bg-accent-500'
                            : 'bg-success-500'
                      }`}
                    />
                    <span
                      className={`font-mono text-[9px] ${
                        drive.healthStatus === 'Critical'
                          ? 'text-danger-500'
                          : drive.healthStatus === 'Warning'
                            ? 'text-accent-500'
                            : 'text-success-500'
                      }`}
                    >
                      {drive.healthStatus}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAnalyzeDrive(drive.name)}
                    disabled={isLoading}
                  >
                    ANALYZE
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-text-secondary">Model</span>
                    <span className="font-mono text-[10px] text-text-primary">{drive.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-text-secondary">File System</span>
                    <span className="font-mono text-[10px] text-text-primary">
                      {drive.fileSystem}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-[10px] text-text-secondary">Usage</span>
                    <span className="font-mono text-[10px] text-text-primary">
                      {formatBytes(drive.usedBytes)} / {formatBytes(drive.sizeBytes)}
                    </span>
                  </div>
                  {/* Usage Bar */}
                  <div className="w-full bg-base-800 rounded h-2 mt-1 overflow-hidden">
                    <div
                      className="bg-accent-500 h-2 transition-all duration-300"
                      style={{ width: `${getUsagePercentage(drive.usedBytes, drive.sizeBytes)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cleanup Section */}
      <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
        <div className="font-mono text-[10px] text-text-muted mb-2">CLEANUP</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={cleanupTempFiles} disabled={isLoading}>
              TEMP FILES
            </Button>
            <Button variant="secondary" size="sm" onClick={cleanupRecycleBin} disabled={isLoading}>
              RECYCLE BIN
            </Button>
            <Button variant="secondary" size="sm" onClick={cleanupSystemCache} disabled={isLoading}>
              SYSTEM CACHE
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={runFullCleanup} disabled={isLoading}>
              FULL CLEANUP
            </Button>
          </div>
        </div>
      </div>

      {/* Cleanup Results */}
      {cleanupResult && (
        <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
          <div className="font-mono text-[10px] text-text-muted mb-2">SCAN RESULTS</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-text-secondary">Temp Files</span>
              <span className="font-mono text-[10px] text-success-500">
                {formatBytes(cleanupResult.tempFilesCleaned)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-text-secondary">Recycle Bin</span>
              <span className="font-mono text-[10px] text-success-500">
                {formatBytes(cleanupResult.recycleBinCleaned)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-text-secondary">System Cache</span>
              <span className="font-mono text-[10px] text-success-500">
                {formatBytes(cleanupResult.systemCacheCleaned)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border-subtle pt-1">
              <span className="font-mono text-[10px] text-text-secondary">Total Reclaimable</span>
              <span className="font-mono text-[10px] text-accent-500 font-bold">
                {formatBytes(cleanupResult.totalFreedBytes)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {selectedDrive && analysisResults.length > 0 && (
        <div className="bg-base-800 border border-border-subtle rounded p-3">
          <div className="font-mono text-[10px] text-text-muted mb-2">
            ANALYSIS: {selectedDrive}
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {analysisResults.map((file) => (
              <div key={file} className="font-mono text-[9px] text-text-primary truncate">
                {file}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="font-mono text-[10px] text-text-muted">LOADING...</div>
        </div>
      )}
    </div>
  );
}
