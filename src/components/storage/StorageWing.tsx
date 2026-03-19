import type React from 'react';
import { useState } from 'react';
import { useInitialData } from '../../hooks/useInitialData';
import { formatBytes, getUsagePercentage, useStorage } from '../../stores/useStorageStore';
import { Button, ErrorBanner } from '../ui';
import CleanupPanel from './CleanupPanel';
import DriveList from './DriveList';

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

  const [selectedDrive, setSelectedDrive] = useState<string>('');

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
      <div className="flex justify-end mb-4">
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isLoading}>
          ↻ REFRESH
        </Button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {storageInfo && (
        <div className="bg-base-800 border border-border-subtle rounded-lg p-3 mb-4">
          <div className="text-xs text-text-muted mb-2">OVERVIEW</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Total Size</span>
              <span className="font-mono text-xs text-text-primary">
                {formatBytes(storageInfo.totalSizeBytes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Used</span>
              <span className="font-mono text-xs text-text-primary">
                {formatBytes(storageInfo.totalUsedBytes)} (
                {getUsagePercentage(storageInfo.totalUsedBytes, storageInfo.totalSizeBytes).toFixed(
                  1,
                )}
                %)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Available</span>
              <span className="font-mono text-xs text-text-primary">
                {formatBytes(storageInfo.totalAvailableBytes)}
              </span>
            </div>
          </div>
        </div>
      )}

      {storageInfo && (
        <DriveList
          drives={storageInfo.drives}
          isLoading={isLoading}
          onAnalyze={handleAnalyzeDrive}
        />
      )}

      <CleanupPanel
        cleanupResult={cleanupResult}
        analysisResults={analysisResults}
        selectedDrive={selectedDrive}
        isLoading={isLoading}
        onCleanupTempFiles={cleanupTempFiles}
        onCleanupRecycleBin={cleanupRecycleBin}
        onCleanupSystemCache={cleanupSystemCache}
        onRunFullCleanup={runFullCleanup}
      />

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="text-xs text-text-muted">LOADING...</div>
        </div>
      )}
    </div>
  );
}
