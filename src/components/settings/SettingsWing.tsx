import type React from 'react';
import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'app' | 'windows' | 'winopt'>('app');

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4">
        <div className="font-mono text-[11px] text-accent-500 font-bold tracking-widest">
          ▶ SETTINGS
        </div>
      </div>

      <TabBar
        tabs={settingsTabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
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
