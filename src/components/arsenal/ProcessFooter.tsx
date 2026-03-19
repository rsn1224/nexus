import type React from 'react';
import { memo } from 'react';

interface Props {
  processName?: string;
  cpuUsage?: number;
  coreTemp?: number;
  memUtil?: number;
}

export const ProcessFooter = memo(function ProcessFooter({
  processName = 'Core_Optimizer.exe',
  cpuUsage = 45,
  coreTemp = 42,
  memUtil = 98,
}: Props): React.ReactElement {
  return (
    <div className="px-6 py-3 bg-nexus-surface border-t border-nexus-border">
      <div className="flex items-center justify-between text-xs font-mono">
        {/* Process name and usage bar */}
        <div className="flex items-center gap-4">
          <div className="text-nexus-label uppercase tracking-widest">
            PROCESS_LOAD_DISTRIBUTION
          </div>

          <div className="flex items-center gap-2">
            <span className="text-nexus-text">{processName}</span>
            <div className="flex items-center gap-1">
              {/* Usage bar visualization */}
              <div className="w-20 bg-nexus-surface2 rounded-full h-2">
                <div className="h-2 bg-nexus-cyan rounded-full" style={{ width: `${cpuUsage}%` }} />
              </div>
              <span className="text-nexus-cyan">█</span>
              <span className="text-nexus-cyan">░</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-nexus-label">CORE_TEMP:</span>
            <span className="text-nexus-text">{coreTemp}℃</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-nexus-label">MEM_UTIL</span>
            <span className="text-nexus-green">{memUtil}%</span>
          </div>
        </div>
      </div>
    </div>
  );
});
