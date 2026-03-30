import type React from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleV2 } from '../ui/ToggleV2';

interface OptimizationToggle {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
  onToggle: () => void;
  color: 'green' | 'amber' | 'neutral';
}

function OptimizationToggleItem({
  label,
  description,
  icon,
  enabled,
  onToggle,
  color,
}: OptimizationToggle): React.ReactElement {
  return (
    <div
      className={`glass-panel border ${color === 'green' ? 'border-accent-500/30' : color === 'amber' ? 'border-warning-500/30' : 'border-white/10'} p-6 relative overflow-hidden group`}
    >
      <div className="reflective-overlay absolute inset-0"></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <span
              className={`material-symbols-outlined text-xl ${color === 'green' ? 'text-accent-500' : color === 'amber' ? 'text-warning-500' : 'text-text-secondary'}`}
            >
              {icon}
            </span>
            <div>
              <h3
                className={`font-bold text-sm mb-1 ${color === 'green' ? 'text-accent-500' : color === 'amber' ? 'text-warning-500' : 'text-text-primary'}`}
              >
                {label}
              </h3>
              <p className="text-text-secondary/60 text-[10px] leading-relaxed">{description}</p>
            </div>
          </div>
          <ToggleV2 enabled={enabled} onToggle={onToggle} />
        </div>
      </div>
    </div>
  );
}

interface GamingOptimizationsProps {
  optimizations: {
    id: string;
    label: string;
    description: string;
    icon: string;
    enabled: boolean;
  }[];
  onToggleOptimization: (id: string) => void;
}

export default function GamingOptimizations({
  optimizations,
  onToggleOptimization,
}: GamingOptimizationsProps): React.ReactElement {
  const { t } = useTranslation('tactics');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <span className="material-symbols-outlined text-accent-500 text-2xl">tune</span>
        <h2 className="text-xl font-bold text-text-primary tracking-tight">
          {t('gaming.optimizationOptions')}
        </h2>
      </div>
      {optimizations.map((opt) => (
        <OptimizationToggleItem
          key={opt.id}
          id={opt.id}
          label={opt.label}
          description={opt.description}
          icon={opt.icon}
          enabled={opt.enabled}
          onToggle={() => onToggleOptimization(opt.id)}
          color={opt.id === 'gpu' ? 'green' : opt.id === 'network' ? 'amber' : 'neutral'}
        />
      ))}
    </div>
  );
}
