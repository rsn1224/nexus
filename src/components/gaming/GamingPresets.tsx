import type React from 'react';
import { useTranslation } from 'react-i18next';

interface PresetCardProps {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  presetLabel: string;
  isActive?: boolean;
  onClick: () => void;
}

function PresetCard({
  id,
  name,
  description,
  color,
  icon,
  presetLabel,
  isActive,
  onClick,
}: PresetCardProps): React.ReactElement {
  return (
    <button
      type="button"
      key={id}
      className={`relative group cursor-pointer transition-all ${isActive ? 'scale-100' : 'scale-95 opacity-70 hover:scale-100 hover:opacity-100'}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div
        className={`glass-panel border ${color === 'green' ? 'border-accent-500/50' : color === 'amber' ? 'border-warning-500/50' : 'border-white/20'} p-6 h-full relative overflow-hidden`}
      >
        <div className="reflective-overlay absolute inset-0"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`material-symbols-outlined text-2xl ${color === 'green' ? 'text-accent-500' : color === 'amber' ? 'text-warning-500' : 'text-text-secondary'}`}
            >
              {icon}
            </span>
            <div
              className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest ${color === 'green' ? 'bg-accent-500/10 text-accent-500' : color === 'amber' ? 'bg-warning-500/10 text-warning-500' : 'bg-white/10 text-text-secondary'}`}
            >
              {presetLabel}
            </div>
          </div>
          <h3
            className={`font-black text-lg mb-2 ${color === 'green' ? 'text-accent-500' : color === 'amber' ? 'text-warning-500' : 'text-text-primary'}`}
          >
            {name}
          </h3>
          <p className="text-text-secondary/80 text-[11px] leading-relaxed">{description}</p>
        </div>
        {isActive && (
          <div className="absolute top-2 right-2">
            <div
              className={`w-2 h-2 rounded-full ${color === 'green' ? 'bg-accent-500' : color === 'amber' ? 'bg-warning-500' : 'bg-white'} animate-pulse`}
            ></div>
          </div>
        )}
      </div>
    </button>
  );
}

interface GamingPresetsProps {
  activePreset: string;
  setActivePreset: (preset: string) => void;
}

export default function GamingPresets({
  activePreset,
  setActivePreset,
}: GamingPresetsProps): React.ReactElement {
  const { t } = useTranslation('tactics');

  const presets = [
    {
      id: 'ultra',
      name: t('presets.ultra'),
      description: t('presets.ultraDesc'),
      color: 'green',
      icon: 'speed',
    },
    {
      id: 'balanced',
      name: t('presets.balanced'),
      description: t('presets.balancedDesc'),
      color: 'amber',
      icon: 'balance',
    },
    {
      id: 'streaming',
      name: t('presets.streaming'),
      description: t('presets.streamingDesc'),
      color: 'neutral',
      icon: 'live_tv',
    },
    {
      id: 'powersave',
      name: t('presets.powersave'),
      description: t('presets.powersaveDesc'),
      color: 'neutral',
      icon: 'eco',
    },
  ];

  return (
    <div className="glass-panel border border-white/10 relative overflow-hidden shadow-2xl">
      <div className="reflective-overlay absolute inset-0"></div>
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <span className="material-symbols-outlined text-accent-500 text-2xl">sports_esports</span>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            {t('gaming.gamingPresets')}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              id={preset.id}
              name={preset.name}
              description={preset.description}
              color={preset.color}
              icon={preset.icon}
              presetLabel={t('presets.preset')}
              isActive={activePreset === preset.id}
              onClick={() => setActivePreset(preset.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
