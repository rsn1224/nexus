import type React from 'react';
import { memo, useEffect, useRef } from 'react';
import { formatGb, formatTemp } from '../../lib/formatters';
import { useHardwareStore } from '../../stores/useHardwareStore';
import { useSystemStore } from '../../stores/useSystemStore';
import type { ChartDataPoint } from '../ui/MetricChart';
import MetricChart from '../ui/MetricChart';

const CHART_BUFFER = 30;

/** バッファに値を追加し、最大 CHART_BUFFER 件を維持 */
function pushBuf(buf: ChartDataPoint[], value: number | null): ChartDataPoint[] {
  const next = [...buf, { value: value ?? 0 }];
  return next.length > CHART_BUFFER ? next.slice(next.length - CHART_BUFFER) : next;
}

interface ChartRowProps {
  label: string;
  value: string;
  unit: string;
  data: ChartDataPoint[];
  color: string;
}

function ChartRow({ label, value, unit, data, color }: ChartRowProps): React.ReactElement {
  return (
    <div className="nx-card nx-corner-marks flex items-center gap-3 py-2">
      <div className="w-[52px] shrink-0">
        <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-text-muted">
          {label}
        </div>
        <div className="flex items-baseline gap-0.5 mt-0.5">
          <span className="text-[18px] font-bold leading-none text-text-primary">{value}</span>
          <span className="text-[9px] text-text-muted">{unit}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 h-[40px]">
        <MetricChart data={data} color={color} height={40} />
      </div>
    </div>
  );
}

const MonitorView = memo(function MonitorView(): React.ReactElement {
  const status = useSystemStore((s) => s.status);
  const hardwareInfo = useHardwareStore((s) => s.info);
  const fetchHardware = useHardwareStore((s) => s.fetchInfo);

  const cpuBuf = useRef<ChartDataPoint[]>([]);
  const gpuBuf = useRef<ChartDataPoint[]>([]);
  const tempBuf = useRef<ChartDataPoint[]>([]);
  const ramBuf = useRef<ChartDataPoint[]>([]);

  useEffect(() => {
    void fetchHardware();
  }, [fetchHardware]);

  useEffect(() => {
    if (status === null) return;
    const ramPct = status.ram_total_gb > 0 ? (status.ram_used_gb / status.ram_total_gb) * 100 : 0;
    cpuBuf.current = pushBuf(cpuBuf.current, status.cpu_percent);
    gpuBuf.current = pushBuf(gpuBuf.current, status.gpu_percent);
    tempBuf.current = pushBuf(tempBuf.current, status.gpu_temp_c);
    ramBuf.current = pushBuf(ramBuf.current, ramPct);
  }, [status]);

  const na = '--';
  const ramPct =
    status && status.ram_total_gb > 0 ? (status.ram_used_gb / status.ram_total_gb) * 100 : null;

  return (
    <div className="flex flex-col gap-2">
      {/* ─ セクションラベル */}
      <div className="nx-section-lbl">REALTIME METRICS</div>

      {/* ─ 4 メトリクスチャート */}
      <div className="flex flex-col gap-1.5">
        <ChartRow
          label="CPU"
          value={status ? status.cpu_percent.toFixed(0) : na}
          unit="%"
          data={cpuBuf.current}
          color="var(--c)"
        />
        <ChartRow
          label="GPU"
          value={status ? status.gpu_percent.toFixed(0) : na}
          unit="%"
          data={gpuBuf.current}
          color="var(--nx-success)"
        />
        <ChartRow
          label="TEMP"
          value={status ? status.gpu_temp_c.toFixed(0) : na}
          unit="°C"
          data={tempBuf.current}
          color="var(--nx-warning)"
        />
        <ChartRow
          label="RAM"
          value={ramPct !== null ? ramPct.toFixed(0) : na}
          unit="%"
          data={ramBuf.current}
          color="rgba(139,92,246,1)"
        />
      </div>

      {/* ─ ハードウェアサマリー */}
      {hardwareInfo && (
        <>
          <div className="nx-section-lbl mt-2">HARDWARE</div>
          <div className="nx-card flex flex-col gap-2">
            <HwRow label="CPU" value={hardwareInfo.cpuName} />
            <HwRow
              label="CORES"
              value={`${hardwareInfo.cpuCores}C / ${hardwareInfo.cpuThreads}T`}
            />
            {hardwareInfo.gpuName && <HwRow label="GPU" value={hardwareInfo.gpuName} />}
            <HwRow
              label="RAM"
              value={`${formatGb(hardwareInfo.memUsedGb)} / ${formatGb(hardwareInfo.memTotalGb)} GB`}
            />
            {hardwareInfo.cpuTempC !== null && (
              <HwRow label="CPU TEMP" value={formatTemp(hardwareInfo.cpuTempC)} />
            )}
          </div>
        </>
      )}
    </div>
  );
});

function HwRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="nx-s-row">
      <span className="nx-s-lbl">{label}</span>
      <span className="text-[11px] text-text-primary">{value}</span>
    </div>
  );
}

export default MonitorView;
