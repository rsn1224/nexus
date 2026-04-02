import type React from 'react';
import { memo, useEffect, useRef } from 'react';
import { formatGb } from '../../lib/formatters';
import { useSystemStore } from '../../stores/useSystemStore';

const CPU_THRESHOLDS = { warn: 70, danger: 90 } as const;
const GPU_THRESHOLDS = { warn: 70, danger: 90 } as const;
const TEMP_THRESHOLDS = { warn: 80, danger: 95 } as const;
const RAM_THRESHOLDS = { warn: 80, danger: 90 } as const;

// シアン (#22d3ee) = --c, 警告 = --nx-warning, 危険 = --nx-danger
const COLOR_NORMAL = '#22d3ee';
const COLOR_WARN = '#f59e0b';
const COLOR_DANGER = '#ef4444';

function getStatusColor(
  value: number | null,
  thresholds: { warn: number; danger: number },
): string {
  if (value === null) return COLOR_NORMAL;
  if (value >= thresholds.danger) return COLOR_DANGER;
  if (value >= thresholds.warn) return COLOR_WARN;
  return COLOR_NORMAL;
}

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  color: string;
}

function KpiCard({ label, value, unit, sub, color }: KpiCardProps): React.ReactElement {
  return (
    <div className="nx-card nx-corner-marks flex-1 flex flex-col justify-between p-2.5 h-[72px]">
      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-text-muted">
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-[22px] font-bold leading-none" style={{ color }}>
          {value}
        </span>
        <span className="text-[9px] text-text-muted">{unit}</span>
      </div>
      {sub && <span className="text-[8px] text-text-muted">{sub}</span>}
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

  const cpuColor = getStatusColor(status?.cpu_percent ?? null, CPU_THRESHOLDS);
  const gpuColor = getStatusColor(status?.gpu_percent ?? null, GPU_THRESHOLDS);
  const tempColor = getStatusColor(status?.gpu_temp_c ?? null, TEMP_THRESHOLDS);
  const ramColor = getStatusColor(ramPercent, RAM_THRESHOLDS);

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
        color={cpuColor}
      />
      <KpiCard
        label="GPU"
        value={status ? status.gpu_percent.toFixed(0) : na}
        unit="%"
        color={gpuColor}
      />
      <KpiCard
        label="TEMP"
        value={status ? status.gpu_temp_c.toFixed(0) : na}
        unit="°C"
        color={tempColor}
        sub={tempWarn}
      />
      <KpiCard
        label="RAM"
        value={ramPercent !== null ? ramPercent.toFixed(0) : na}
        unit="%"
        color={ramColor}
        sub={ramSub}
      />
    </section>
  );
});

export default KpiGrid;
