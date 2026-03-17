import type React from 'react';
import { useEffect, useState } from 'react';
import { formatBytes, getUsagePercentage, useStorage } from '../../stores/useStorageStore';
import { Button } from '../ui';

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

  // Initialize data on mount
  useEffect(() => {
    void fetchStorageInfo();
  }, [fetchStorageInfo]);

  const handleRefresh = async (): Promise<void> => {
    clearError();
    await fetchStorageInfo();
  };

  const handleAnalyzeDrive = async (driveName: string): Promise<void> => {
    setSelectedDrive(driveName);
    await analyzeDiskUsage(driveName);
  };

  // Error banner (inline)
  const errorBanner = error ? (
    <div className="px-4 py-2 mb-4 bg-red-500/10 border-b border-red-600 text-red-500 font-[var(--font-mono)] text-[10px] rounded">
      ERROR: {error}
    </div>
  ) : null;

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-cyan-500)] font-bold tracking-widest">
          ▶ STORAGE / DISK
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isLoading}>
          ↻ REFRESH
        </Button>
      </div>

      {/* Error Banner */}
      {errorBanner}

      {/* Storage Overview */}
      {storageInfo && (
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            OVERVIEW
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                Total Size
              </span>
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
                {formatBytes(storageInfo.totalSizeBytes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                Used
              </span>
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
                {formatBytes(storageInfo.totalUsedBytes)} (
                {getUsagePercentage(storageInfo.totalUsedBytes, storageInfo.totalSizeBytes).toFixed(
                  1,
                )}
                %)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                Available
              </span>
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
                {formatBytes(storageInfo.totalAvailableBytes)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drives List */}
      {storageInfo && (
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            DRIVES
          </div>
          <div className="space-y-2">
            {storageInfo.drives.map((drive) => (
              <div
                key={drive.name}
                className="border-b border-[var(--color-border-subtle)] pb-2 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)] font-bold">
                      {drive.name}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        drive.healthStatus === 'Critical'
                          ? 'bg-[var(--color-danger-500)]'
                          : drive.healthStatus === 'Warning'
                            ? 'bg-[var(--color-accent-500)]'
                            : 'bg-[var(--color-success-500)]'
                      }`}
                    />
                    <span
                      className={`font-[var(--font-mono)] text-[9px] ${
                        drive.healthStatus === 'Critical'
                          ? 'text-[var(--color-danger-500)]'
                          : drive.healthStatus === 'Warning'
                            ? 'text-[var(--color-accent-500)]'
                            : 'text-[var(--color-success-500)]'
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
                    <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
                      Model
                    </span>
                    <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)]">
                      {drive.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
                      File System
                    </span>
                    <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)]">
                      {drive.fileSystem}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
                      Usage
                    </span>
                    <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)]">
                      {formatBytes(drive.usedBytes)} / {formatBytes(drive.sizeBytes)}
                    </span>
                  </div>
                  {/* Usage Bar */}
                  <div className="w-full bg-[var(--color-base-700)] rounded-full h-2 mt-1">
                    <div
                      className="bg-[var(--color-accent-500)] h-2 rounded-full transition-all duration-300"
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
      <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
          CLEANUP
        </div>
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
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            SCAN RESULTS
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
                Temp Files
              </span>
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-success-500)]">
                {formatBytes(cleanupResult.tempFilesCleaned)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
                Recycle Bin
              </span>
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-success-500)]">
                {formatBytes(cleanupResult.recycleBinCleaned)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
                System Cache
              </span>
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-success-500)]">
                {formatBytes(cleanupResult.systemCacheCleaned)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border-subtle)] pt-1">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
                Total Reclaimable
              </span>
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-accent-500)] font-bold">
                {formatBytes(cleanupResult.totalFreedBytes)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {selectedDrive && analysisResults.length > 0 && (
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            ANALYSIS: {selectedDrive}
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {analysisResults.map((file) => (
              <div
                key={file}
                className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-primary)] truncate"
              >
                {file}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
            LOADING...
          </div>
        </div>
      )}
    </div>
  );
}
