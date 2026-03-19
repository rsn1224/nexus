import { Activity, AlertTriangle, Clock, Gamepad2, Gauge, Settings, Zap } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { WingId } from '../../types';
import BottomStatusBar from './BottomStatusBar';
import TitleBar from './TitleBar';

// ─── Wing nav items ───────────────────────────────────────────────────────────

interface NavWing {
  id: WingId;
  label: string;
  sublabel: string;
  shortcut: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_WINGS: NavWing[] = [
  { id: 'core', label: 'CORE', sublabel: 'コア', shortcut: 'Ctrl+1', Icon: Gauge },
  { id: 'arsenal', label: 'ARSENAL', sublabel: '兵装', shortcut: 'Ctrl+2', Icon: Gamepad2 },
  { id: 'tactics', label: 'TACTICS', sublabel: '戦術', shortcut: 'Ctrl+3', Icon: Activity },
  { id: 'logs', label: 'LOGS', sublabel: '履歴', shortcut: 'Ctrl+4', Icon: Clock },
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
    <div className="flex flex-col h-screen bg-base-800 overflow-hidden">
      {/* Scanline overlay */}
      <div className="scanline-overlay" aria-hidden="true" />
      <div className="scanning-bar" aria-hidden="true" />

      {/* Title bar */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (264px) */}
        <nav
          className="w-64 shrink-0 bg-base-950/98 backdrop-blur-3xl border-r border-white/3 flex flex-col"
          data-testid="sidebar"
        >
          {/* SYSTEM STATUS panel */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-500 pulse-node" />
              <span className="text-[9px] font-black tracking-[0.3em] uppercase text-accent-500">
                SYSTEM STATUS
              </span>
            </div>
            <span className="text-[8px] text-white/20 tracking-[0.2em] uppercase">
              稼働状況: OPTIMAL
            </span>
          </div>

          {/* Nav wings */}
          <div className="flex flex-col gap-0.5 px-2 pt-3 flex-1">
            {NAV_WINGS.map(({ id, label, sublabel, shortcut, Icon }) => {
              const isActive = id === activeWing;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onWingChange(id)}
                  data-testid={`nav-${id}`}
                  aria-label={`${label} ${sublabel} (${shortcut})`}
                  className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded transition-all duration-200 text-left overflow-hidden ${
                    isActive
                      ? 'bg-accent-500/10 text-accent-500 border-r-2 border-accent-500'
                      : 'text-white/30 hover:text-accent-500 hover:bg-accent-500/5 border-r-2 border-transparent'
                  }`}
                >
                  {isActive && (
                    <div className="progress-flow absolute bottom-0 left-0 right-0 h-px" />
                  )}
                  <Icon size={14} className="shrink-0" />
                  <div className="flex flex-col gap-0">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase leading-none">
                      {label}
                    </span>
                    <span className="text-[8px] text-white/20 tracking-[0.15em] uppercase">
                      {sublabel}
                    </span>
                  </div>
                  <span className="ml-auto text-[8px] text-white/15 tracking-wider">
                    {shortcut}
                  </span>
                </button>
              );
            })}

            <div className="w-full h-px bg-white/5 my-2" />

            {/* Settings / DIAG */}
            <button
              type="button"
              onClick={() => onWingChange('settings')}
              data-testid="nav-settings"
              aria-label="DIAG 設定 (Ctrl+5)"
              className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded transition-all duration-200 text-left border-r-2 ${
                activeWing === 'settings'
                  ? 'bg-accent-500/10 text-accent-500 border-accent-500'
                  : 'text-white/30 hover:text-accent-500 hover:bg-accent-500/5 border-transparent'
              }`}
            >
              <Settings size={14} className="shrink-0" />
              <div className="flex flex-col gap-0">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase leading-none">
                  DIAG
                </span>
                <span className="text-[8px] text-white/20 tracking-[0.15em] uppercase">診断</span>
              </div>
              <span className="ml-auto text-[8px] text-white/15 tracking-wider">Ctrl+5</span>
            </button>
          </div>

          {/* Footer: NEURAL SYNC + EMER */}
          <div className="px-3 pb-3 pt-2 border-t border-white/5 flex flex-col gap-2">
            <button
              type="button"
              className="relative w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-500/5 border border-accent-500/30 text-accent-500 font-black text-[9px] tracking-[0.4em] uppercase rounded overflow-hidden hover:bg-accent-500/10 transition-colors"
              aria-label="NEURAL SYNC"
            >
              <div className="hud-btn-sweep" aria-hidden="true" />
              <Zap size={12} />
              NEURAL SYNC
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-3 py-1.5 text-danger-500 font-black text-[9px] tracking-[0.4em] uppercase rounded border border-danger-500/30 hover:bg-danger-500/10 transition-colors"
              aria-label="EMERGENCY STOP"
            >
              <AlertTriangle size={12} />
              EMER
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-hidden circuit-bg" data-testid={`wing-${activeWing}`}>
          {children}
        </main>
      </div>

      {/* Bottom status bar */}
      <BottomStatusBar />
    </div>
  );
});

export default Shell;
