import type React from 'react';
import { progressWidth } from '../../lib/styles';
import { Card } from '../ui';

interface MemorySectionProps {
  memTotalGb: number;
  memUsedGb: number;
  memUsagePercent: number;
  createProgressBar: (used: number, total: number) => string;
}

function getUsageColor(pct: number): { text: string; bar: string } {
  if (pct >= 90) return { text: 'text-danger-500', bar: 'bg-danger-500' };
  if (pct >= 75) return { text: 'text-warm-500', bar: 'bg-warm-500' };
  return { text: 'text-accent-400', bar: 'bg-accent-500' };
}

export default function MemorySection({
  memTotalGb,
  memUsedGb,
  memUsagePercent,
}: MemorySectionProps): React.ReactElement {
  const { text, bar } = getUsageColor(memUsagePercent);

  return (
    <Card title="MEMORY" accentColor="accent" className="mb-4">
      <div className="text-xs text-text-secondary space-y-2">
        <div className="flex justify-between">
          <span className="text-text-muted">TOTAL</span>
          <span className="text-text-primary font-mono">{memTotalGb.toFixed(1)} GB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">USED</span>
          <span className={`font-mono font-bold ${text}`}>{memUsedGb.toFixed(1)} GB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">FREE</span>
          <span className="text-text-primary font-mono">
            {(memTotalGb - memUsedGb).toFixed(1)} GB
          </span>
        </div>
        <div className="space-y-1.5 pt-1 border-t border-white/[0.04]">
          <div className="flex justify-between">
            <span className="text-text-muted">USAGE</span>
            <span className={`font-mono font-bold ${text}`}>{memUsagePercent.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-base-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${bar}`}
              style={progressWidth(memUsagePercent)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
