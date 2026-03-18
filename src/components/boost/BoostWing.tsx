import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { boostPageSuggestions } from '../../lib/localAi';
import { usePulseStore } from '../../stores/usePulseStore';
import { useWinoptStore } from '../../stores/useWinoptStore';
import AiPanel from '../shared/AiPanel';
import { ErrorBanner, TabBar } from '../ui';
import NetworkTab from './NetworkTab';
import ProcessTab from './ProcessTab';
import ProfileTab from './ProfileTab';
import WatchdogTab from './WatchdogTab';
import WinoptTab from './WinoptTab';

export default function BoostWing(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<
    'process' | 'windows' | 'network' | 'profiles' | 'watchdog'
  >('process');

  // Winopt store for error handling
  const { error: winoptError } = useWinoptStore();

  // Fetch settings when switching tabs
  const { fetchWinSettings, fetchNetSettings } = useWinoptStore();
  useEffect(() => {
    if (activeTab === 'windows') {
      void fetchWinSettings();
    } else if (activeTab === 'network') {
      void fetchNetSettings();
    }
  }, [activeTab, fetchWinSettings, fetchNetSettings]);

  const cpuPercent = usePulseStore((s) =>
    s.snapshots.length > 0 ? (s.snapshots[s.snapshots.length - 1]?.cpuPercent ?? null) : null,
  );

  // For AI suggestions - simplified since we don't have access to settings here
  const boostSuggestions = useMemo(() => boostPageSuggestions([], [], cpuPercent), [cpuPercent]);

  const tabs = [
    { id: 'process', label: 'プロセス最適化' },
    { id: 'windows', label: 'Windows設定' },
    { id: 'network', label: 'ネット最適化' },
    { id: 'profiles', label: 'プロファイル' },
    { id: 'watchdog', label: 'WATCHDOG' },
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Error Banner */}
      {winoptError && <ErrorBanner message={winoptError} />}

      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div className="font-mono text-xs font-bold text-cyan-500 tracking-[0.15em] shrink-0 pb-2 border-b border-border-subtle">
          ▶ 最適化
        </div>
      </div>

      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        className="mb-4"
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'process' && <ProcessTab />}
        {activeTab === 'windows' && <WinoptTab />}
        {activeTab === 'network' && <NetworkTab />}
        {activeTab === 'profiles' && <ProfileTab />}
        {activeTab === 'watchdog' && <WatchdogTab />}
      </div>

      <AiPanel suggestions={boostSuggestions} />
    </div>
  );
}
