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
      <span className={`text-[var(--color-text-muted)] font-[var(--font-mono)] ${className}`}>
        --{unit}
      </span>
    );
  }

  let colorClass = 'text-[var(--color-success-500)]';
  if (value >= thresholds.danger) {
    colorClass = 'text-[var(--color-danger-500)]';
  } else if (value >= thresholds.warn) {
    colorClass = 'text-[var(--color-accent-500)]';
  }

  return (
    <span className={`${colorClass} font-[var(--font-mono)] ${className}`}>
      {value.toFixed(1)}
      {unit}
    </span>
  );
}
