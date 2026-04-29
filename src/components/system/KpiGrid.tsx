import type React from 'react';
import { memo, useEffect, useRef } from 'react';
import { formatGb } from '../../lib/formatters';
import { useSystemStore } from '../../stores/useSystemStore';

const CPU_THRESHOLDS = { warn: 70, danger: 90 } as const;
const GPU_THRESHOLDS = { warn: 70, danger: 90 } as const;
const TEMP_THRESHOLDS = { warn: 80, danger: 95 } as const;
const RAM_THRESHOLDS = { warn: 80, danger: 90 } as const;

function getStatusColorClass(
  value: number | null,
  thresholds: { warn: number; danger: number },
): string {
  if (value === null) return 'text-accent-400';
  if (value >= thresholds.danger) return 'text-danger-500';
  if (value >= thresholds.warn) return 'text-warning-500';
  return 'text-accent-400';
}

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  colorClass: string;
}

function KpiCard({ label, value, unit, sub, colorClass }: KpiCardProps): React.ReactElement {
  return (
    <div className="bg-base-800 border border-border-subtle rounded flex-1 flex flex-col justify-between p-2.5 h-18">
      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-text-muted">
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className={`text-[22px] font-bold leading-none font-mono ${colorClass}`}>
          {value}
        </span>
        <span className="text-[9px] text-text-muted">{unit}</span>
      </div>
      {sub && <span className="text-[9px] text-text-muted">{sub}</span>}
    </div>
  );
}

// チャートバッファ（MonitorView 側との重複を避けるため最小限に保持）
const CHART_BUFFER = 60;

interface ChartPoint {
  value: number;
}

function pushBuffer(buf: ChartPoint[], value: number | null): ChartPoint[] {
  const next = [...buf, { value: value ?? 0 }];
  return next.length > CHART_BUFFER ? next.slice(next.length - CHART_BUFFER) : next;
}

const KpiGrid = memo(function KpiGrid(): React.ReactElement {
  const status = useSystemStore((s) => s.status);

  const cpuBuf = useRef<ChartPoint[]>([]);
  const gpuBuf = useRef<ChartPoint[]>([]);

  useEffect(() => {
    if (status === null) return;
    cpuBuf.current = pushBuffer(cpuBuf.current, status.cpu_percent);
    gpuBuf.current = pushBuffer(gpuBuf.current, status.gpu_percent);
  }, [status]);

  const ramPercent =
    status && status.ram_total_gb > 0 ? (status.ram_used_gb / status.ram_total_gb) * 100 : null;

  const cpuColorClass = getStatusColorClass(status?.cpu_percent ?? null, CPU_THRESHOLDS);
  const gpuColorClass = getStatusColorClass(status?.gpu_percent ?? null, GPU_THRESHOLDS);
  const tempColorClass = getStatusColorClass(status?.gpu_temp_c ?? null, TEMP_THRESHOLDS);
  const ramColorClass = getStatusColorClass(ramPercent, RAM_THRESHOLDS);

  const na = '--';

  const ramSub =
    status && status.ram_total_gb > 0 ? `/ ${formatGb(status.ram_total_gb)}GB` : undefined;
  const tempWarn = status && status.gpu_temp_c >= TEMP_THRESHOLDS.warn ? 'GPU HOT' : undefined;

  return (
    <section aria-label="System Status" className="flex gap-1.5">
      <KpiCard
        label="CPU"
        value={status ? status.cpu_percent.toFixed(0) : na}
        unit="%"
        colorClass={cpuColorClass}
      />
      <KpiCard
        label="GPU"
        value={status ? status.gpu_percent.toFixed(0) : na}
        unit="%"
        colorClass={gpuColorClass}
      />
      <KpiCard
        label="TEMP"
        value={status ? status.gpu_temp_c.toFixed(0) : na}
        unit="°C"
        colorClass={tempColorClass}
        sub={tempWarn}
      />
      <KpiCard
        label="RAM"
        value={ramPercent !== null ? ramPercent.toFixed(0) : na}
        unit="%"
        colorClass={ramColorClass}
        sub={ramSub}
      />
    </section>
  );
});

export default KpiGrid;
