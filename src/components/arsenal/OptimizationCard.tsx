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
    bg: 'bg-nexus-green/20',
    text: 'text-nexus-green',
    border: 'border-nexus-green/40',
  },
  MEDIUM: {
    bg: 'bg-nexus-yellow/20',
    text: 'text-nexus-yellow',
    border: 'border-nexus-yellow/40',
  },
  HIGH: {
    bg: 'bg-nexus-red/20',
    text: 'text-nexus-red',
    border: 'border-nexus-red/40',
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
    <div className="bg-nexus-surface rounded-sm border border-nexus-border p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-nexus-label font-mono uppercase tracking-widest">{code}</div>
          <div
            className={`px-2 py-1 rounded text-xs font-mono uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border} border`}
          >
            {level}
          </div>
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

      {/* Toggle */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full py-2 font-mono text-xs uppercase tracking-widest transition-all rounded ${
          enabled
            ? 'bg-nexus-green text-black font-bold'
            : 'bg-nexus-surface2 text-nexus-muted border border-nexus-border hover:text-nexus-text'
        }`}
      >
        {enabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
});
