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
  const activeClasses: Record<AccentColor, string> = {
    accent: 'border-accent-500 text-accent-500',
    warm: 'border-warm-500   text-warm-500',
    purple: 'border-purple-500 text-purple-500',
    info: 'border-info-500   text-info-500',
  };
  return (
    <div data-testid="ui-tab-bar" className={`flex border-b border-border-subtle ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-testid={`ui-tab-${tab.id}`}
          type="button"
          className={`text-sm font-medium px-4 py-2.5 transition-all duration-200 ${
            active === tab.id
              ? `border-b-2 ${activeClasses[accentColor]} -mb-px`
              : 'text-text-muted hover:text-text-secondary'
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
