import type React from 'react';
import { memo } from 'react';

type TabId = 'windows' | 'process' | 'network' | 'memory';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const ArsenalTabBar = memo(function ArsenalTabBar({
  activeTab,
  onTabChange,
}: Props): React.ReactElement {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'windows', label: 'WINDOWS' },
    { id: 'process', label: 'PROCESS' },
    { id: 'network', label: 'NETWORK' },
    { id: 'memory', label: 'MEMORY' },
  ];

  return (
    <div className="px-6 pb-4">
      <div className="flex gap-6 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`pb-3 px-1 border-b-2 transition-all font-mono text-xs uppercase tracking-widest ${
              activeTab === tab.id
                ? 'border-info-500 text-info-500'
                : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-subtle'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
});
