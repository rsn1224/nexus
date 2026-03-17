import { Gamepad2, Home, Settings, Zap } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { calcScore, getScoreRank } from '../../lib/score';
import { useHardwareData } from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import type { WingId } from '../../types';

// ─── Sidebar zones ───────────────────────────────────────────────────────────

const SIDEBAR_ZONES = [
  {
    label: null,
    wings: [{ id: 'home', label: 'ホーム', icon: Home }],
  },
  {
    label: null,
    wings: [{ id: 'boost', label: '最適化', icon: Zap }],
  },
  {
    label: null,
    wings: [{ id: 'launcher', label: 'ゲーム', icon: Gamepad2 }],
  },
  {
    label: null,
    wings: [{ id: 'hardware', label: 'ハードウェア', icon: Settings }],
  },
  {
    label: null,
    wings: [{ id: 'settings', label: '設定', icon: Settings }],
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

  // Live CPU and Memory data for status
  const cpuPercent = usePulseStore(
    (s) =>
      (s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1]?.cpuPercent : null) ?? null,
  );
  const memPercent = usePulseStore(
    (s) =>
      (s.snapshots.length > 0
        ? ((s.snapshots[s.snapshots.length - 1]?.memUsedMb ?? 0) /
            (s.snapshots[s.snapshots.length - 1]?.memTotalMb ?? 1)) *
          100
        : null) ?? null,
  );

  // Hardware data for score calculation
  const { diskUsagePercent, info: hwInfo } = useHardwareData();
  const latestSnapshot = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );

  // Calculate game score
  const gameScore = useMemo(
    () =>
      calcScore({
        cpuPercent,
        memUsedGb: latestSnapshot?.memUsedMb ?? null,
        memTotalGb: latestSnapshot?.memTotalMb ?? null,
        diskUsagePercent,
        gpuUsagePercent: hwInfo?.gpuUsagePercent ?? null,
      }),
    [
      cpuPercent,
      latestSnapshot?.memUsedMb,
      latestSnapshot?.memTotalMb,
      diskUsagePercent,
      hwInfo?.gpuUsagePercent,
    ],
  );

  return (
    <div className="flex h-screen bg-[var(--color-base-900)] overflow-hidden">
      {/* Scan line */}
      <div className="scan-line fixed top-0 left-0 right-0 z-[1000]" />

      {/* Sidebar */}
      <div className="w-40 flex-shrink-0 bg-[var(--color-base-950)] border-r border-[var(--color-border-subtle)] flex flex-col">
        {/* Logo area (48px) */}
        <div className="h-12 flex flex-col items-center justify-center px-3 py-2 border-b border-[var(--color-border-subtle)]">
          <div className="text-[var(--color-accent-500)] text-sm font-bold tracking-widest mb-0.5">
            NEXUS
          </div>
          <div className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em]">
            GAMING TOOLS
          </div>
        </div>

        {/* Navigation zone */}
        <div className="flex-1 overflow-y-auto py-2">
          {SIDEBAR_ZONES.map((zone) => (
            <div key={zone.label || 'home'}>
              {/* Zone header */}
              {zone.label && (
                <div className="text-[9px] text-[var(--color-text-muted)] tracking-[0.15em] px-3 py-3 pb-1 uppercase">
                  {zone.label}
                </div>
              )}

              {/* Wing buttons */}
              {zone.wings.map((wing) => {
                const isActive = wing.id === activeWing;
                const Icon = wing.icon;
                return (
                  <button
                    key={wing.id}
                    type="button"
                    onClick={() => onWingChange(wing.id)}
                    className={`w-full h-7 px-4 pl-4 font-[var(--font-mono)] text-xs tracking-[0.08em] transition-all duration-150 text-left border-l-2 ${
                      isActive
                        ? 'bg-[var(--color-base-800)] text-[var(--color-cyan-500)] border-[var(--color-cyan-500)]'
                        : hoveredWing === wing.id
                          ? 'bg-[var(--color-base-800)] text-[var(--color-text-secondary)] border-transparent'
                          : 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-base-800)]'
                    }`}
                    onMouseEnter={() => setHoveredWing(wing.id)}
                    onMouseLeave={() => setHoveredWing(null)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} />
                      {wing.label}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Status bar (56px) */}
        <div className="h-14 border-t border-[var(--color-border-subtle)] flex flex-col items-center justify-center px-3 py-2 gap-1">
          <div
            className={`text-[10px] font-[var(--font-mono)] ${
              cpuPercent !== null && cpuPercent >= 50
                ? 'text-[var(--color-danger-500)]'
                : cpuPercent !== null && cpuPercent >= 20
                  ? 'text-[var(--color-accent-500)]'
                  : 'text-[var(--color-text-muted)]'
            }`}
          >
            CPU {cpuPercent !== null ? `${cpuPercent.toFixed(0)}%` : '--'}
          </div>
          <div
            className={`text-[10px] font-[var(--font-mono)] ${
              memPercent !== null && memPercent >= 80
                ? 'text-[var(--color-danger-500)]'
                : memPercent !== null && memPercent >= 50
                  ? 'text-[var(--color-accent-500)]'
                  : 'text-[var(--color-text-muted)]'
            }`}
          >
            MEM {memPercent !== null ? `${memPercent.toFixed(0)}%` : '--'}
          </div>
          <div
            className={`text-[10px] font-[var(--font-mono)] ${
              gameScore !== null
                ? (
                    () => {
                      const rank = getScoreRank(gameScore);
                      return rank.color === 'var(--color-success-500)'
                        ? 'text-[var(--color-success-500)]'
                        : rank.color === 'var(--color-cyan-500)'
                          ? 'text-[var(--color-cyan-500)]'
                          : rank.color === 'var(--color-accent-400)'
                            ? 'text-[var(--color-accent-400)]'
                            : 'text-[var(--color-danger-500)]';
                    }
                  )()
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            SCORE {gameScore !== null ? `${gameScore} / 100` : '-- / 100'}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
