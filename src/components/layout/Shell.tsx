import type React from 'react';
import { useEffect, useState } from 'react';
import { useChronoStore } from '../../stores/useChronoStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { useSignalStore } from '../../stores/useSignalStore';
import type { WingId } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatClock(d: Date): string {
  const date = d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const time = d.toLocaleTimeString('en-US', { hour12: false });
  return `${date} ${time}`;
}

// ─── Navigation zones ────────────────────────────────────────────────────────

const WING_ZONES: { wings: { id: WingId; label: string; short: string }[] }[] = [
  {
    wings: [
      { id: 'recon', label: 'RECON', short: 'RCN' },
      { id: 'pulse', label: 'PULSE', short: 'PLS' },
      { id: 'beacon', label: 'BEACON', short: 'BCN' },
    ],
  },
  {
    wings: [
      { id: 'ops', label: 'OPS', short: 'OPS' },
      { id: 'security', label: 'SECURITY', short: 'SEC' },
    ],
  },
  {
    wings: [
      { id: 'vault', label: 'VAULT', short: 'VLT' },
      { id: 'archive', label: 'ARCHIVE', short: 'ARC' },
      { id: 'chrono', label: 'CHRONO', short: 'CHR' },
      { id: 'link', label: 'LINK', short: 'LNK' },
      { id: 'signal', label: 'SIGNAL', short: 'SIG' },
    ],
  },
];

// ─── Shell ───────────────────────────────────────────────────────────────────

interface ShellProps {
  activeWing: WingId;
  onWingChange: (wing: WingId) => void;
  children: React.ReactNode;
}

export default function Shell({
  activeWing,
  onWingChange,
  children,
}: ShellProps): React.ReactElement {
  const [clockStr, setClockStr] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const id = setInterval(() => setClockStr(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  // Live status bar data
  const cpuPercent = usePulseStore(
    (s) =>
      (s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1]?.cpuPercent : null) ?? null,
  );
  const pendingTasks = useChronoStore((s) => s.tasks.filter((t) => !t.done).length);
  const activeSignals = useSignalStore((s) => s.feeds.filter((f) => f.isActive).length);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--color-base-900)',
        overflow: 'hidden',
      }}
    >
      {/* Scan line */}
      <div className="scan-line" />

      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: '40px',
          background: 'var(--color-base-800)',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-accent-500)',
              letterSpacing: '0.2em',
            }}
          >
            NEXUS
          </span>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.15em',
            }}
          >
            PERSONAL BASE OF OPERATIONS
          </span>
        </div>

        {/* Wing tabs — grouped into zones */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {WING_ZONES.map((zone, zoneIdx) => (
            <div
              key={zone.wings[0]?.id ?? zoneIdx}
              style={{ display: 'flex', alignItems: 'center', gap: '2px' }}
            >
              {/* Zone separator */}
              {zoneIdx > 0 && (
                <div
                  style={{
                    width: '1px',
                    height: '14px',
                    background: 'var(--color-border-subtle)',
                    margin: '0 6px',
                    opacity: 0.6,
                  }}
                />
              )}
              {zone.wings.map((wing) => {
                const isActive = wing.id === activeWing;
                return (
                  <button
                    key={wing.id}
                    type="button"
                    onClick={() => onWingChange(wing.id)}
                    title={wing.label}
                    style={{
                      padding: '4px 10px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      background: isActive ? 'var(--color-accent-500)' : 'transparent',
                      color: isActive ? '#000' : 'var(--color-text-secondary)',
                      border: `1px solid ${isActive ? 'var(--color-accent-500)' : 'var(--color-border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    {wing.short}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Clock */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.1em',
          }}
        >
          {clockStr}
        </div>
      </header>

      {/* Wing content */}
      <main style={{ flex: 1, overflow: 'hidden' }}>{children}</main>

      {/* Status bar — live system data */}
      <footer
        style={{
          height: '24px',
          background: 'var(--color-base-800)',
          borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '20px',
          flexShrink: 0,
        }}
      >
        {/* CPU */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color:
              cpuPercent !== null && cpuPercent >= 50
                ? 'var(--color-danger-500)'
                : cpuPercent !== null && cpuPercent >= 20
                  ? 'var(--color-accent-500)'
                  : 'var(--color-text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          CPU {cpuPercent !== null ? `${cpuPercent.toFixed(0)}%` : '--'}
        </span>

        {/* Pending tasks */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: pendingTasks > 0 ? 'var(--color-accent-500)' : 'var(--color-text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          TASKS {pendingTasks}
        </span>

        {/* Active signals */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: activeSignals > 0 ? 'var(--color-cyan-500)' : 'var(--color-text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          SIGNALS {activeSignals}
        </span>

        {/* Active wing indicator */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-success-500)',
            letterSpacing: '0.08em',
          }}
        >
          ●{' '}
          {WING_ZONES.flatMap((z) => z.wings).find((w) => w.id === activeWing)?.label ??
            activeWing.toUpperCase()}
        </span>

        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
          }}
        >
          STATUS: ONLINE
        </span>
      </footer>
    </div>
  );
}
