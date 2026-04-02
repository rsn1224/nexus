import type React from 'react';
import { cn } from '../../lib/cn';

export type StatCardStatus = 'normal' | 'warning' | 'critical';

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  status: StatCardStatus;
}

const STATUS_BORDER_TOP: Record<StatCardStatus, string> = {
  normal: 'border-t-accent-500',
  warning: 'border-t-warning-500',
  critical: 'border-t-danger-500',
};

const STATUS_VALUE_COLOR: Record<StatCardStatus, string> = {
  normal: 'text-accent-500',
  warning: 'text-warning-500',
  critical: 'text-danger-500',
};

export function StatCard({ label, value, unit, status }: StatCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        'bg-base-900 border border-accent-500/25 border-t-2 rounded px-4 py-4 flex flex-col gap-2',
        STATUS_BORDER_TOP[status],
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary leading-none">
        {label}
      </p>

      <div className="flex items-baseline">
        <span
          className={cn(
            'text-[24px] font-bold font-mono leading-none tracking-tight',
            STATUS_VALUE_COLOR[status],
          )}
        >
          {value}
        </span>
        <span className={cn('text-[12px] font-mono ml-1 leading-none', STATUS_VALUE_COLOR[status])}>
          {unit}
        </span>
      </div>
    </div>
  );
}

export default StatCard;
