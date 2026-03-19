import type React from 'react';

type AccentColor = 'accent' | 'warm' | 'purple' | 'info';

interface TabBarProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  accentColor?: AccentColor;
}

export default function TabBar({
  tabs,
  active,
  onChange,
  className = '',
  accentColor = 'accent',
}: TabBarProps): React.ReactElement {
  const activePillClasses: Record<AccentColor, string> = {
    accent: 'bg-accent-500/15 text-accent-400 shadow-sm shadow-accent-500/20',
    warm: 'bg-warm-500/15 text-warm-400 shadow-sm shadow-warm-500/20',
    purple: 'bg-purple-500/15 text-purple-400 shadow-sm shadow-purple-500/20',
    info: 'bg-info-500/15 text-info-400 shadow-sm shadow-info-500/20',
  };

  return (
    <div
      data-testid="ui-tab-bar"
      className={`flex gap-1 p-1 bg-base-800/60 border border-white/[0.06] rounded-xl ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-testid={`ui-tab-${tab.id}`}
          type="button"
          className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-[0.97] flex-1 ${
            active === tab.id
              ? activePillClasses[accentColor]
              : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
