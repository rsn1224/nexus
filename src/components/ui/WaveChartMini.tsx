import type React from 'react';
import { memo } from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface WaveChartProps {
  data: Array<{ time: string; value: number }>;
  color: string;
  height?: number;
}

export const WaveChart = memo(function WaveChart({
  data,
  color,
  height = 60,
}: WaveChartProps): React.ReactElement {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          animationDuration={300}
        />
        <XAxis dataKey="time" hide />
        <YAxis hide />
      </LineChart>
    </ResponsiveContainer>
  );
});
