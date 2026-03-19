import { memo } from 'react';
import type { ResourceSnapshot } from '../../types/pulse';

interface Props {
  snapshot: ResourceSnapshot | null;
}

const NET_BARS = [
  { id: 'bar-a', h: 'h-[30%]', active: false },
  { id: 'bar-b', h: 'h-[45%]', active: false },
  { id: 'bar-c', h: 'h-[25%]', active: false },
  { id: 'bar-d', h: 'h-[90%]', active: true },
  { id: 'bar-e', h: 'h-[60%]', active: false },
  { id: 'bar-f', h: 'h-[40%]', active: false },
];

export const HardwareTelemetry = memo(function HardwareTelemetry({ snapshot }: Props) {
  const cpuPct = snapshot?.cpuPercent ?? 0;
  const cpuTemp = snapshot?.cpuTempC ?? null;
  const netKb = snapshot?.netRecvKb ?? 0;

  const isThermalWarn = (cpuTemp ?? 0) >= 80;
  const tempPct = Math.min(100, cpuTemp ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <span className="text-text-secondary text-[10px] tracking-widest opacity-70 block">
          システム監視
        </span>
        <h2 className="text-xs font-black tracking-widest text-text-secondary uppercase">
          Hardware_Telemetry
        </h2>
      </div>

      {/* CPU Load */}
      <CpuBar cpuPct={cpuPct} />

      {/* Thermal */}
      <ThermalBar cpuTemp={cpuTemp} isThermalWarn={isThermalWarn} tempPct={tempPct} />

      {/* Network */}
      <div className="piano-surface p-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-light tracking-widest text-text-secondary uppercase">
            Network_Traffic
          </span>
          <span className="text-[9px] px-2 py-0.5 bg-info-500/10 text-info-500 border border-info-500/20">
            STABLE
          </span>
        </div>
        <div className="flex items-end gap-1 h-12">
          {NET_BARS.map((bar) => (
            <div
              key={bar.id}
              className={`flex-1 ${bar.h} transition-all duration-300 ${
                bar.active ? 'bg-info-500 shadow-[0_0_5px_var(--color-info-500)]' : 'bg-info-500/20'
              }`}
            />
          ))}
        </div>
        <p className="text-[9px] text-text-secondary tracking-widest">
          {(netKb / 1024).toFixed(1)} MB/s
        </p>
      </div>
    </div>
  );
});

// ─── Sub-components ──────────────────────────────────────

const CpuBar = memo(function CpuBar({ cpuPct }: { cpuPct: number }) {
  return (
    <div className="piano-surface p-4 space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-light tracking-widest text-text-secondary">
          CPU_LOAD [CORE_01]
        </span>
        <span className="text-xl font-black text-info-500">{cpuPct.toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-base-600 w-full relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-info-500 shadow-[0_0_8px_var(--color-info-500)] transition-all duration-300"
          style={{ width: `${Math.min(100, cpuPct)}%` }}
        />
      </div>
    </div>
  );
});

const ThermalBar = memo(function ThermalBar({
  cpuTemp,
  isThermalWarn,
  tempPct,
}: {
  cpuTemp: number | null;
  isThermalWarn: boolean;
  tempPct: number;
}) {
  return (
    <div
      className={`piano-surface p-4 space-y-3 ${isThermalWarn ? 'border-l-2 border-l-warning-500' : ''}`}
    >
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          {isThermalWarn && <span className="text-warning-500 text-sm">⚠</span>}
          <span
            className={`text-[10px] font-light tracking-widest ${isThermalWarn ? 'text-warning-500' : 'text-text-secondary'}`}
          >
            CPU_THERMAL{isThermalWarn ? '_LIMIT' : ''}
          </span>
        </div>
        <span
          className={`text-xl font-black ${isThermalWarn ? 'text-warning-500' : 'text-text-primary'}`}
        >
          {cpuTemp != null ? `${cpuTemp.toFixed(0)}°C` : '—'}
        </span>
      </div>
      <div className="h-1 bg-base-600 w-full relative overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-300 ${
            isThermalWarn
              ? 'bg-warning-500 shadow-[0_0_8px_var(--color-warning-500)]'
              : 'bg-accent-500 shadow-[0_0_8px_var(--color-accent-500)]'
          }`}
          style={{ width: `${tempPct}%` }}
        />
      </div>
      {isThermalWarn && (
        <p className="text-[10px] text-warning-500 tracking-widest">
          警告：温度が上限に近づいています
        </p>
      )}
    </div>
  );
});
