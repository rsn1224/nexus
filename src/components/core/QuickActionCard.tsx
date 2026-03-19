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
    emergency: 'border-l-2 border-l-nexus-red',
    power: 'border-l-2 border-l-nexus-cyan',
  };

  const iconColors = {
    emergency: 'text-nexus-red',
    power: 'text-nexus-cyan',
  };

  const icons = {
    emergency: Bolt,
    power: Power,
  };

  const Icon = icons[type];

  return (
    <div className={`bg-nexus-surface rounded-sm p-4 ${borderColors[type]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Icon size={20} className={iconColors[type]} />
        <div className="text-xs text-nexus-label font-mono uppercase tracking-widest">
          {actionCode}
        </div>
      </div>

      {/* Title */}
      <div className="font-bold text-lg uppercase text-nexus-text tracking-tight mb-1">{title}</div>

      {/* Subtitle */}
      <div className="font-mono text-xs text-nexus-label uppercase tracking-widest mb-2">
        {subtitle}
      </div>

      {/* Description */}
      <div className="text-xs text-nexus-muted mb-4">{description}</div>

      {/* Action button */}
      <button
        type="button"
        onClick={onActivate}
        className={`w-full py-2 font-mono text-xs uppercase tracking-widest transition-all rounded ${
          isActive
            ? 'bg-nexus-green text-black font-bold'
            : 'bg-nexus-surface2 text-nexus-green border border-nexus-green/40 hover:bg-nexus-green/10'
        }`}
      >
        {isActive ? 'ACTIVE' : 'ACTIVATE'}
      </button>
    </div>
  );
});
