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
    <div className="h-7 bg-nexus-bg border-t border-nexus-border flex items-center px-4 font-mono text-xs">
      {/* Left: System status */}
      <div className="flex items-center gap-2">
        <span className="text-nexus-green">●</span>
        <span className="text-nexus-text">NEXUS OS V2.0.4 - AI TELEMETRY ACTIVE</span>
      </div>

      {/* Center: Metrics */}
      <div className="flex items-center gap-6 ml-8">
        <div className="flex items-center gap-2">
          <span className="text-nexus-label">LATENCY:</span>
          <span className="text-nexus-text">14MS</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-nexus-label">CORE_TEMP:</span>
          <span className="text-nexus-text">{tempC}C</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-nexus-label">MEM_OPT:</span>
          <span className="text-nexus-green">{ramPercent}%</span>
        </div>
      </div>

      {/* Right: Status */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-nexus-green">●</span>
        <span className="text-nexus-cyan">SYSTEM_LINK_ACTIVE</span>
      </div>
    </div>
  );
});
