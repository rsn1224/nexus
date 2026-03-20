import type React from 'react';
import { memo } from 'react';

type BadgeVariant = 'online' | 'throttle' | 'critical' | 'active' | 'security';

interface NexusStatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

export const NexusStatusBadge = memo(function NexusStatusBadge({
  variant,
  label,
  className = '',
}: NexusStatusBadgeProps): React.ReactElement {
  const styles = {
    online: 'bg-accent-500/15 text-accent-500 border border-accent-500/40',
    throttle: 'bg-warning-500/15 text-warning-500 border border-warning-500/40',
    critical: 'bg-danger-500/15 text-danger-500 border border-danger-500/40',
    active: 'bg-accent-500 text-black font-bold',
    security: 'bg-danger-500/8 border border-danger-500/40 text-danger-500',
  };

  return (
    <span className={`font-mono text-xs uppercase px-2 py-0.5 ${styles[variant]} ${className}`}>
      {label}
    </span>
  );
});

// Security Alert Card component
interface SecurityAlertCardProps {
  message: string;
  className?: string;
}

export const SecurityAlertCard = memo(function SecurityAlertCard({
  message,
  className = '',
}: SecurityAlertCardProps): React.ReactElement {
  return (
    <div className={`border border-danger-500/40 bg-danger-500/8 p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-danger-500 font-mono text-xs font-bold">▲ SECURITY ALERT</span>
      </div>
      <div className="text-xs text-text-primary">{message}</div>
    </div>
  );
});
