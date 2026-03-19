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
    normal: 'text-nexus-cyan',
    warning: 'text-nexus-yellow',
    critical: 'text-nexus-red',
  };

  const progressColors = {
    normal: 'bg-nexus-cyan',
    warning: 'bg-nexus-yellow',
    critical: 'bg-nexus-red',
  };

  return (
    <div className="bg-nexus-surface rounded-sm border border-nexus-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs text-nexus-label font-mono uppercase tracking-widest">
            {label}
          </div>
          {code && <div className="text-[10px] text-nexus-muted font-mono opacity-70">{code}</div>}
        </div>
      </div>

      {/* Value display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className={`font-mono font-black text-4xl ${statusColors[status]}`}>{value}</span>
        {unit && <span className="text-sm text-nexus-text font-mono">{unit}</span>}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="w-full bg-nexus-surface2 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${progressColors[status]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
});
