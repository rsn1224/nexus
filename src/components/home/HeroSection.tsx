import { memo, useEffect, useMemo } from 'react';
import { useHardwareData } from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import GameReadinessPanel from './GameReadinessPanel';
import KpiCard from './KpiCard';

// ─── HeroSection ─────────────────────────────────────────────────────────────

const SPARKLINE_MAX = 30;

const HeroSection = memo(function HeroSection() {
  const subscribePulse = usePulseStore((s) => s.subscribe);
  const snapshots = usePulseStore((s) => s.snapshots);
  const { info: hw, diskUsagePercent, fetchHardware } = useHardwareData();

  useEffect(() => {
    subscribePulse();
    fetchHardware();
  }, [subscribePulse, fetchHardware]);

  const snap = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const recent = snapshots.slice(-SPARKLINE_MAX);

  const cpuPct = snap?.cpuPercent ?? null;
  const gpuPct = hw?.gpuUsagePercent ?? null;

  const cpuSparkline = useMemo(() => recent.map((s) => s.cpuPercent), [recent]);
  const memSparkline = useMemo(
    () => recent.map((s) => (s.memTotalMb > 0 ? (s.memUsedMb / s.memTotalMb) * 100 : 0)),
    [recent],
  );

  const memGb =
    snap !== null && snap.memTotalMb > 0 ? `${(snap.memUsedMb / 1024).toFixed(1)} GB` : '--';

  return (
    <div className="shrink-0 flex flex-col gap-3 px-3 py-3 border-b border-border-subtle">
      {/* KPI カード行 */}
      <div className="flex gap-3 card-animate stagger-1">
        <KpiCard
          label="CPU"
          value={cpuPct !== null ? `${Math.round(cpuPct)}%` : '--'}
          color="warm"
          sparkline={cpuSparkline}
        />
        <KpiCard label="MEM" value={memGb} color="accent" sparkline={memSparkline} />
        <KpiCard
          label="GPU"
          value={gpuPct !== null ? `${Math.round(gpuPct)}%` : '--'}
          color="purple"
        />
        <KpiCard
          label="DISK"
          value={diskUsagePercent !== null ? `${Math.round(diskUsagePercent)}%` : '--'}
          color="info"
        />
      </div>

      {/* Game Readiness */}
      <GameReadinessPanel />
    </div>
  );
});

export default HeroSection;
