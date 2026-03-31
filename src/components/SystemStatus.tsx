import type React from 'react';
import { memo } from 'react';
import { formatGb } from '../lib/formatters';
import { useOptimizeStore } from '../stores/useOptimizeStore';
import { useSystemStatus } from '../stores/useSystemStore';
import SectionHeader from './ui/SectionHeader';

const CPU_THRESHOLDS = { warn: 70, danger: 90 };
const GPU_THRESHOLDS = { warn: 70, danger: 90 };
const TEMP_THRESHOLDS = { warn: 80, danger: 95 };
const RAM_THRESHOLDS = { warn: 80, danger: 90 };

function kpiColor(value: number, thresholds: { warn: number; danger: number }): string {
  if (value >= thresholds.danger) return 'text-danger-500';
  if (value >= thresholds.warn) return 'text-warning-500';
  return 'text-accent-500';
}

const SystemStatus = memo(function SystemStatus(): React.ReactElement {
  const { status } = useSystemStatus();
  const sessionCount = useOptimizeStore((s) => s.history.length);

  const ramPercent =
    status && status.ram_total_gb > 0 ? (status.ram_used_gb / status.ram_total_gb) * 100 : null;

  return (
    <section aria-label="システムステータス">
      <SectionHeader title="SYSTEM STATUS" color="muted" />

      <div className="grid grid-cols-4 gap-3 mt-2">
        <KpiCard label="CPU">
          <Kpi value={status?.cpu_percent ?? null} unit="%" thresholds={CPU_THRESHOLDS} />
        </KpiCard>
        <KpiCard label="GPU">
          <Kpi value={status?.gpu_percent ?? null} unit="%" thresholds={GPU_THRESHOLDS} />
        </KpiCard>
        <KpiCard label="GPU TEMP">
          <Kpi value={status?.gpu_temp_c ?? null} unit="°C" thresholds={TEMP_THRESHOLDS} />
        </KpiCard>
        <KpiCard label="RAM">
          <Kpi value={ramPercent} unit="%" thresholds={RAM_THRESHOLDS} />
          {status && (
            <span className="text-[10px] text-text-muted">
              {formatGb(status.ram_used_gb)} / {formatGb(status.ram_total_gb)}
            </span>
          )}
        </KpiCard>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <KpiCard label="DISK FREE">
          {status ? (
            <span
              className={`text-[32px] font-bold leading-none font-mono ${kpiColor(0, { warn: 50, danger: 10 })}`}
            >
              {formatGb(status.disk_free_gb)}
              <span className="text-[12px] text-text-secondary ml-1">GB</span>
            </span>
          ) : (
            <span className="text-[32px] font-bold text-text-muted leading-none font-mono">--</span>
          )}
        </KpiCard>
        <KpiCard label="SESSIONS">
          <span className="text-[32px] font-bold text-accent-500 leading-none font-mono">
            {sessionCount}
          </span>
        </KpiCard>
      </div>
    </section>
  );
});

function KpiCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="bg-linear-to-b from-base-800 to-base-900 border border-accent-500/25 rounded p-4 flex flex-col gap-1 hover:border-accent-500/40 transition-colors">
      <span className="text-[10px] font-semibold tracking-[0.15em] text-text-secondary uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function Kpi({
  value,
  unit,
  thresholds = { warn: 50, danger: 80 },
}: {
  value: number | null;
  unit: string;
  thresholds?: { warn: number; danger: number };
}): React.ReactElement {
  if (value === null) {
    return (
      <span className="text-[32px] font-bold text-text-muted leading-none font-mono">
        --<span className="text-[12px] ml-1">{unit}</span>
      </span>
    );
  }

  return (
    <span className={`text-[32px] font-bold leading-none font-mono ${kpiColor(value, thresholds)}`}>
      {value.toFixed(1)}
      <span className="text-[12px] text-text-secondary ml-1">{unit}</span>
    </span>
  );
}

export default SystemStatus;
