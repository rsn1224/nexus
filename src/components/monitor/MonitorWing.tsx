import { memo, useEffect, useRef } from 'react';
import { usePulseStore } from '../../stores/usePulseStore';
import { CoreLoadChart } from './CoreLoadChart';
import { KpiCard } from './KpiCard';
import { StabilityGauge } from './StabilityGauge';

export const MonitorWing = memo(function MonitorWing() {
  const snapshots = usePulseStore((s) => s.snapshots);
  const subscribe = usePulseStore((s) => s.subscribe);
  const unsubscribe = usePulseStore((s) => s.unsubscribe);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    void subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  const latest = snapshots[snapshots.length - 1];
  const cpuPct = latest?.cpuPercent ?? 0;
  const cpuTemp = latest?.cpuTempC ?? null;
  const netKb = latest?.netRecvKb ?? 0;
  const memPct = latest ? Math.round((latest.memUsedMb / latest.memTotalMb) * 100) : 0;
  const uptimeSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

  const stabilityPct = Math.max(0, Math.min(100, 100 - Math.max(0, cpuPct - 80) * 2));

  return (
    <div className="grid grid-cols-12 gap-4 p-4 overflow-y-auto h-full">
      {/* Left: Stability Gauge */}
      <div className="col-span-12 lg:col-span-4">
        <StabilityGauge percent={stabilityPct} uptimeSeconds={uptimeSeconds} latencyMs={0.02} />
      </div>

      {/* Right: Chart + KPIs */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
        <CoreLoadChart cpuPercent={cpuPct} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="熱ステータス / THERMAL"
            value={cpuTemp != null ? cpuTemp.toFixed(1) : '—'}
            unit="°C"
            percent={cpuTemp != null ? cpuTemp : 0}
            color="accent"
            moduleId="MOD_01A"
          />
          <KpiCard
            label="帯域幅 / BANDWIDTH"
            value={(netKb / 1024 / 1024).toFixed(1)}
            unit="gbps"
            percent={Math.min(100, (netKb / 102400) * 100)}
            color="info"
          />
          <KpiCard
            label="メモリ同期 / MEM_SYNC"
            value={String(memPct)}
            unit="%"
            percent={memPct}
            color={memPct >= 90 ? 'warning' : 'accent'}
          />
        </div>
      </div>
    </div>
  );
});
