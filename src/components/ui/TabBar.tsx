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
      className={`flex border-b border-[var(--color-border-subtle)] ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-testid={`ui-tab-${tab.id}`}
          type="button"
          className={`font-[var(--font-mono)] text-[10px] font-semibold px-4 py-2 transition-all duration-150 ${
            active === tab.id
              ? 'border-b-2 border-[var(--color-cyan-500)] text-[var(--color-cyan-500)] -mb-px'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
