import { Cpu, FileText, Gamepad2, Gauge, Globe, HardDrive, Settings, Zap } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { WingId } from '../../types';
import TitleBar from './TitleBar';

// ─── Sidebar items ────────────────────────────────────────────────────────────

type SidebarItem =
  | { id: string; label: string; icon: React.ComponentType<{ size?: number }> }
  | { id: string };

const WING_ACTIVE_CLASSES: Partial<
  Record<string, { text: string; bg: string; shadow: string; bar: string }>
> = {
  home: {
    text: 'text-accent-500',
    bg: 'bg-accent-500/15',
    shadow: 'shadow-accent-500/20',
    bar: 'bg-accent-500',
  },
  performance: {
    text: 'text-warm-500',
    bg: 'bg-warm-500/15',
    shadow: 'shadow-warm-500/20',
    bar: 'bg-warm-500',
  },
  games: {
    text: 'text-warm-500',
    bg: 'bg-warm-500/15',
    shadow: 'shadow-warm-500/20',
    bar: 'bg-warm-500',
  },
  hardware: {
    text: 'text-purple-500',
    bg: 'bg-purple-500/15',
    shadow: 'shadow-purple-500/20',
    bar: 'bg-purple-500',
  },
  network: {
    text: 'text-info-500',
    bg: 'bg-info-500/15',
    shadow: 'shadow-info-500/20',
    bar: 'bg-info-500',
  },
  storage: {
    text: 'text-purple-500',
    bg: 'bg-purple-500/15',
    shadow: 'shadow-purple-500/20',
    bar: 'bg-purple-500',
  },
  log: {
    text: 'text-info-500',
    bg: 'bg-info-500/15',
    shadow: 'shadow-info-500/20',
    bar: 'bg-info-500',
  },
  settings: {
    text: 'text-accent-500',
    bg: 'bg-accent-500/15',
    shadow: 'shadow-accent-500/20',
    bar: 'bg-accent-500',
  },
};

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
          className="w-12 shrink-0 bg-base-950/90 backdrop-blur-md border-r border-white/[0.05] flex flex-col items-center py-2 gap-1"
          data-testid="sidebar"
        >
          {SIDEBAR_ITEMS.map((item) => {
            if (!('label' in item)) {
              return <div key={item.id} className="w-6 h-px bg-white/5 my-1" />;
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
                  className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
                    isActive
                      ? `${WING_ACTIVE_CLASSES[item.id]?.text ?? 'text-accent-500'} ${WING_ACTIVE_CLASSES[item.id]?.bg ?? 'bg-accent-500/15'} shadow-lg ${WING_ACTIVE_CLASSES[item.id]?.shadow ?? 'shadow-accent-500/20'}`
                      : 'text-text-secondary hover:text-text-primary hover:bg-base-800/80'
                  }`}
                >
                  {isActive && (
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 ${WING_ACTIVE_CLASSES[item.id]?.bar ?? 'bg-accent-500'} rounded-r`}
                    />
                  )}
                  <Icon size={20} />
                </button>
                {/* Tooltip */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 card-glass-elevated rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-[200] border border-white/10 shadow-xl shadow-black/60">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-text-primary">{item.label}</span>
                    {WING_SHORTCUT[item.id] && (
                      <span className="text-[10px] font-mono text-text-muted">
                        {WING_SHORTCUT[item.id]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-dot-grid" data-testid={`wing-${activeWing}`}>
          {children}
        </main>
      </div>
    </div>
  );
});

export default Shell;
