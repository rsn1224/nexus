import type React from 'react';
import { useMemo, useState } from 'react';
import { boostPageSuggestions } from '../../lib/localAi';
import { usePulseStore } from '../../stores/usePulseStore';
import AiPanel from '../shared/AiPanel';
import { TabBar } from '../ui';
import ProcessTab from './ProcessTab';
import ProfileTab from './ProfileTab';
import SessionTab from './SessionTab';
import WatchdogTab from './WatchdogTab';

export default function BoostWing(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'process' | 'profiles' | 'watchdog' | 'session'>(
    'process',
  );

  const cpuPercent = usePulseStore((s) =>
    s.snapshots.length > 0 ? (s.snapshots[s.snapshots.length - 1]?.cpuPercent ?? null) : null,
  );

  // For AI suggestions - simplified since we don't have access to settings here
  const boostSuggestions = useMemo(() => boostPageSuggestions([], [], cpuPercent), [cpuPercent]);

  const tabs = [
    { id: 'process', label: 'プロセス最適化' },
    { id: 'profiles', label: 'プロファイル' },
    { id: 'watchdog', label: 'WATCHDOG' },
    { id: 'session', label: 'セッション' },
  ];

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div className="font-mono text-xs font-bold text-accent-500 tracking-[0.15em] shrink-0 pb-2 border-b border-border-subtle">
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
        {activeTab === 'profiles' && <ProfileTab />}
        {activeTab === 'watchdog' && <WatchdogTab />}
        {activeTab === 'session' && <SessionTab />}
      </div>

      <AiPanel suggestions={boostSuggestions} />
    </div>
  );
}
