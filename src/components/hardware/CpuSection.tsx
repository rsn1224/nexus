import type React from 'react';
import { progressWidth } from '../../lib/styles';
import { Card } from '../ui';

interface CpuSectionProps {
  cpuName: string;
  cpuCores: number;
  cpuThreads: number;
  cpuBaseGhz: number;
  cpuTempC: number | null;
}

function getTempColor(temp: number): { text: string; bar: string } {
  if (temp >= 85) return { text: 'text-danger-500', bar: 'bg-danger-500' };
  if (temp >= 70) return { text: 'text-warm-500', bar: 'bg-warm-500' };
  return { text: 'text-success-500', bar: 'bg-success-500' };
}

export default function CpuSection({
  cpuName,
  cpuCores,
  cpuThreads,
  cpuBaseGhz,
  cpuTempC,
}: CpuSectionProps): React.ReactElement {
  const tempStyle = cpuTempC !== null ? getTempColor(cpuTempC) : null;

  return (
    <Card title="CPU" accentColor="warm" className="mb-4">
      <div className="text-xs text-text-secondary space-y-2">
        <div className="flex justify-between">
          <span className="text-text-muted">MODEL</span>
          <span className="text-text-primary font-mono text-right max-w-[160px] truncate">
            {cpuName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">CORES</span>
          <span className="text-text-primary font-mono">
            {cpuCores}C / {cpuThreads}T
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">BASE CLOCK</span>
          <span className="text-text-primary font-mono">{cpuBaseGhz.toFixed(1)} GHz</span>
        </div>
        {cpuTempC !== null && tempStyle !== null && (
          <div className="space-y-1.5 pt-1 border-t border-white/[0.04]">
            <div className="flex justify-between">
              <span className="text-text-muted">TEMP</span>
              <span className={`font-mono font-bold ${tempStyle.text}`}>
                {cpuTempC.toFixed(0)}°C
              </span>
            </div>
            <div className="h-1.5 bg-base-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${tempStyle.bar}`}
                style={progressWidth(Math.min((cpuTempC / 100) * 100, 100))}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
