import type React from 'react';
import { useMemo } from 'react';
import { useOpsStore } from '../../stores/useOpsStore';
import type { SystemProcess } from '../../types';
import { Card } from '../ui';

function getTopCpuProcesses(processes: SystemProcess[], limit: number = 3): SystemProcess[] {
  return [...processes].sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, limit);
}

export default function OpsCard(): React.ReactElement {
  const processes = useOpsStore((s) => s.processes);

  const activeProcessCount = useMemo(
    () => processes.filter((p: SystemProcess) => p.cpuPercent > 1).length,
    [processes],
  );

  const topProcesses = useMemo(() => getTopCpuProcesses(processes, 3), [processes]);

  return (
    <Card title="プロセス管理">
      <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
        <div className="mb-1">
          アクティブ: <span className="text-[var(--color-accent-500)]">{activeProcessCount}</span>
        </div>
        {topProcesses.length > 0 && (
          <div className="text-[10px] text-[var(--color-text-muted)]">
            CPU上位:
            {topProcesses.map((p: SystemProcess) => (
              <div key={p.pid} className="ml-2">
                {p.name} ({p.cpuPercent.toFixed(1)}%)
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
