import { Clock, Cpu, Layers, LayoutDashboard, Monitor, Network, Settings, Zap } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { NavView } from '../../stores/useNavStore';
import { useNavStore } from '../../stores/useNavStore';

interface NavItem {
  id: NavView;
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
}

const NAV_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'hardware', label: 'Hardware', Icon: Cpu },
  { id: 'optimize', label: 'Optimize', Icon: Zap },
  { id: 'network', label: 'Network', Icon: Network },
  { id: 'windows', label: 'Windows', Icon: Monitor },
  { id: 'memory', label: 'Memory', Icon: Layers },
  { id: 'timer', label: 'Timer', Icon: Clock },
] as const;

const Sidebar = memo(function Sidebar(): React.ReactElement {
  const activeView = useNavStore((s) => s.activeView);
  const setView = useNavStore((s) => s.setView);

  return (
    <aside className="w-12 shrink-0 bg-base-950 border-r border-border-subtle flex flex-col overflow-hidden">
      <nav className="flex-1 py-3 flex flex-col gap-0.5 items-center">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setView(id)}
            className={[
              'w-9 h-9 flex items-center justify-center rounded transition-colors border-l-2',
              activeView === id
                ? 'border-l-accent-500 bg-accent-500/10 text-accent-500'
                : 'border-l-transparent text-text-muted hover:text-text-primary hover:bg-white/5',
            ].join(' ')}
          >
            <Icon size={16} />
          </button>
        ))}
      </nav>

      <div className="border-t border-border-subtle py-2 flex flex-col items-center">
        <button
          type="button"
          title="Settings"
          onClick={() => setView('settings')}
          className={[
            'w-9 h-9 flex items-center justify-center rounded transition-colors border-l-2',
            activeView === 'settings'
              ? 'border-l-accent-500 bg-accent-500/10 text-accent-500'
              : 'border-l-transparent text-text-muted hover:text-text-primary hover:bg-white/5',
          ].join(' ')}
        >
          <Settings size={16} />
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
