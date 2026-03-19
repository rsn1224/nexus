import type React from 'react';
import { useNavStore } from '../../stores/useNavStore';
import WinoptTab from '../performance/WinoptTab';
import { TabBar } from '../ui';
import GeneralTab from './GeneralTab';
import MaintenanceTab from './MaintenanceTab';
import WindowsSettingsTab from './WindowsSettingsTab';

const settingsTabs = [
  { id: 'app', label: 'アプリ設定' },
  { id: 'windows', label: 'Windows 設定' },
  { id: 'winopt', label: 'Windows 最適化' },
];

export default function SettingsWing(): React.ReactElement {
  const activeTab = useNavStore(
    (s) => (s.wingStates.settings.activeTab ?? 'app') as 'app' | 'windows' | 'winopt',
  );

  return (
    <div className="flex flex-col h-full p-4">
      <TabBar
        tabs={settingsTabs}
        active={activeTab}
        onChange={(id) => useNavStore.getState().setTab('settings', id)}
        className="mb-4"
      />

      {activeTab === 'app' && (
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
          <GeneralTab />
          <MaintenanceTab />
        </div>
      )}

      {activeTab === 'windows' && (
        <div className="flex-1 overflow-hidden -m-4">
          <WindowsSettingsTab />
        </div>
      )}

      {activeTab === 'winopt' && (
        <div className="flex-1 overflow-y-auto">
          <WinoptTab />
        </div>
      )}
    </div>
  );
}
