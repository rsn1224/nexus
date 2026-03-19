import type React from 'react';
import { useNavStore } from '../../stores/useNavStore';
import { ErrorBoundary, TabBar } from '../ui';
import GeneralTab from './GeneralTab';
import MaintenanceTab from './MaintenanceTab';
import WindowsSettingsTab from './WindowsSettingsTab';

const settingsTabs = [
  { id: 'app', label: 'アプリ設定' },
  { id: 'windows', label: 'Windows 設定' },
];

export default function SettingsWing(): React.ReactElement {
  const activeTab = useNavStore(
    (s) => (s.wingStates.settings.activeTab ?? 'app') as 'app' | 'windows',
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
        <ErrorBoundary name="アプリ設定">
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
            <GeneralTab />
            <MaintenanceTab />
          </div>
        </ErrorBoundary>
      )}

      {activeTab === 'windows' && (
        <ErrorBoundary name="Windows 設定">
          <div className="flex-1 overflow-hidden -m-4">
            <WindowsSettingsTab />
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
}
