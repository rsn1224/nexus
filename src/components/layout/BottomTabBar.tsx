import type React from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { WingId } from '../../types';

interface BottomTabBarProps {
  activeWing: WingId;
  onWingChange: (wing: WingId) => void;
}

const TAB_CONFIG = [
  { id: 'core' as WingId, icon: 'grid_view', i18nKey: 'bottomTab.hud' },
  { id: 'arsenal' as WingId, icon: 'sports_esports', i18nKey: 'bottomTab.play' },
  { id: 'tactics' as WingId, icon: 'monitoring', i18nKey: 'bottomTab.monitor' },
  { id: 'settings' as WingId, icon: 'settings', i18nKey: 'bottomTab.gear' },
] as const;

const BottomTabBar = memo(function BottomTabBar({
  activeWing,
  onWingChange,
}: BottomTabBarProps): React.ReactElement {
  const { t } = useTranslation('layout');

  return (
    <nav className="fixed bottom-0 w-full z-50 h-16 md:hidden bg-base-900/90 backdrop-blur-2xl border-t-[0.5px] border-white/10">
      <div className="flex items-center justify-around h-full px-2">
        {TAB_CONFIG.map(({ id, icon, i18nKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => onWingChange(id)}
            aria-label={t(i18nKey)}
            className={`flex flex-col items-center justify-center space-y-1 py-2 px-3 rounded-sm transition-colors ${
              activeWing === id ? 'text-accent-500' : 'text-white/60'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                activeWing === id ? '[font-variation-settings:"FILL"_1]' : ''
              }`}
            >
              {icon}
            </span>
            <span className="text-[8px] font-black tracking-widest uppercase">{t(i18nKey)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
});

export default BottomTabBar;
