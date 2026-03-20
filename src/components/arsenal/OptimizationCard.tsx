import type React from 'react';
import { memo } from 'react';

type OptimizationLevel = 'SAFE' | 'MEDIUM' | 'HIGH';

interface Props {
  code: string;
  level: OptimizationLevel;
  title: string;
  subtitle: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

const levelColors = {
  SAFE: {
    bg: 'bg-accent-500/20',
    text: 'text-accent-500',
    border: 'border-accent-500/40',
  },
  MEDIUM: {
    bg: 'bg-warning-500/20',
    text: 'text-warning-500',
    border: 'border-warning-500/40',
  },
  HIGH: {
    bg: 'bg-danger-500/20',
    text: 'text-danger-500',
    border: 'border-danger-500/40',
  },
};

export const OptimizationCard = memo(function OptimizationCard({
  code,
  level,
  title,
  subtitle,
  description,
  enabled,
  onToggle,
}: Props): React.ReactElement {
  const colors = levelColors[level];

  return (
    <div className="bg-base-700 rounded-sm border border-border-subtle p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-text-secondary font-mono uppercase tracking-widest">
            {code}
          </div>
          <div
            className={`px-2 py-1 rounded text-xs font-mono uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border`}
          >
            {level}
          </div>
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

      {/* Toggle */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full py-2 font-mono text-xs uppercase tracking-widest transition-all rounded ${
          enabled
            ? 'bg-accent-500 text-black font-bold'
            : 'bg-base-600 text-text-muted border border-border-subtle hover:text-text-primary'
        }`}
      >
        {enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
});
