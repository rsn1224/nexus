import { memo, useEffect } from 'react';
import { usePulseStore } from '../../stores/usePulseStore';
import { MetricCard } from './MetricCard';
import { TimelineGraph } from './TimelineGraph';

export const MonitorWing = memo(function MonitorWing() {
  const snapshots = usePulseStore((s) => s.snapshots);
  const subscribe = usePulseStore((s) => s.subscribe);
  const unsubscribe = usePulseStore((s) => s.unsubscribe);

  useEffect(() => {
    void subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  const latest = snapshots[snapshots.length - 1];

  const cpuPct = latest?.cpuPercent ?? 0;
  const memPct = latest ? Math.round((latest.memUsedMb / latest.memTotalMb) * 100) : 0;
  const memUsedGb = latest ? (latest.memUsedMb / 1024).toFixed(1) : '0.0';
  const memTotalGb = latest ? (latest.memTotalMb / 1024).toFixed(0) : '—';
  const cpuTemp = latest?.cpuTempC;

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="CPU"
          value={cpuPct.toFixed(1)}
          unit="%"
          percent={cpuPct}
          warn={cpuPct >= 70}
          critical={cpuPct >= 90}
        />
        <MetricCard
          label="MEMORY"
          value={memUsedGb}
          unit={`/ ${memTotalGb} GB`}
          percent={memPct}
          warn={memPct >= 70}
          critical={memPct >= 90}
        />
        <MetricCard
          label="CPU TEMP"
          value={cpuTemp != null ? cpuTemp.toFixed(0) : '—'}
          unit="°C"
          percent={cpuTemp != null ? (cpuTemp / 100) * 100 : 0}
          warn={cpuTemp != null && cpuTemp >= 75}
          critical={cpuTemp != null && cpuTemp >= 90}
        />
        <MetricCard
          label="NET RECV"
          value={latest ? (latest.netRecvKb / 1024).toFixed(1) : '0.0'}
          unit="MB/s"
          percent={Math.min(100, ((latest?.netRecvKb ?? 0) / 102400) * 100)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TimelineGraph
          snapshots={snapshots}
          field="cpuPercent"
          label="CPU %"
          color="accent"
          maxValue={100}
        />
        <TimelineGraph
          snapshots={snapshots}
          field="memUsedMb"
          label="MEMORY (MB)"
          color="warning"
          maxValue={latest?.memTotalMb ?? 16384}
        />
      </div>
    </div>
  );
});
