import type React from 'react';
import { useState } from 'react';
import { useInitialData } from '../../hooks/useInitialData';
import { useNavStore } from '../../stores/useNavStore';
import { useNetopt } from '../../stores/useNetoptStore';
import { Button, TabBar } from '../ui';
import DnsTab from './DnsTab';
import TcpTuningTab from './TcpTuningTab';

const netTabs = [
  { id: 'dns', label: 'DNS & Ping' },
  { id: 'tcp', label: 'TCP チューニング' },
];

export default function NetoptWing(): React.ReactElement {
  const {
    adapters,
    currentDns,
    pingResult,
    isLoading,
    error,
    fetchAdapters,
    fetchCurrentDns,
    setDns,
    pingHost,
    clearError,
    dnsPresets,
  } = useNetopt();

  const activeTab = useNavStore((s) => (s.wingStates.network.activeTab ?? 'dns') as 'dns' | 'tcp');

  const [selectedPreset, setSelectedPreset] = useState<string>('Cloudflare');
  const [customPrimary, setCustomPrimary] = useState('');
  const [customSecondary, setCustomSecondary] = useState('');
  const [pingTarget, setPingTarget] = useState('8.8.8.8');

  useInitialData(async () => {
    await Promise.all([fetchAdapters(), fetchCurrentDns()]);
  }, [fetchAdapters, fetchCurrentDns]);

  const handleRefresh = async (): Promise<void> => {
    clearError();
    await Promise.all([fetchAdapters(), fetchCurrentDns()]);
  };

  const handleApplyPreset = async (): Promise<void> => {
    const preset = dnsPresets.find((p) => p.name === selectedPreset);
    if (!preset || adapters.length === 0) return;
    await setDns(adapters[0].name, preset.primary, preset.secondary);
  };

  const handleApplyCustom = async (): Promise<void> => {
    if (!customPrimary.trim() || adapters.length === 0) return;
    await setDns(adapters[0].name, customPrimary.trim(), customSecondary.trim());
  };

  const handlePing = async (): Promise<void> => {
    if (!pingTarget.trim()) return;
    await pingHost(pingTarget.trim());
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-2 mb-4">
        <TabBar
          tabs={netTabs}
          active={activeTab}
          onChange={(id) => useNavStore.getState().setTab('network', id)}
          className="flex-1"
        />
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isLoading}>
          ↻ REFRESH
        </Button>
      </div>

      {activeTab === 'tcp' && <TcpTuningTab className="flex-1 overflow-y-auto" />}

      {activeTab === 'dns' && (
        <DnsTab
          adapters={adapters}
          currentDns={currentDns}
          pingResult={pingResult}
          isLoading={isLoading}
          error={error}
          dnsPresets={dnsPresets}
          selectedPreset={selectedPreset}
          customPrimary={customPrimary}
          customSecondary={customSecondary}
          pingTarget={pingTarget}
          onSelectedPresetChange={setSelectedPreset}
          onCustomPrimaryChange={setCustomPrimary}
          onCustomSecondaryChange={setCustomSecondary}
          onPingTargetChange={setPingTarget}
          onApplyPreset={handleApplyPreset}
          onApplyCustom={handleApplyCustom}
          onPing={handlePing}
        />
      )}
    </div>
  );
}
