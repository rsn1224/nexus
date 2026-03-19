import type React from 'react';
import { formatBytes, getUsagePercentage } from '../../lib/storage';
import { progressWidth } from '../../lib/styles';
import type { DiskDrive } from '../../types';
import { Button } from '../ui';

interface DriveListProps {
  drives: DiskDrive[];
  isLoading: boolean;
  onAnalyze: (driveName: string) => void;
}

export default function DriveList({
  drives,
  isLoading,
  onAnalyze,
}: DriveListProps): React.ReactElement {
  return (
    <div className="bg-base-800 border border-border-subtle rounded-lg p-3 mb-4">
      <div className="text-xs text-text-muted mb-2">DRIVES</div>
      <div className="space-y-2">
        {drives.map((drive) => (
          <div key={drive.name} className="border-b border-border-subtle pb-2 last:border-b-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-primary font-bold">{drive.name}</span>
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
                  className={`text-xs ${
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
                onClick={() => onAnalyze(drive.name)}
                disabled={isLoading}
              >
                ANALYZE
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-text-secondary">Model</span>
                <span className="text-xs text-text-primary">{drive.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-secondary">File System</span>
                <span className="text-xs text-text-primary">{drive.fileSystem}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-secondary">Usage</span>
                <span className="font-mono text-xs text-text-primary">
                  {formatBytes(drive.usedBytes)} / {formatBytes(drive.sizeBytes)}
                </span>
              </div>
              <div className="w-full bg-base-800 rounded-lg h-2 mt-1 overflow-hidden">
                <div
                  className="bg-accent-500 h-2 transition-all duration-300"
                  style={progressWidth(getUsagePercentage(drive.usedBytes, drive.sizeBytes))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
