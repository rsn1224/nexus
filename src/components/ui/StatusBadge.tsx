import type React from 'react';

interface StatusBadgeProps {
  value: number | null;
  unit: string;
  thresholds?: { warn: number; danger: number };
  className?: string;
}

export default function StatusBadge({
  value,
  unit,
  thresholds = { warn: 50, danger: 80 },
  className = '',
}: StatusBadgeProps): React.ReactElement {
  if (value === null) {
    return (
      <span
        data-testid="ui-status-badge"
        className={`text-text-muted font-(--font-mono) ${className}`}
      >
        --{unit}
      </span>
    );
  }

  let colorClass = 'text-success-500';
  if (value >= thresholds.danger) {
    colorClass = 'text-danger-500';
  } else if (value >= thresholds.warn) {
    colorClass = 'text-accent-500';
  }

  return (
    <span data-testid="ui-status-badge" className={`${colorClass} font-(--font-mono) ${className}`}>
      {value.toFixed(1)}
      {unit}
    </span>
  );
}
