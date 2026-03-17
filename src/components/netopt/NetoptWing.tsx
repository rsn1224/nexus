import type React from 'react';
import { useEffect, useState } from 'react';
import { useNetopt } from '../../stores/useNetoptStore';
import { Button } from '../ui';

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

  // Local states
  const [selectedPreset, setSelectedPreset] = useState<string>('Cloudflare');
  const [customPrimary, setCustomPrimary] = useState('');
  const [customSecondary, setCustomSecondary] = useState('');
  const [pingTarget, setPingTarget] = useState('8.8.8.8');

  // Initialize data on mount
  useEffect(() => {
    void fetchAdapters();
    void fetchCurrentDns();
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
  const errorBanner = error ? (
    <div className="px-4 py-2 mb-4 bg-red-500/10 border-b border-red-600 text-red-500 font-[var(--font-mono)] text-[10px] rounded">
      ERROR: {error}
    </div>
  ) : null;

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-cyan-500)] font-bold tracking-widest">
          ▶ NETOPT / NETWORK
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isLoading}>
          ↻ REFRESH
        </Button>
      </div>

      {/* Error Banner */}
      {errorBanner}

      {/* ADAPTER Section */}
      <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
          ADAPTER
        </div>
        {primaryAdapter ? (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                Name
              </span>
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
                {primaryAdapter.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                IP
              </span>
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
                {primaryAdapter.ip}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                MAC
              </span>
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
                {primaryAdapter.mac}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                Status
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success-500)]" />
                <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
                  CONNECTED
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">
            No connected adapters found
          </div>
        )}
      </div>

      {/* DNS Section */}
      <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
          DNS
        </div>
        <div className="space-y-2">
          {/* Current DNS */}
          <div className="flex justify-between">
            <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Current
            </span>
            <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
              {currentDns.length > 0 ? currentDns.join(', ') : 'Not configured'}
            </span>
          </div>

          {/* Preset DNS */}
          <div className="flex items-center gap-2">
            <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Preset
            </span>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-[var(--font-mono)] text-[11px] px-2 py-1 rounded"
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
            <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Custom
            </span>
            <input
              type="text"
              value={customPrimary}
              onChange={(e) => setCustomPrimary(e.target.value)}
              placeholder="Primary DNS"
              className="bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-[var(--font-mono)] text-[11px] px-2 py-1 rounded w-32"
            />
            <input
              type="text"
              value={customSecondary}
              onChange={(e) => setCustomSecondary(e.target.value)}
              placeholder="Secondary DNS"
              className="bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-[var(--font-mono)] text-[11px] px-2 py-1 rounded w-32"
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
      <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
          PING
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Target
            </span>
            <input
              type="text"
              value={pingTarget}
              onChange={(e) => setPingTarget(e.target.value)}
              placeholder="8.8.8.8"
              className="bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-[var(--font-mono)] text-[11px] px-2 py-1 rounded flex-1"
            />
            <Button variant="primary" size="sm" onClick={handlePing} disabled={isLoading}>
              ▶ PING
            </Button>
          </div>

          {/* Ping Result */}
          {pingResult && (
            <div className="flex items-center gap-2">
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
                Result
              </span>
              {pingResult.success ? (
                <>
                  <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-success-500)]">
                    {pingResult.latencyMs}ms
                  </span>
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success-500)]" />
                  <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-success-500)]">
                    OK
                  </span>
                </>
              ) : (
                <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-danger-500)]">
                  TIMEOUT
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
