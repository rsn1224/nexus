import { memo, useEffect } from 'react';
import { useHardwareData } from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import GameReadinessPanel from './GameReadinessPanel';

// ─── ResourceBar ─────────────────────────────────────────────────────────────

function ResourceBar({
  label,
  pct,
  warn = 50,
  danger = 80,
}: {
  label: string;
  pct: number | null;
  warn?: number;
  danger?: number;
}) {
  const barColor =
    pct === null
      ? 'bg-border-subtle'
      : pct >= danger
        ? 'bg-danger-500'
        : pct >= warn
          ? 'bg-accent-400'
          : 'bg-accent-500';
  const textColor =
    pct === null
      ? 'text-text-muted'
      : pct >= danger
        ? 'text-danger-500'
        : pct >= warn
          ? 'text-accent-400'
          : 'text-accent-500';

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] text-text-muted w-7 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-base-700 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, pct ?? 0))}%` }}
        />
      </div>
      <span className={`font-mono text-[9px] w-7 text-right shrink-0 ${textColor}`}>
        {pct !== null ? `${Math.round(pct)}%` : '--'}
      </span>
    </div>
  );
}

// ─── HeroSection ─────────────────────────────────────────────────────────────

const HeroSection = memo(function HeroSection() {
  const subscribePulse = usePulseStore((s) => s.subscribe);
  const snap = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );
  const { info: hw, diskUsagePercent, fetchHardware } = useHardwareData();

  useEffect(() => {
    subscribePulse();
    fetchHardware();
  }, [subscribePulse, fetchHardware]);

  const cpuPct = snap?.cpuPercent ?? null;
  const memPct =
    snap !== null && snap.memTotalMb > 0 ? (snap.memUsedMb / snap.memTotalMb) * 100 : null;
  const gpuPct = hw?.gpuUsagePercent ?? null;

  return (
    <div className="h-44 shrink-0 flex gap-3 px-3 py-2 border-b border-border-subtle overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <GameReadinessPanel />
      </div>
      <div className="w-[152px] flex flex-col justify-center gap-2 border-l border-border-subtle pl-3">
        <span className="font-mono text-[9px] font-semibold text-text-muted tracking-[0.12em]">
          RESOURCES
        </span>
        <ResourceBar label="CPU" pct={cpuPct} />
        <ResourceBar label="MEM" pct={memPct} />
        <ResourceBar label="GPU" pct={gpuPct} />
        <ResourceBar label="DISK" pct={diskUsagePercent} warn={70} danger={90} />
      </div>
    </div>
  );
});

export default HeroSection;
