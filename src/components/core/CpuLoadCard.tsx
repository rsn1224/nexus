import type React from 'react';
import { memo } from 'react';

interface Props {
  label: string;
  value: string;
  unit?: string;
  code?: string;
  status?: 'normal' | 'warning' | 'critical';
  progress?: number; // 0-100
}

export const CpuLoadCard = memo(function CpuLoadCard({
  label,
  value,
  unit = '',
  code = '',
  status = 'normal',
  progress,
}: Props): React.ReactElement {
  const statusColors = {
    normal: 'text-info-500',
    warning: 'text-warning-500',
    critical: 'text-danger-500',
  };

  const progressColors = {
    normal: 'bg-info-500',
    warning: 'bg-warning-500',
    critical: 'bg-danger-500',
  };

  return (
    <div className="bg-base-700 rounded-sm border border-border-subtle p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs text-text-secondary font-mono uppercase tracking-widest">
            {label}
          </div>
          {code && <div className="text-[10px] text-text-muted font-mono opacity-70">{code}</div>}
        </div>
      </div>

      {/* Value display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`font-mono font-black text-4xl ${statusColors[status]}`}>{value}</span>
        {unit && <span className="text-sm text-text-primary font-mono">{unit}</span>}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-full bg-base-600 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${progressColors[status]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
});
