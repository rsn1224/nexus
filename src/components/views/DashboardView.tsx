import type React from 'react';
import { memo, useEffect, useRef } from 'react';
import { formatGb } from '../../lib/formatters';
import { useOptimizeStore } from '../../stores/useOptimizeStore';
import { useSystemStore } from '../../stores/useSystemStore';
import type { ChartDataPoint } from '../ui/MetricChart';
import MetricChart from '../ui/MetricChart';

const CHART_BUFFER = 60;
const CPU_THRESHOLDS = { warn: 70, danger: 90 };
const GPU_THRESHOLDS = { warn: 70, danger: 90 };
const TEMP_THRESHOLDS = { warn: 80, danger: 95 };
const RAM_THRESHOLDS = { warn: 80, danger: 90 };

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

function calcRamPercent(ramUsedGb: number, ramTotalGb: number): number | null {
  return ramTotalGb > 0 ? (ramUsedGb / ramTotalGb) * 100 : null;
}

interface BigMetricCardProps {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  chartData: ChartDataPoint[];
  chartColor: string;
}

function BigMetricCard({
  label,
  value,
  unit,
  sub,
  chartData,
  chartColor,
}: BigMetricCardProps): React.ReactElement {
  return (
    <div className="flex-1 min-w-0 bg-base-800 border border-border-subtle rounded flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-text-secondary">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] font-bold leading-none text-text-primary">{value}</span>
          <span className="text-[11px] text-text-muted">{unit}</span>
        </div>
      </div>
      {sub && <span className="px-4 text-[10px] text-text-muted">{sub}</span>}
      <div className="mt-auto px-0 pb-0">
        <MetricChart data={chartData} color={chartColor} height={72} />
      </div>
    </div>
  );
}

interface SmallMetricCardProps {
  label: string;
  value: string;
  unit: string;
  sub?: string;
}

function SmallMetricCard({ label, value, unit, sub }: SmallMetricCardProps): React.ReactElement {
  return (
    <div className="min-w-0 bg-base-800 border border-border-subtle rounded px-4 py-3">
      <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted">
        {label}
      </span>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-[22px] font-bold leading-none text-text-primary">{value}</span>
        <span className="text-[10px] text-text-muted">{unit}</span>
      </div>
      {sub && <span className="text-[10px] text-text-muted mt-0.5 block">{sub}</span>}
    </div>
  );
}

const DashboardView = memo(function DashboardView(): React.ReactElement {
  const status = useSystemStore((s) => s.status);
  const alerts = useSystemStore((s) => s.alerts);
  const sessionCount = useOptimizeStore((s) => s.history.length);

  const cpuBuf = useRef<ChartDataPoint[]>([]);
  const gpuBuf = useRef<ChartDataPoint[]>([]);
  const ramBuf = useRef<ChartDataPoint[]>([]);

  useEffect(() => {
    if (status === null) return;
    const ramPercent = calcRamPercent(status.ram_used_gb, status.ram_total_gb);
    cpuBuf.current = pushBuffer(cpuBuf.current, status.cpu_percent);
    gpuBuf.current = pushBuffer(gpuBuf.current, status.gpu_percent);
    ramBuf.current = pushBuffer(ramBuf.current, ramPercent);
  }, [status]);

  const ramPercent = status ? calcRamPercent(status.ram_used_gb, status.ram_total_gb) : null;

  const cpuColor = getStatusColor(status?.cpu_percent ?? null, CPU_THRESHOLDS);
  const gpuColor = getStatusColor(status?.gpu_percent ?? null, GPU_THRESHOLDS);
  const ramColor = getStatusColor(ramPercent, RAM_THRESHOLDS);

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-y-auto">
      {/* 上段：大カード × 3 */}
      <div className="flex gap-3 min-h-[180px]">
        <BigMetricCard
          label="CPU Usage"
          value={status ? status.cpu_percent.toFixed(1) : '--'}
          unit="%"
          chartData={cpuBuf.current}
          chartColor={cpuColor}
        />
        <BigMetricCard
          label="GPU Usage"
          value={status ? status.gpu_percent.toFixed(1) : '--'}
          unit="%"
          chartData={gpuBuf.current}
          chartColor={gpuColor}
        />
        <BigMetricCard
          label="Memory"
          value={status ? formatGb(status.ram_used_gb) : '--'}
          unit="GB"
          sub={status ? `/ ${formatGb(status.ram_total_gb)} GB total` : undefined}
          chartData={ramBuf.current}
          chartColor={ramColor}
        />
      </div>

      {/* 下段：小カード × 5 */}
      <div className="grid grid-cols-5 gap-3">
        <SmallMetricCard label="CPU Temp" value="--" unit="°C" />
        <SmallMetricCard
          label="GPU Temp"
          value={status ? status.gpu_temp_c.toFixed(0) : '--'}
          unit="°C"
          sub={
            status && status.gpu_temp_c >= TEMP_THRESHOLDS.warn
              ? `Hotspot ${status.gpu_temp_c.toFixed(0)}°C`
              : undefined
          }
        />
        <SmallMetricCard
          label="Disk Free"
          value={status ? formatGb(status.disk_free_gb) : '--'}
          unit="GB"
        />
        <SmallMetricCard
          label="RAM Usage"
          value={ramPercent !== null ? ramPercent.toFixed(1) : '--'}
          unit="%"
        />
        <SmallMetricCard label="Sessions" value={String(sessionCount)} unit="" />
      </div>

      {/* 診断アラート（存在する場合のみ表示） */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-text-muted">
            Diagnostics
          </span>
          {alerts.map((alert) => (
            <div
              key={`${alert.severity}-${alert.title}`}
              className={[
                'flex items-start gap-2 px-3 py-2 rounded border text-[11px]',
                alert.severity === 'danger'
                  ? 'border-danger-500/30 bg-danger-500/5 text-danger-500'
                  : 'border-warning-500/30 bg-warning-500/5 text-warning-500',
              ].join(' ')}
            >
              <span className="font-semibold shrink-0">{alert.title}</span>
              <span className="text-text-muted">{alert.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default DashboardView;
