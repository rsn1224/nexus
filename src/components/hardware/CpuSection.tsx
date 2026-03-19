import type React from 'react';
import { Card } from '../ui';

interface CpuSectionProps {
  cpuName: string;
  cpuCores: number;
  cpuThreads: number;
  cpuBaseGhz: number;
  cpuTempC: number | null;
}

export default function CpuSection({
  cpuName,
  cpuCores,
  cpuThreads,
  cpuBaseGhz,
  cpuTempC,
}: CpuSectionProps): React.ReactElement {
  return (
    <Card title="CPU" className="mb-4">
      <div className="font-mono text-xs text-text-secondary space-y-2">
        <div className="flex justify-between">
          <span>MODEL:</span>
          <span className="text-text-primary">{cpuName}</span>
        </div>
        <div className="flex justify-between">
          <span>CORES:</span>
          <span className="text-text-primary">
            {cpuCores}C / {cpuThreads}T
          </span>
        </div>
        <div className="flex justify-between">
          <span>BASE:</span>
          <span className="text-text-primary">{cpuBaseGhz.toFixed(1)} GHz</span>
        </div>
        {cpuTempC !== null && (
          <div className="flex justify-between">
            <span>TEMP:</span>
            <span
              className={
                cpuTempC >= 80
                  ? 'text-danger-500'
                  : cpuTempC >= 70
                    ? 'text-accent-500'
                    : 'text-success-500'
              }
            >
              {cpuTempC.toFixed(1)}°C
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
