import { AlertTriangle } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';

interface Props {
  temperature: number;
  threshold?: number;
}

export const GpuThermalCard = memo(function GpuThermalCard({
  temperature,
  threshold = 85,
}: Props): React.ReactElement {
  const isWarning = temperature >= threshold;
  const percentage = (temperature / 100) * 100;

  return (
    <div
      className={`bg-base-700 rounded-sm border p-4 ${
        isWarning ? 'border-warning-500/60 bg-yellow-500/5' : 'border-border-subtle'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className={isWarning ? 'text-warning-500' : 'text-text-muted'} />
          <div>
            <div className="text-xs text-text-secondary font-mono uppercase tracking-widest">
              GPU_THERMAL_LIMIT
            </div>
            <div
              className={`font-mono text-2xl ${isWarning ? 'text-warning-500' : 'text-text-primary'}`}
            >
              {temperature}℃
            </div>
          </div>
        </div>

        {isWarning && (
          <div className="text-xs text-warning-500 font-mono uppercase tracking-widest">警告</div>
        )}
      </div>

      {/* Warning message */}
      {isWarning && (
        <div className="text-xs text-warning-500/70 mb-3">警告：温度が上限に近づいています</div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-base-600 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-500 ${
            isWarning ? 'bg-warning-500' : 'bg-info-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
});
