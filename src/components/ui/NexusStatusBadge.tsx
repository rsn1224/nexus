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
    online: 'bg-nexus-green/15 text-nexus-green border border-nexus-green/40',
    throttle: 'bg-nexus-yellow/15 text-nexus-yellow border border-nexus-yellow/40',
    critical: 'bg-nexus-red/15 text-nexus-red border border-nexus-red/40',
    active: 'bg-nexus-green text-black font-bold',
    security: 'bg-nexus-red/8 border border-nexus-red/40 text-nexus-red',
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
    <div className={`border border-nexus-red/40 bg-nexus-red/8 p-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-nexus-red font-mono text-xs font-bold">▲ SECURITY ALERT</span>
      </div>
      <div className="text-xs text-nexus-text">{message}</div>
    </div>
  );
});
