import type React from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { WingId } from '../../types';

interface SidebarProps {
  activeWing: WingId;
  onWingChange: (wing: WingId) => void;
}

const WING_CONFIG = [
  { id: 'core' as WingId, i18nKey: 'nav.dashboard', icon: 'grid_view' },
  { id: 'arsenal' as WingId, i18nKey: 'nav.arsenal', icon: 'sports_esports' },
  { id: 'tactics' as WingId, i18nKey: 'nav.tactics', icon: 'monitoring' },
  { id: 'logs' as WingId, i18nKey: 'nav.logs', icon: 'terminal' },
  { id: 'settings' as WingId, i18nKey: 'nav.settings', icon: 'settings' },
] as const;

const Sidebar = memo(function Sidebar({
  activeWing,
  onWingChange,
}: SidebarProps): React.ReactElement {
  const { t } = useTranslation('layout');

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 z-40 hidden md:flex flex-col bg-base-900 border-r-[0.5px] border-white/5 shadow-[20px_0_40px_rgba(0,0,0,0.8)]">
      {/* System Status Panel */}
      <div className="p-6 space-y-3">
        <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase">
          {t('sidebar.systemStatus')}
        </div>
        <div className="flex items-center justify-between">
          <h2 className="font-black text-xl text-warning-500 tracking-tighter">
            {t('sidebar.system')}
          </h2>
          <span className="text-[10px] bg-accent-500/20 text-accent-500 px-1.5 py-0.5 rounded-sm font-bold">
            ONLINE
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1" data-testid="sidebar">
        {WING_CONFIG.map(({ id, i18nKey, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onWingChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm transition-all ${
              activeWing === id
                ? 'bg-accent-500/10 text-accent-500 border-r-2 border-accent-500 shadow-[inset_0_0_15px_rgba(68,214,44,0.1)]'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
            data-testid={`nav-${id}`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {icon}
            </span>
            <span className="text-xs uppercase tracking-wide font-bold">{t(i18nKey)}</span>
          </button>
        ))}
      </nav>

      {/* Optimize Button */}
      <div className="p-4">
        <button
          type="button"
          className="w-full py-3 bg-linear-to-r from-accent-300 to-accent-500 text-base-900 font-black text-xs tracking-widest uppercase rounded-sm hover:brightness-110 transition-all"
        >
          {t('sidebar.optimizeNow')}
        </button>
      </div>

      {/* Footer Links */}
      <div className="p-4 space-y-2 border-t border-white/5">
        <button
          type="button"
          className="w-full text-[10px] text-white/40 uppercase tracking-widest hover:text-white/60 transition-colors"
        >
          Support
        </button>
        <button
          type="button"
          className="w-full text-[10px] text-white/40 uppercase tracking-widest hover:text-white/60 transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
