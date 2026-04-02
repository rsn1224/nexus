import type React from 'react';
import { memo } from 'react';
import { formatGb } from '../../lib/formatters';
import { useOptimizeStore } from '../../stores/useOptimizeStore';
import { useSystemStore } from '../../stores/useSystemStore';

function StatusItem({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex items-baseline gap-1.5" data-tauri-drag-region>
      <span
        className="text-[9px] text-text-muted tracking-[0.15em] uppercase"
        data-tauri-drag-region
      >
        {label}
      </span>
      <span className="text-[11px] font-bold font-mono text-text-primary" data-tauri-drag-region>
        {value}
      </span>
    </div>
  );
}

const TopBar = memo(function TopBar(): React.ReactElement {
  const status = useSystemStore((s) => s.status);
  const lastResult = useOptimizeStore((s) => s.lastResult);
  const isOptimized = lastResult !== null;

  return (
    <div className="flex-1 flex items-center justify-between px-4 min-w-0" data-tauri-drag-region>
      <div className="flex items-center gap-5" data-tauri-drag-region>
        <StatusItem label="CPU" value={status ? `${status.cpu_percent.toFixed(1)}%` : '--'} />
        <StatusItem label="GPU" value={status ? `${status.gpu_percent.toFixed(1)}%` : '--'} />
        <StatusItem
          label="RAM"
          value={
            status ? `${formatGb(status.ram_used_gb)} / ${formatGb(status.ram_total_gb)} GB` : '--'
          }
        />
        <StatusItem label="TEMP" value={status ? `${status.gpu_temp_c.toFixed(0)}°C` : '--'} />
      </div>
      {isOptimized && (
        <span className="shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded border border-accent-500/40 text-accent-500 tracking-wider uppercase">
          Optimized
        </span>
      )}
    </div>
  );
});

export default TopBar;
