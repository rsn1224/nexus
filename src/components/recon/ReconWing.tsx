import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useReconStore } from '../../stores/useReconStore';
import type { NetworkDevice, TrafficSnapshot } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TRAFFIC_INTERVAL_MS = 3_000;

type IpFilterMode = 'all' | 'unicast';

function isMulticast(ip: string): boolean {
  const firstOctet = Number.parseInt(ip.split('.')[0], 10);
  return firstOctet >= 224 && firstOctet <= 239;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}

// ─── StatusDot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: NetworkDevice['status'] }): React.ReactElement {
  const color =
    status === 'known'
      ? 'var(--color-cyan-500)'
      : status === 'suspicious'
        ? 'var(--color-danger-500)'
        : 'var(--color-text-muted)';
  return (
    <span
      style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color,
        marginRight: '6px',
        flexShrink: 0,
      }}
    />
  );
}

// ─── DeviceRow ────────────────────────────────────────────────────────────────

function DeviceRow({
  device,
  index,
}: {
  device: NetworkDevice;
  index: number;
}): React.ReactElement {
  return (
    <tr
      style={{
        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-text-primary)',
          width: '130px',
        }}
      >
        {device.ip}
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
          width: '160px',
        }}
      >
        {device.mac}
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-text-muted)',
        }}
      >
        {device.hostname || '—'}
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-cyan-500)',
        }}
      >
        {device.vendor || '—'}
      </td>
      <td style={{ padding: '5px 12px', width: '110px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color:
              device.status === 'known'
                ? 'var(--color-cyan-500)'
                : device.status === 'suspicious'
                  ? 'var(--color-danger-500)'
                  : 'var(--color-text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          <StatusDot status={device.status} />
          {device.status.toUpperCase()}
        </span>
      </td>
    </tr>
  );
}

// ─── TrafficPanel ─────────────────────────────────────────────────────────────

function TrafficPanel({ traffic }: { traffic: TrafficSnapshot | null }): React.ReactElement {
  const items: Array<{ label: string; value: string; color: string }> = [
    {
      label: '↑ SENT',
      value: traffic ? formatBytes(traffic.bytesSent) : '—',
      color: 'var(--color-accent-500)',
    },
    {
      label: '↓ RECV',
      value: traffic ? formatBytes(traffic.bytesRecv) : '—',
      color: 'var(--color-cyan-500)',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: '24px',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.2)',
        borderTop: '1px solid var(--color-border-subtle)',
        flexShrink: 0,
      }}
    >
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 600,
              color,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── ReconWing ────────────────────────────────────────────────────────────────

export default function ReconWing(): React.ReactElement {
  const { devices, traffic, isScanning, error, lastUpdated, scanNetwork, fetchTraffic } =
    useReconStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [filterMode, setFilterMode] = useState<IpFilterMode>('all');

  const filteredDevices =
    filterMode === 'unicast' ? devices.filter((d) => !isMulticast(d.ip)) : devices;

  useEffect(() => {
    void scanNetwork();
    void fetchTraffic();
    intervalRef.current = setInterval(() => void fetchTraffic(), TRAFFIC_INTERVAL_MS);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [scanNetwork, fetchTraffic]);

  const lastUpdatedStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-cyan-500)',
              letterSpacing: '0.15em',
            }}
          >
            ▶ RECON / LAN
          </span>
          {isScanning && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-accent-500)',
              }}
            >
              SCANNING...
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {(['all', 'unicast'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '2px 7px',
                  background: filterMode === mode ? 'var(--color-base-600)' : 'transparent',
                  border: `1px solid ${filterMode === mode ? 'var(--color-text-secondary)' : 'var(--color-border-subtle)'}`,
                  color:
                    filterMode === mode ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                }}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
            }}
          >
            {filteredDevices.length} HOSTS · SCANNED {lastUpdatedStr}
          </span>
          <button
            type="button"
            onClick={() => void scanNetwork()}
            disabled={isScanning}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '4px 14px',
              background: isScanning ? 'var(--color-base-700)' : 'var(--color-accent-500)',
              border: 'none',
              color: isScanning ? 'var(--color-text-muted)' : '#000',
              cursor: isScanning ? 'default' : 'pointer',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            {isScanning ? 'SCANNING...' : 'SCAN'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid var(--color-danger-600)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-danger-500)',
          }}
        >
          ERROR: {error}
        </div>
      )}

      {/* Device table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                position: 'sticky',
                top: 0,
                background: 'var(--color-base-800)',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              {(['IP', 'MAC', 'HOSTNAME', 'VENDOR', 'STATUS'] as const).map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '6px 12px',
                    textAlign: 'left',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.12em',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device, i) => (
              <DeviceRow key={device.ip} device={device} index={i} />
            ))}
          </tbody>
        </table>

        {!isScanning && filteredDevices.length === 0 && !error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '120px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            NO HOSTS IN ARP CACHE
          </div>
        )}
      </div>

      {/* Traffic footer */}
      <TrafficPanel traffic={traffic} />
    </div>
  );
}
