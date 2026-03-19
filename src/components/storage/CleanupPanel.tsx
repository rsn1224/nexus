import type React from 'react';
import { formatBytes } from '../../stores/useStorageStore';
import type { CleanupResult } from '../../types';
import { Button } from '../ui';

interface CleanupPanelProps {
  cleanupResult: CleanupResult | null;
  analysisResults: string[];
  selectedDrive: string;
  isLoading: boolean;
  onCleanupTempFiles: () => void;
  onCleanupRecycleBin: () => void;
  onCleanupSystemCache: () => void;
  onRunFullCleanup: () => void;
}

export default function CleanupPanel({
  cleanupResult,
  analysisResults,
  selectedDrive,
  isLoading,
  onCleanupTempFiles,
  onCleanupRecycleBin,
  onCleanupSystemCache,
  onRunFullCleanup,
}: CleanupPanelProps): React.ReactElement {
  return (
    <>
      <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
        <div className="font-mono text-[10px] text-text-muted mb-2">CLEANUP</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onCleanupTempFiles} disabled={isLoading}>
              TEMP FILES
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCleanupRecycleBin}
              disabled={isLoading}
            >
              RECYCLE BIN
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCleanupSystemCache}
              disabled={isLoading}
            >
              SYSTEM CACHE
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={onRunFullCleanup} disabled={isLoading}>
              FULL CLEANUP
            </Button>
          </div>
        </div>
      </div>

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
    </>
  );
}
