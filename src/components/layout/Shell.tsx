import { FileText, Gamepad2, HardDrive, Home, Monitor, Network, Settings, Zap } from 'lucide-react';
import type React from 'react';
import { memo, useMemo, useState } from 'react';
import { calcReadiness, getRankStyle } from '../../lib/gameReadiness';
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
    wings: [{ id: 'windows', label: 'Windows', icon: Monitor }],
  },
  {
    label: null,
    wings: [{ id: 'log', label: 'ログ', icon: FileText }],
  },
  {
    label: null,
    wings: [{ id: 'netopt', label: 'ネットワーク', icon: Network }],
  },
  {
    label: null,
    wings: [{ id: 'storage', label: 'ストレージ', icon: HardDrive }],
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

const Shell = memo(function Shell({
  activeWing,
  onWingChange,
  children,
}: ShellProps): React.ReactElement {
  const [hoveredWing, setHoveredWing] = useState<WingId | null>(null);

  // Live CPU and Memory data for status - using granular selectors
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

  // Hardware data for score calculation - using granular selectors
  const { diskUsagePercent, info: hwInfo } = useHardwareData();
  const gpuUsage = hwInfo?.gpuUsagePercent ?? null;
  const latestSnapshot = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );

  // Calculate game readiness
  const gameScore = useMemo(() => {
    const readiness = calcReadiness({
      cpuPercent,
      memUsedMb:
        latestSnapshot && latestSnapshot.memUsedMb !== null
          ? latestSnapshot.memUsedMb / 1024
          : null,
      memTotalMb:
        latestSnapshot && latestSnapshot.memTotalMb !== null
          ? latestSnapshot.memTotalMb / 1024
          : null,
      gpuUsagePercent: gpuUsage,
      gpuTempC: null,
      diskUsagePercent,
      isProfileApplied: false,
      boostLevel: 'none',
      timerState: null,
      affinityConfigured: false,
      frameTime: null,
    });
    return readiness.total;
  }, [cpuPercent, latestSnapshot, diskUsagePercent, gpuUsage]);

  // Calculate score color class
  const scoreColorClass = useMemo(() => {
    if (gameScore === null) return 'text-text-muted';
    const readiness = calcReadiness({
      cpuPercent,
      memUsedMb:
        latestSnapshot && latestSnapshot.memUsedMb !== null
          ? latestSnapshot.memUsedMb / 1024
          : null,
      memTotalMb:
        latestSnapshot && latestSnapshot.memTotalMb !== null
          ? latestSnapshot.memTotalMb / 1024
          : null,
      gpuUsagePercent: gpuUsage,
      gpuTempC: null,
      diskUsagePercent,
      isProfileApplied: false,
      boostLevel: 'none',
      timerState: null,
      affinityConfigured: false,
      frameTime: null,
    });
    const style = getRankStyle(readiness.rank);
    // Map style.color to Tailwind class
    const colorMap: Record<string, string> = {
      'var(--color-success-500)': 'text-success-500',
      'var(--color-cyan-500)': 'text-cyan-500',
      'var(--color-accent-400)': 'text-accent-400',
    };
    return colorMap[style.color] ?? 'text-danger-500';
  }, [gameScore, cpuPercent, latestSnapshot, diskUsagePercent, gpuUsage]);

  return (
    <div className="flex h-screen bg-base-900 overflow-hidden">
      {/* Scan line */}
      <div className="scan-line fixed top-0 left-0 right-0 z-[1000]" />

      {/* Sidebar */}
      <div
        className="w-40 flex-shrink-0 bg-base-950 border-r border-border-subtle flex flex-col"
        data-testid="sidebar"
      >
        {/* Logo area (48px) */}
        <div className="h-12 flex flex-col items-center justify-center px-3 py-2 border-b border-border-subtle">
          <div className="text-accent-500 text-sm font-bold tracking-widest mb-0.5">NEXUS</div>
          <div className="text-[9px] text-text-muted tracking-[0.15em]">GAMING TOOLS</div>
        </div>

        {/* Navigation zone */}
        <div className="flex-1 overflow-y-auto py-2">
          {SIDEBAR_ZONES.map((zone) => (
            <div key={zone.label || 'home'}>
              {/* Zone header */}
              {zone.label && (
                <div className="text-[9px] text-text-muted tracking-[0.15em] px-3 py-3 pb-1 uppercase">
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
                    data-testid={`nav-${wing.id}`}
                    className={`w-full h-7 px-4 pl-4 font-mono text-xs tracking-[0.08em] transition-all duration-150 text-left border-l-2 ${
                      isActive
                        ? 'bg-base-800 text-cyan-500 border-cyan-500'
                        : hoveredWing === wing.id
                          ? 'bg-base-800 text-text-secondary border-transparent'
                          : 'bg-transparent text-text-secondary border-transparent hover:bg-base-800'
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
        <div className="h-14 border-t border-border-subtle flex flex-col items-center justify-center px-3 py-2 gap-1">
          <div
            className={`text-[10px] font-mono ${
              cpuPercent !== null && cpuPercent >= 50
                ? 'text-danger-500'
                : cpuPercent !== null && cpuPercent >= 20
                  ? 'text-accent-500'
                  : 'text-text-muted'
            }`}
          >
            CPU {cpuPercent !== null ? `${cpuPercent.toFixed(0)}%` : '--'}
          </div>
          <div
            className={`text-[10px] font-mono ${
              memPercent !== null && memPercent >= 80
                ? 'text-danger-500'
                : memPercent !== null && memPercent >= 50
                  ? 'text-accent-500'
                  : 'text-text-muted'
            }`}
          >
            MEM {memPercent !== null ? `${memPercent.toFixed(0)}%` : '--'}
          </div>
          <div className={`text-[10px] font-mono ${scoreColorClass}`}>
            SCORE {gameScore !== null ? `${gameScore} / 100` : '-- / 100'}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden" data-testid={`wing-${activeWing}`}>
        {children}
      </main>
    </div>
  );
});

export default Shell;
