import { Cpu, FileText, Gamepad2, Gauge, Globe, HardDrive, Settings, Zap } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { WingId } from '../../types';
import TitleBar from './TitleBar';

// ─── Sidebar items ────────────────────────────────────────────────────────────

type SidebarItem =
  | { id: string; label: string; icon: React.ComponentType<{ size?: number }> }
  | { id: string };

const WING_SHORTCUT: Partial<Record<string, string>> = {
  home: 'Ctrl+1',
  performance: 'Ctrl+2',
  games: 'Ctrl+3',
  hardware: 'Ctrl+4',
  network: 'Ctrl+5',
  storage: 'Ctrl+6',
  settings: 'Ctrl+7',
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'home', label: 'ダッシュボード', icon: Gauge },
  { id: 'sep-1' },
  { id: 'performance', label: 'パフォーマンス', icon: Zap },
  { id: 'games', label: 'ゲーム', icon: Gamepad2 },
  { id: 'sep-2' },
  { id: 'hardware', label: 'ハードウェア', icon: Cpu },
  { id: 'network', label: 'ネットワーク', icon: Globe },
  { id: 'storage', label: 'ストレージ', icon: HardDrive },
  { id: 'sep-3' },
  { id: 'log', label: 'ログ', icon: FileText },
  { id: 'settings', label: '設定', icon: Settings },
];

// ─── Shell ───────────────────────────────────────────────────────────────────

interface ShellProps {
  activeWing: WingId;
  onWingChange: (wing: WingId) => void;
  children: React.ReactNode;
}

const Shell = memo(function Shell({
  activeWing,
  onWingChange,
  children,
}: ShellProps): React.ReactElement {
  return (
    <div className="flex flex-col h-screen bg-base-900 overflow-hidden">
      {/* Title bar */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (48px) */}
        <nav
          className="w-12 shrink-0 bg-base-950 border-r border-border-subtle flex flex-col items-center py-2 gap-1"
          data-testid="sidebar"
        >
          {SIDEBAR_ITEMS.map((item) => {
            if (!('label' in item)) {
              return <div key={item.id} className="w-6 h-px bg-border-subtle my-1" />;
            }
            const wingId = item.id as WingId;
            const isActive = wingId === activeWing;
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onWingChange(wingId)}
                  data-testid={`nav-${item.id}`}
                  aria-label={
                    WING_SHORTCUT[item.id]
                      ? `${item.label} (${WING_SHORTCUT[item.id]})`
                      : item.label
                  }
                  className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
                    isActive
                      ? 'text-accent-500 bg-base-700'
                      : 'text-text-secondary hover:text-text-primary hover:bg-base-800'
                  }`}
                >
                  <Icon size={20} />
                </button>
                {/* Tooltip */}
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-base-700 border border-border-subtle rounded text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-hidden" data-testid={`wing-${activeWing}`}>
          {children}
        </main>
      </div>
    </div>
  );
});

export default Shell;
