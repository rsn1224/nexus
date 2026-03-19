import type React from 'react';
import { useNavStore } from '../../stores/useNavStore';
import { ErrorBoundary } from '../ui';
import GeneralTab from './GeneralTab';
import MaintenanceTab from './MaintenanceTab';
import WindowsSettingsTab from './WindowsSettingsTab';

const settingsTabs = [
  { id: 'app', label: 'APP CONFIG', jpLabel: 'アプリ設定' },
  { id: 'windows', label: 'SYSTEM', jpLabel: 'Windows 設定' },
];

export default function SettingsWing(): React.ReactElement {
  const activeTab = useNavStore(
    (s) => (s.wingStates.settings.activeTab ?? 'app') as 'app' | 'windows',
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 border-b border-white/5">
        <div className="flex justify-between items-end">
          <div className="border-l-2 border-info-500 pl-4">
            <h1 className="text-4xl font-black tracking-tighter uppercase">SETTINGS_WING</h1>
            <p className="text-text-secondary text-[10px] tracking-[0.3em] uppercase opacity-60 mt-1">
              System Configuration &amp; HUD Optimization
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-info-500 text-xs font-bold tracking-widest uppercase">
              CONFIGURATION
            </p>
            <p className="text-[9px] text-text-muted tracking-widest">構成設定 / バージョン 2.0</p>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex gap-6 px-6 pt-4 border-b border-white/5">
        {settingsTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => useNavStore.getState().setTab('settings', t.id)}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-all ${
              activeTab === t.id
                ? 'border-info-500 text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-white/20'
            }`}
          >
            <span className="text-sm font-bold tracking-tight uppercase">{t.label}</span>
            <span className="text-[10px] text-text-muted font-light">{t.jpLabel}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'app' && (
        <ErrorBoundary name="アプリ設定">
          <div className="flex flex-col gap-6 flex-1 overflow-y-auto p-6">
            <GeneralTab />
            <MaintenanceTab />
          </div>
        </ErrorBoundary>
      )}

      {activeTab === 'windows' && (
        <ErrorBoundary name="Windows 設定">
          <div className="flex-1 overflow-hidden">
            <WindowsSettingsTab />
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
}
