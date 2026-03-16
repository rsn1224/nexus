import type React from 'react';
import { useState } from 'react';
import { usePulseStore } from '../../stores/usePulseStore';
import type { WingId } from '../../types';

// ─── Sidebar zones ───────────────────────────────────────────────────────────

const SIDEBAR_ZONES = [
  {
    label: null,
    wings: [{ id: 'home', label: 'ホーム' }],
  },
  {
    label: '最適化',
    wings: [
      { id: 'boost', label: '最適化' },
      { id: 'windows', label: 'Windows' },
    ],
  },
  {
    label: '監視',
    wings: [{ id: 'hardware', label: 'ハードウェア' }],
  },
  {
    label: 'コントロール',
    wings: [{ id: 'ops', label: 'プロセス管理' }],
  },
  {
    label: 'ゲーム',
    wings: [
      { id: 'launcher', label: 'ゲーム起動' },
      { id: 'advisor', label: 'アドバイザー' },
    ],
  },
  {
    label: 'ネットワーク',
    wings: [
      { id: 'recon', label: 'スキャン' },
      { id: 'netopt', label: '最適化 (NET)' },
    ],
  },
  {
    label: '自動化',
    wings: [{ id: 'script', label: 'スクリプト' }],
  },
  {
    label: 'システム',
    wings: [
      { id: 'storage', label: 'ストレージ' },
      { id: 'log', label: 'ログ' },
      { id: 'settings', label: '設定' },
    ],
  },
] as const;

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
  const [hoveredWing, setHoveredWing] = useState<WingId | null>(null);

  // Live CPU data for status
  const cpuPercent = usePulseStore(
    (s) =>
      (s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1]?.cpuPercent : null) ?? null,
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--color-base-900)',
        overflow: 'hidden',
      }}
    >
      {/* Scan line */}
      <div
        className="scan-line"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}
      />

      {/* Sidebar */}
      <div
        style={{
          width: '160px',
          flexShrink: 0,
          background: 'var(--color-base-950)',
          borderRight: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo area (48px) */}
        <div
          style={{
            height: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 12px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div
            style={{
              color: 'var(--color-accent-500)',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              marginBottom: '2px',
            }}
          >
            NEXUS
          </div>
          <div
            style={{
              fontSize: '9px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.15em',
            }}
          >
            GAMING TOOLS
          </div>
        </div>

        {/* Navigation zone */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {SIDEBAR_ZONES.map((zone) => (
            <div key={zone.label || 'home'}>
              {/* Zone header */}
              {zone.label && (
                <div
                  style={{
                    fontSize: '9px',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.15em',
                    padding: '12px 12px 4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {zone.label}
                </div>
              )}

              {/* Wing buttons */}
              {zone.wings.map((wing) => {
                const isActive = wing.id === activeWing;
                return (
                  <button
                    key={wing.id}
                    type="button"
                    onClick={() => onWingChange(wing.id)}
                    style={{
                      width: '100%',
                      height: '28px',
                      padding: '0 12px 0 16px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      background: isActive
                        ? 'var(--color-base-800)'
                        : hoveredWing === wing.id
                          ? 'var(--color-base-800)'
                          : 'transparent',
                      color: isActive ? 'var(--color-cyan-500)' : 'var(--color-text-secondary)',
                      border: 'none',
                      borderLeft: isActive
                        ? '2px solid var(--color-cyan-500)'
                        : '2px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.1s ease',
                    }}
                    onMouseEnter={() => setHoveredWing(wing.id)}
                    onMouseLeave={() => setHoveredWing(null)}
                  >
                    {wing.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Status bar (56px) */}
        <div
          style={{
            height: '56px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 12px',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color:
                cpuPercent !== null && cpuPercent >= 50
                  ? 'var(--color-danger-500)'
                  : cpuPercent !== null && cpuPercent >= 20
                    ? 'var(--color-accent-500)'
                    : 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            CPU {cpuPercent !== null ? `${cpuPercent.toFixed(0)}%` : '--'}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            SCORE -- / 100
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden' }}>{children}</main>
    </div>
  );
}
