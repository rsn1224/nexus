import type React from 'react';
import { Card } from '../ui';

interface GpuSectionProps {
  gpuName: string | null;
  gpuVramTotalMb: number | null;
  gpuTempC: number | null;
  gpuUsagePercent: number | null;
}

export default function GpuSection({
  gpuName,
  gpuVramTotalMb,
  gpuTempC,
  gpuUsagePercent,
}: GpuSectionProps): React.ReactElement {
  return (
    <Card title="GPU" className="mb-4">
      <div className="text-xs text-text-secondary space-y-2">
        <div className="flex justify-between">
          <span>MODEL:</span>
          <span className="text-text-primary">{gpuName || 'N/A'}</span>
        </div>
        {gpuVramTotalMb !== null && (
          <div className="flex justify-between">
            <span>VRAM:</span>
            <span className="text-text-primary">
              {gpuVramTotalMb / 1024 >= 1
                ? `${(gpuVramTotalMb / 1024).toFixed(1)} GB`
                : `${gpuVramTotalMb} MB`}
            </span>
          </div>
        )}
        {gpuTempC !== null && (
          <div className="flex justify-between">
            <span>TEMP:</span>
            <span
              className={
                gpuTempC >= 80
                  ? 'text-danger-500'
                  : gpuTempC >= 70
                    ? 'text-accent-500'
                    : 'text-success-500'
              }
            >
              {gpuTempC.toFixed(1)}°C
            </span>
          </div>
        )}
        {gpuUsagePercent !== null && (
          <div className="flex justify-between">
            <span>USAGE:</span>
            <span className="text-text-primary">{gpuUsagePercent.toFixed(1)}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}
