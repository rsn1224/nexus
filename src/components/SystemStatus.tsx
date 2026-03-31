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
        <StatCard label="CPU">
          <StatValue value={status?.cpu_percent ?? null} unit="%" thresholds={CPU_THRESHOLDS} />
        </StatCard>
        <StatCard label="GPU">
          <StatValue value={status?.gpu_percent ?? null} unit="%" thresholds={GPU_THRESHOLDS} />
        </StatCard>
        <StatCard label="GPU TEMP">
          <StatValue value={status?.gpu_temp_c ?? null} unit="°C" thresholds={TEMP_THRESHOLDS} />
        </StatCard>
        <StatCard label="RAM">
          <StatValue value={ramPercent} unit="%" thresholds={RAM_THRESHOLDS} />
          {status && (
            <p className="text-xs text-text-muted mt-1">
              {formatGb(status.ram_used_gb)} / {formatGb(status.ram_total_gb)}
            </p>
          )}
        </StatCard>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <StatCard label="DISK FREE">
          {status ? (
            <p
              className={`text-[32px] font-bold leading-none font-mono mt-2 ${kpiColor(0, { warn: 50, danger: 10 })}`}
            >
              {formatGb(status.disk_free_gb)}
              <span className="text-xs text-text-secondary ml-1">GB</span>
            </p>
          ) : (
            <p className="text-[32px] font-bold text-text-muted leading-none font-mono mt-2">--</p>
          )}
        </StatCard>
        <StatCard label="SESSIONS">
          <p className="text-[32px] font-bold text-accent-500 leading-none font-mono mt-2">
            {sessionCount}
          </p>
        </StatCard>
      </div>
    </section>
  );
});

function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="bg-base-800 border border-accent-500/25 rounded p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">{label}</p>
      {children}
    </div>
  );
}

function StatValue({
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
      <p className="text-[32px] font-bold text-text-muted leading-none font-mono mt-2">
        --<span className="text-xs ml-1">{unit}</span>
      </p>
    );
  }

  return (
    <p
      className={`text-[32px] font-bold leading-none font-mono mt-2 ${kpiColor(value, thresholds)}`}
    >
      {value.toFixed(1)}
      <span className="text-xs text-text-secondary ml-1">{unit}</span>
    </p>
  );
}

export default SystemStatus;
