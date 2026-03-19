import type React from 'react';
import { useState } from 'react';
import { useInitialData } from '../../hooks/useInitialData';
import { useNetopt } from '../../stores/useNetoptStore';
import { Button, ErrorBanner, TabBar } from '../ui';
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

  const [activeTab, setActiveTab] = useState<'dns' | 'tcp'>('dns');

  // Local states
  const [selectedPreset, setSelectedPreset] = useState<string>('Cloudflare');
  const [customPrimary, setCustomPrimary] = useState('');
  const [customSecondary, setCustomSecondary] = useState('');
  const [pingTarget, setPingTarget] = useState('8.8.8.8');

  // 初回データフェッチ
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

    const adapter = adapters[0]; // Use first connected adapter
    await setDns(adapter.name, preset.primary, preset.secondary);
  };

  const handleApplyCustom = async (): Promise<void> => {
    if (!customPrimary.trim() || adapters.length === 0) return;

    const adapter = adapters[0]; // Use first connected adapter
    await setDns(adapter.name, customPrimary.trim(), customSecondary.trim());
  };

  const handlePing = async (): Promise<void> => {
    if (!pingTarget.trim()) return;
    await pingHost(pingTarget.trim());
  };

  // Get primary adapter info
  const primaryAdapter = adapters[0];

  // Error banner (inline)
  const errorBanner = error ? <ErrorBanner message={`ERROR: ${error}`} /> : null;

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-[11px] text-accent-500 font-bold tracking-widest">
          ▶ NETWORK
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isLoading}>
          ↻ REFRESH
        </Button>
      </div>

      {/* Tab Bar */}
      <TabBar
        tabs={netTabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        className="mb-4"
      />

      {activeTab === 'tcp' && <TcpTuningTab className="flex-1 overflow-y-auto" />}

      {activeTab === 'dns' && (
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
          {/* Error Banner */}
          {errorBanner}

          {/* ADAPTER Section */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
            <div className="font-mono text-[10px] text-text-muted mb-2">ADAPTER</div>
            {primaryAdapter ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-mono text-[11px] text-text-secondary">Name</span>
                  <span className="font-mono text-[11px] text-text-primary">
                    {primaryAdapter.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[11px] text-text-secondary">IP</span>
                  <span className="font-mono text-[11px] text-text-primary">
                    {primaryAdapter.ip}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[11px] text-text-secondary">MAC</span>
                  <span className="font-mono text-[11px] text-text-primary">
                    {primaryAdapter.mac}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[11px] text-text-secondary">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success-500" />
                    <span className="font-mono text-[11px] text-text-primary">CONNECTED</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="font-mono text-[11px] text-text-muted">
                No connected adapters found
              </div>
            )}
          </div>

          {/* DNS Section */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
            <div className="font-mono text-[10px] text-text-muted mb-2">DNS</div>
            <div className="space-y-2">
              {/* Current DNS */}
              <div className="flex justify-between">
                <span className="font-mono text-[11px] text-text-secondary">Current</span>
                <span className="font-mono text-[11px] text-text-primary">
                  {currentDns.length > 0 ? currentDns.join(', ') : 'Not configured'}
                </span>
              </div>

              {/* Preset DNS */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-text-secondary">Preset</span>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="bg-base-700 border border-border-subtle text-text-primary font-mono text-[11px] px-2 py-1 rounded"
                >
                  {dnsPresets.map((preset) => (
                    <option key={preset.name} value={preset.name}>
                      {preset.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleApplyPreset}
                  disabled={isLoading || !primaryAdapter}
                >
                  APPLY
                </Button>
              </div>

              {/* Custom DNS */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-text-secondary">Custom</span>
                <input
                  type="text"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  placeholder="Primary DNS"
                  className="bg-base-700 border border-border-subtle text-text-primary font-mono text-[11px] px-2 py-1 rounded w-32"
                />
                <input
                  type="text"
                  value={customSecondary}
                  onChange={(e) => setCustomSecondary(e.target.value)}
                  placeholder="Secondary DNS"
                  className="bg-base-700 border border-border-subtle text-text-primary font-mono text-[11px] px-2 py-1 rounded w-32"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleApplyCustom}
                  disabled={isLoading || !primaryAdapter}
                >
                  APPLY
                </Button>
              </div>
            </div>
          </div>

          {/* PING Section */}
          <div className="bg-base-800 border border-border-subtle rounded p-3">
            <div className="font-mono text-[10px] text-text-muted mb-2">PING</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-text-secondary">Target</span>
                <input
                  type="text"
                  value={pingTarget}
                  onChange={(e) => setPingTarget(e.target.value)}
                  placeholder="8.8.8.8"
                  className="bg-base-700 border border-border-subtle text-text-primary font-mono text-[11px] px-2 py-1 rounded flex-1"
                />
                <Button variant="primary" size="sm" onClick={handlePing} disabled={isLoading}>
                  ▶ PING
                </Button>
              </div>

              {/* Ping Result */}
              {pingResult && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-text-secondary">Result</span>
                  {pingResult.success ? (
                    <>
                      <span className="font-mono text-[11px] text-success-500">
                        {pingResult.latencyMs}ms
                      </span>
                      <div className="w-2 h-2 rounded-full bg-success-500" />
                      <span className="font-mono text-[11px] text-success-500">OK</span>
                    </>
                  ) : (
                    <span className="font-mono text-[11px] text-danger-500">TIMEOUT</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
