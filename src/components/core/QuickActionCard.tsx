import { Bolt, Power } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';

interface Props {
  type: 'emergency' | 'power';
  title: string;
  subtitle: string;
  description: string;
  actionCode: string;
  isActive?: boolean;
  onActivate?: () => void;
}

export const QuickActionCard = memo(function QuickActionCard({
  type,
  title,
  subtitle,
  description,
  actionCode,
  isActive = false,
  onActivate,
}: Props): React.ReactElement {
  const borderColors = {
    emergency: 'border-l-2 border-l-danger-500',
    power: 'border-l-2 border-l-info-500',
  };

  const iconColors = {
    emergency: 'text-danger-500',
    power: 'text-info-500',
  };

  const icons = {
    emergency: Bolt,
    power: Power,
  };

  const Icon = icons[type];

  return (
    <div className={`bg-base-700 rounded-sm p-4 ${borderColors[type]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Icon size={20} className={iconColors[type]} />
        <div className="text-xs text-text-secondary font-mono uppercase tracking-widest">
          {actionCode}
        </div>
      </div>

      {/* Title */}
      <div className="font-bold text-lg uppercase text-text-primary tracking-tight mb-1">
        {title}
      </div>

      {/* Subtitle */}
      <div className="font-mono text-xs text-text-secondary uppercase tracking-widest mb-2">
        {subtitle}
      </div>

      {/* Description */}
      <div className="text-xs text-text-muted mb-4">{description}</div>

      {/* Action button */}
      <button
        type="button"
        onClick={onActivate}
        className={`w-full py-2 font-mono text-xs uppercase tracking-widest transition-all rounded ${
          isActive
            ? 'bg-accent-500 text-black font-bold'
            : 'bg-base-600 text-accent-500 border border-accent-500/40 hover:bg-accent-500/10'
        }`}
      >
        {isActive ? 'ACTIVE' : 'ACTIVATE'}
      </button>
    </div>
  );
});
