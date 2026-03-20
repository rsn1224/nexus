import type React from 'react';
import { memo } from 'react';

interface Props {
  ramPercent?: number;
  tempC?: number;
}

export const StatusBar = memo(function StatusBar({
  ramPercent = 0,
  tempC = 0,
}: Props): React.ReactElement {
  return (
    <div className="h-7 bg-base-900 border-t border-border-subtle flex items-center px-4 font-mono text-xs">
      {/* Left: System status */}
      <div className="flex items-center gap-2">
        <span className="text-accent-500">●</span>
        <span className="text-text-primary">NEXUS OS V2.0.4 - AI TELEMETRY ACTIVE</span>
      </div>

      {/* Center: Metrics */}
      <div className="flex items-center gap-6 ml-8">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">LATENCY:</span>
          <span className="text-text-primary">14MS</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text-secondary">CORE_TEMP:</span>
          <span className="text-text-primary">{tempC}C</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text-secondary">MEM_OPT:</span>
          <span className="text-accent-500">{ramPercent}%</span>
        </div>
      </div>

      {/* Right: Status */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-accent-500">●</span>
        <span className="text-info-500">SYSTEM_LINK_ACTIVE</span>
      </div>
    </div>
  );
});
