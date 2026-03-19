import type React from 'react';
import { useMemo } from 'react';
import { progressWidth } from '../../lib/styles';
import { useOpsStore } from '../../stores/useOpsStore';
import type { SystemProcess } from '../../types';
import { Card } from '../ui';

function getTopCpuProcesses(processes: SystemProcess[], limit: number = 5): SystemProcess[] {
  return [...processes].sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, limit);
}

function getCpuBarColor(pct: number): string {
  if (pct >= 50) return 'bg-danger-500';
  if (pct >= 20) return 'bg-warm-500';
  return 'bg-accent-500';
}

function getCpuTextColor(pct: number): string {
  if (pct >= 50) return 'text-danger-500';
  if (pct >= 20) return 'text-warm-400';
  return 'text-text-secondary';
}

export default function OpsCard(): React.ReactElement {
  const processes = useOpsStore((s) => s.processes);

  const activeProcessCount = useMemo(
    () => processes.filter((p: SystemProcess) => p.cpuPercent > 1).length,
    [processes],
  );

  const topProcesses = useMemo(() => getTopCpuProcesses(processes, 5), [processes]);

  return (
    <Card title="CPU TOP PROCESSES" accentColor="warm">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted uppercase tracking-widest font-semibold">
            Active processes
          </span>
          <span className="text-xs font-bold font-mono text-warm-400">{activeProcessCount}</span>
        </div>
        {topProcesses.length > 0 ? (
          topProcesses.map((p: SystemProcess) => (
            <div key={p.pid} className="flex items-center gap-2">
              <span className="text-sm text-text-secondary w-28 truncate">{p.name}</span>
              <div className="flex-1 h-1 bg-base-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getCpuBarColor(p.cpuPercent)}`}
                  style={progressWidth(Math.min(p.cpuPercent * 2, 100))}
                />
              </div>
              <span
                className={`font-mono text-xs w-10 text-right ${getCpuTextColor(p.cpuPercent)}`}
              >
                {p.cpuPercent.toFixed(1)}%
              </span>
            </div>
          ))
        ) : (
          <div className="text-xs text-text-muted py-2">NO DATA</div>
        )}
      </div>
    </Card>
  );
}
