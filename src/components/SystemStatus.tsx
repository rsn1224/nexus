import type React from 'react';
import { memo } from 'react';
import { formatGb } from '../lib/formatters';
import { useSystemStatus } from '../stores/useSystemStore';
import SectionHeader from './ui/SectionHeader';
import StatusBadge from './ui/StatusBadge';

const CPU_THRESHOLDS = { warn: 70, danger: 90 };
const GPU_THRESHOLDS = { warn: 70, danger: 90 };
const TEMP_THRESHOLDS = { warn: 80, danger: 95 };

const SystemStatus = memo(function SystemStatus(): React.ReactElement {
  const { status } = useSystemStatus();

  const ramPercent =
    status && status.ram_total_gb > 0 ? (status.ram_used_gb / status.ram_total_gb) * 100 : null;

  return (
    <section aria-label="システムステータス">
      <SectionHeader title="SYSTEM STATUS" color="muted" />
      <div className="grid grid-cols-3 gap-2 mt-2">
        <KpiCell label="CPU">
          <StatusBadge value={status?.cpu_percent ?? null} unit="%" thresholds={CPU_THRESHOLDS} />
        </KpiCell>
        <KpiCell label="GPU">
          <StatusBadge value={status?.gpu_percent ?? null} unit="%" thresholds={GPU_THRESHOLDS} />
        </KpiCell>
        <KpiCell label="GPU TEMP">
          <StatusBadge value={status?.gpu_temp_c ?? null} unit="°C" thresholds={TEMP_THRESHOLDS} />
        </KpiCell>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <KpiCell label="RAM">
          {status ? (
            <div className="flex flex-col gap-0.5">
              <StatusBadge value={ramPercent} unit="%" thresholds={{ warn: 80, danger: 90 }} />
              <span className="text-[10px] text-text-muted">
                {formatGb(status.ram_used_gb)} / {formatGb(status.ram_total_gb)}
              </span>
            </div>
          ) : (
            <StatusBadge value={null} unit="%" />
          )}
        </KpiCell>
        <KpiCell label="DISK FREE">
          {status ? (
            <span className="text-[24px] font-bold text-success-500">
              {formatGb(status.disk_free_gb)}
            </span>
          ) : (
            <StatusBadge value={null} unit="GB" />
          )}
        </KpiCell>
      </div>
    </section>
  );
});

function KpiCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-1">
      <span className="text-[10px] font-semibold tracking-[0.12em] text-text-muted uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

export default SystemStatus;
