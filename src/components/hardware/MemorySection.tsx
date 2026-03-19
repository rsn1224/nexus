import type React from 'react';
import { Card } from '../ui';

interface MemorySectionProps {
  memTotalGb: number;
  memUsedGb: number;
  memUsagePercent: number;
  createProgressBar: (used: number, total: number) => string;
}

export default function MemorySection({
  memTotalGb,
  memUsedGb,
  memUsagePercent,
  createProgressBar,
}: MemorySectionProps): React.ReactElement {
  return (
    <Card title="MEMORY" className="mb-4">
      <div className="text-xs text-text-secondary space-y-2">
        <div className="flex justify-between">
          <span>TOTAL:</span>
          <span className="text-text-primary">{memTotalGb.toFixed(1)} GB</span>
        </div>
        <div className="flex justify-between">
          <span>USED:</span>
          <span className="text-text-primary">
            {memUsedGb.toFixed(1)} GB ({memUsagePercent.toFixed(1)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span>FREE:</span>
          <span className="text-text-primary">{(memTotalGb - memUsedGb).toFixed(1)} GB</span>
        </div>
        <div className="mt-2">
          <div className="text-text-muted text-xs mb-1">USAGE BAR:</div>
          <div className="font-mono text-xs">{createProgressBar(memUsedGb, memTotalGb)}</div>
        </div>
      </div>
    </Card>
  );
}
