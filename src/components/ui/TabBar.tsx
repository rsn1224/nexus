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
    <div data-testid="ui-tab-bar" className={`flex border-b border-border-subtle ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-testid={`ui-tab-${tab.id}`}
          type="button"
          className={`text-[13px] font-medium px-4 py-2.5 transition-all duration-200 ${
            active === tab.id
              ? 'border-b-2 border-accent-500 text-accent-500 -mb-px'
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
