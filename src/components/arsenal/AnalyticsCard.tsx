import type React from 'react';
import { memo } from 'react';

interface Props {
  latencyGain: number; // in ms, negative means improvement
}

export const AnalyticsCard = memo(function AnalyticsCard({
  latencyGain,
}: Props): React.ReactElement {
  const isImprovement = latencyGain < 0;
  const displayValue = Math.abs(latencyGain);

  return (
    <div className="bg-base-700 rounded-sm border border-border-subtle p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="text-xs text-text-secondary font-mono uppercase tracking-widest">
          ANALYTICS ENGINE
        </div>
      </div>

      {/* Main metric */}
      <div className="text-center mb-4">
        <div className="text-4xl font-black text-info-500 tracking-tighter uppercase">
          {isImprovement ? '-' : '+'}
          {displayValue.toFixed(1)}MS
        </div>
        <div className="text-xs text-text-secondary font-mono uppercase tracking-widest mt-1">
          PROJECTED LATENCY {isImprovement ? 'GAIN' : 'LOSS'}
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${isImprovement ? 'bg-accent-500 pulse-node' : 'bg-warning-500'}`}
        />
        <div
          className={`text-xs font-mono uppercase tracking-wider ${
            isImprovement ? 'text-accent-500' : 'text-warning-500'
          }`}
        >
          {isImprovement ? 'OPTIMIZATION DETECTED' : 'PERFORMANCE IMPACT'}
        </div>
      </div>
    </div>
  );
});
