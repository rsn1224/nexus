import type React from 'react';

interface TabBarProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function TabBar({
  tabs,
  active,
  onChange,
  className = '',
}: TabBarProps): React.ReactElement {
  return (
    <div
      data-testid="ui-tab-bar"
      className={`flex gap-1 p-1 bg-base-800/60 border border-border-subtle rounded ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-testid={`ui-tab-${tab.id}`}
          type="button"
          className={`text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded transition-colors flex-1 ${
            active === tab.id
              ? 'bg-accent-500/10 text-accent-500'
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
