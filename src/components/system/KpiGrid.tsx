import type React from 'react';
import { memo, useEffect, useRef } from 'react';
import { formatGb } from '../../lib/formatters';
import { useSystemStore } from '../../stores/useSystemStore';
import type { ChartDataPoint } from '../ui/MetricChart';
import MetricChart from '../ui/MetricChart';

const CHART_BUFFER = 60;

const CPU_THRESHOLDS = { warn: 70, danger: 90 } as const;
const GPU_THRESHOLDS = { warn: 70, danger: 90 } as const;
const TEMP_THRESHOLDS = { warn: 80, danger: 95 } as const;
const RAM_THRESHOLDS = { warn: 80, danger: 90 } as const;

function getStatusColor(
  value: number | null,
  thresholds: { warn: number; danger: number },
): string {
  if (value === null) return '#06b6d4';
  if (value >= thresholds.danger) return '#ef4444';
  if (value >= thresholds.warn) return '#f59e0b';
  return '#06b6d4';
}

function pushBuffer(buf: ChartDataPoint[], value: number | null): ChartDataPoint[] {
  const next = [...buf, { value: value ?? 0 }];
  return next.length > CHART_BUFFER ? next.slice(next.length - CHART_BUFFER) : next;
}

// Primary: 大カード（チャート付き）— CPU/GPU
function PrimaryCard({
  label,
  value,
  unit,
  sub,
  chartData,
  chartColor,
}: {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  chartData: ChartDataPoint[];
  chartColor: string;
}): React.ReactElement {
  return (
    <div className="flex-1 min-w-0 bg-base-800 border border-border-subtle rounded flex flex-col">
      <div className="px-4 pt-3 pb-1 flex items-start justify-between">
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-text-secondary">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] font-bold leading-none text-text-primary">{value}</span>
          <span className="text-[11px] text-text-muted">{unit}</span>
        </div>
      </div>
      {sub && <span className="px-4 pb-1 text-[10px] text-text-muted">{sub}</span>}
      <div className="mt-auto px-0 pb-0">
        <MetricChart data={chartData} color={chartColor} height={60} />
      </div>
    </div>
  );
}

// Secondary: 中カード（バー付き）— RAM/Temp
function SecondaryCard({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  sub?: string;
}): React.ReactElement {
  return (
    <div className="bg-base-800 border border-border-subtle rounded px-4 py-3 flex flex-col min-w-[120px]">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">
        {label}
      </span>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[22px] font-bold leading-none text-text-primary">{value}</span>
        <span className="text-[10px] text-text-muted">{unit}</span>
      </div>
      {sub && <span className="text-[10px] text-text-muted mt-0.5">{sub}</span>}
    </div>
  );
}

// Tertiary: 小カード（テキストのみ）— Disk
function TertiaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}): React.ReactElement {
  return (
    <div className="bg-base-800 border border-border-subtle rounded px-4 py-3 flex flex-col min-w-[100px]">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">
        {label}
      </span>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[16px] font-bold leading-none text-text-primary">{value}</span>
        <span className="text-[10px] text-text-muted">{unit}</span>
      </div>
    </div>
  );
}

const KpiGrid = memo(function KpiGrid(): React.ReactElement {
  const status = useSystemStore((s) => s.status);

  const cpuBuf = useRef<ChartDataPoint[]>([]);
  const gpuBuf = useRef<ChartDataPoint[]>([]);

  useEffect(() => {
    if (status === null) return;
    const ramPct = status.ram_total_gb > 0 ? (status.ram_used_gb / status.ram_total_gb) * 100 : 0;
    cpuBuf.current = pushBuffer(cpuBuf.current, status.cpu_percent);
    gpuBuf.current = pushBuffer(gpuBuf.current, status.gpu_percent);
    void ramPct; // used for color derivation below
  }, [status]);

  const ramPercent =
    status && status.ram_total_gb > 0 ? (status.ram_used_gb / status.ram_total_gb) * 100 : null;

  const cpuColor = getStatusColor(status?.cpu_percent ?? null, CPU_THRESHOLDS);
  const gpuColor = getStatusColor(status?.gpu_percent ?? null, GPU_THRESHOLDS);
  void getStatusColor(status?.gpu_temp_c ?? null, TEMP_THRESHOLDS); // for future TEMP chart color
  void getStatusColor(ramPercent, RAM_THRESHOLDS); // derived for future use

  const na = '--';

  return (
    <section aria-label="System Status" className="flex gap-2 min-h-[140px]">
      {/* Primary × 2 */}
      <PrimaryCard
        label="CPU"
        value={status ? status.cpu_percent.toFixed(1) : na}
        unit="%"
        chartData={cpuBuf.current}
        chartColor={cpuColor}
      />
      <PrimaryCard
        label="GPU"
        value={status ? status.gpu_percent.toFixed(1) : na}
        unit="%"
        chartData={gpuBuf.current}
        chartColor={gpuColor}
      />

      {/* Secondary × 2 */}
      <SecondaryCard
        label="RAM"
        value={status ? formatGb(status.ram_used_gb) : na}
        unit="GB"
        sub={status ? `/ ${formatGb(status.ram_total_gb)} GB` : undefined}
      />
      <SecondaryCard
        label="TEMP"
        value={status ? status.gpu_temp_c.toFixed(0) : na}
        unit="°C"
        sub={status && status.gpu_temp_c >= TEMP_THRESHOLDS.warn ? `GPU hot` : undefined}
      />

      {/* Tertiary × 1 */}
      <TertiaryCard
        label="DISK"
        value={status ? formatGb(status.disk_free_gb) : na}
        unit="GB free"
      />
    </section>
  );
});

export default KpiGrid;
