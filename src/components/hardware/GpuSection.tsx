import type React from 'react';
import { progressWidth } from '../../lib/styles';
import { Card } from '../ui';

interface GpuSectionProps {
  gpuName: string | null;
  gpuVramTotalMb: number | null;
  gpuTempC: number | null;
  gpuUsagePercent: number | null;
}

function getTempColor(temp: number): { text: string; bar: string } {
  if (temp >= 85) return { text: 'text-danger-500', bar: 'bg-danger-500' };
  if (temp >= 70) return { text: 'text-warm-500', bar: 'bg-warm-500' };
  return { text: 'text-success-500', bar: 'bg-success-500' };
}

function getUsageColor(pct: number): { text: string; bar: string } {
  if (pct >= 90) return { text: 'text-danger-500', bar: 'bg-danger-500' };
  if (pct >= 70) return { text: 'text-warm-500', bar: 'bg-warm-500' };
  return { text: 'text-amber-400', bar: 'bg-amber-500' };
}

export default function GpuSection({
  gpuName,
  gpuVramTotalMb,
  gpuTempC,
  gpuUsagePercent,
}: GpuSectionProps): React.ReactElement {
  const tempStyle = gpuTempC !== null ? getTempColor(gpuTempC) : null;
  const usageStyle = gpuUsagePercent !== null ? getUsageColor(gpuUsagePercent) : null;

  return (
    <Card title="GPU" accentColor="amber" className="mb-4">
      <div className="text-xs text-text-secondary space-y-2">
        <div className="flex justify-between">
          <span className="text-text-muted">MODEL</span>
          <span className="text-text-primary font-mono text-right max-w-[160px] truncate">
            {gpuName ?? 'N/A'}
          </span>
        </div>
        {gpuVramTotalMb !== null && (
          <div className="flex justify-between">
            <span className="text-text-muted">VRAM</span>
            <span className="text-text-primary font-mono">
              {gpuVramTotalMb / 1024 >= 1
                ? `${(gpuVramTotalMb / 1024).toFixed(0)} GB`
                : `${gpuVramTotalMb} MB`}
            </span>
          </div>
        )}
        {gpuUsagePercent !== null && usageStyle !== null && (
          <div className="space-y-1.5 pt-1 border-t border-white/[0.04]">
            <div className="flex justify-between">
              <span className="text-text-muted">USAGE</span>
              <span className={`font-mono font-bold ${usageStyle.text}`}>
                {gpuUsagePercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-base-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${usageStyle.bar}`}
                style={progressWidth(gpuUsagePercent)}
              />
            </div>
          </div>
        )}
        {gpuTempC !== null && tempStyle !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-text-muted">TEMP</span>
              <span className={`font-mono font-bold ${tempStyle.text}`}>
                {gpuTempC.toFixed(0)}°C
              </span>
            </div>
            <div className="h-1.5 bg-base-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${tempStyle.bar}`}
                style={progressWidth(Math.min((gpuTempC / 100) * 100, 100))}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
