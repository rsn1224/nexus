import type React from 'react';
import type { DnsPreset, NetworkAdapter, PingResult } from '../../types';
import Button from '../ui/Button';
import ErrorBanner from '../ui/ErrorBanner';

interface DnsTabProps {
  adapters: NetworkAdapter[];
  currentDns: string[];
  pingResult: PingResult | null;
  isLoading: boolean;
  error: string | null;
  dnsPresets: DnsPreset[];
  selectedPreset: string;
  customPrimary: string;
  customSecondary: string;
  pingTarget: string;
  onSelectedPresetChange: (preset: string) => void;
  onCustomPrimaryChange: (value: string) => void;
  onCustomSecondaryChange: (value: string) => void;
  onPingTargetChange: (value: string) => void;
  onApplyPreset: () => void;
  onApplyCustom: () => void;
  onPing: () => void;
}

export default function DnsTab({
  adapters,
  currentDns,
  pingResult,
  isLoading,
  error,
  dnsPresets,
  selectedPreset,
  customPrimary,
  customSecondary,
  pingTarget,
  onSelectedPresetChange,
  onCustomPrimaryChange,
  onCustomSecondaryChange,
  onPingTargetChange,
  onApplyPreset,
  onApplyCustom,
  onPing,
}: DnsTabProps): React.ReactElement {
  const primaryAdapter = adapters[0];

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
      {error && <ErrorBanner message={`ERROR: ${error}`} />}

      {/* ADAPTER Section */}
      <div className="bg-base-800 border border-border-subtle rounded-lg p-3 mb-4">
        <div className="text-xs text-text-muted mb-2">ADAPTER</div>
        {primaryAdapter ? (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Name</span>
              <span className="text-xs text-text-primary">{primaryAdapter.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">IP</span>
              <span className="font-mono text-xs text-text-primary">{primaryAdapter.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">MAC</span>
              <span className="font-mono text-xs text-text-primary">{primaryAdapter.mac}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-text-secondary">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success-500" />
                <span className="text-xs text-text-primary">CONNECTED</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-text-muted">No connected adapters found</div>
        )}
      </div>

      {/* DNS Section */}
      <div className="bg-base-800 border border-border-subtle rounded-lg p-3 mb-4">
        <div className="text-xs text-text-muted mb-2">DNS</div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-text-secondary">Current</span>
            <span className="font-mono text-xs text-text-primary">
              {currentDns.length > 0 ? currentDns.join(', ') : 'Not configured'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Preset</span>
            <select
              value={selectedPreset}
              onChange={(e) => onSelectedPresetChange(e.target.value)}
              aria-label="DNS プリセット"
              className="bg-base-700 border border-border-subtle text-text-primary font-mono text-xs px-2 py-1 rounded-lg"
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
              onClick={onApplyPreset}
              disabled={isLoading || !primaryAdapter}
            >
              APPLY
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Custom</span>
            <input
              type="text"
              value={customPrimary}
              onChange={(e) => onCustomPrimaryChange(e.target.value)}
              placeholder="Primary DNS"
              className="bg-base-700 border border-border-subtle text-text-primary font-mono text-xs px-2 py-1 rounded-lg w-32"
            />
            <input
              type="text"
              value={customSecondary}
              onChange={(e) => onCustomSecondaryChange(e.target.value)}
              placeholder="Secondary DNS"
              className="bg-base-700 border border-border-subtle text-text-primary font-mono text-xs px-2 py-1 rounded-lg w-32"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={onApplyCustom}
              disabled={isLoading || !primaryAdapter}
            >
              APPLY
            </Button>
          </div>
        </div>
      </div>

      {/* PING Section */}
      <div className="bg-base-800 border border-border-subtle rounded-lg p-3">
        <div className="text-xs text-text-muted mb-2">PING</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Target</span>
            <input
              type="text"
              value={pingTarget}
              onChange={(e) => onPingTargetChange(e.target.value)}
              placeholder="8.8.8.8"
              className="bg-base-700 border border-border-subtle text-text-primary font-mono text-xs px-2 py-1 rounded-lg flex-1"
            />
            <Button variant="primary" size="sm" onClick={onPing} disabled={isLoading}>
              ▶ PING
            </Button>
          </div>

          {pingResult && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Result</span>
              {pingResult.success ? (
                <>
                  <span className="font-mono text-xs text-success-500">
                    {pingResult.latencyMs}ms
                  </span>
                  <div className="w-2 h-2 rounded-full bg-success-500" />
                  <span className="text-xs text-success-500">OK</span>
                </>
              ) : (
                <span className="text-xs text-danger-500">TIMEOUT</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
