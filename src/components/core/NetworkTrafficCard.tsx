import type React from 'react';
import { memo } from 'react';

interface Props {
  traffic: number[]; // 8 values for 8 bars
  maxTraffic?: number;
}

export const NetworkTrafficCard = memo(function NetworkTrafficCard({
  traffic,
  maxTraffic = 100,
}: Props): React.ReactElement {
  return (
    <div className="bg-base-700 rounded-sm border border-border-subtle p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="text-xs text-text-secondary font-mono uppercase tracking-widest">
          NETWORK_TRAFFIC
        </div>
        <div className="text-sm text-accent-500 font-mono uppercase tracking-wider mt-1">
          STABLE
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between h-20 gap-1">
        {traffic.map((value) => {
          const height = (value / maxTraffic) * 100;
          const barIndex = traffic.indexOf(value);
          return (
            <div
              key={`traffic-${value}-${barIndex}`}
              className="flex-1 bg-info-500 rounded-t transition-all duration-300"
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mt-3">
        <div className="w-1.5 h-1.5 bg-accent-500 rounded-full pulse-node" />
        <div className="text-xs text-text-muted font-mono">All channels operational</div>
      </div>
    </div>
  );
});
