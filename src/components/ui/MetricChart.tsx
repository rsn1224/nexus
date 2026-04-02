import type React from 'react';
import { memo } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export interface ChartDataPoint {
  value: number;
}

interface MetricChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
}

/**
 * リアルタイム波形グラフ。recharts AreaChart ベース。
 * isAnimationActive=false で不要な再描画を抑制。
 */
const MetricChart = memo(function MetricChart({
  data,
  color = '#06b6d4',
  height = 64,
}: MetricChartProps): React.ReactElement {
  const gradientId = `grad-${color.replace('#', '')}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default MetricChart;
