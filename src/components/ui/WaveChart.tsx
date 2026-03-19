import type React from 'react';
import { memo } from 'react';

interface WaveChartProps {
  data: number[];
  label: string;
  maxValue?: number;
  className?: string;
}

export const WaveChart = memo(function WaveChart({
  data,
  label,
  maxValue = 1,
  className = '',
}: WaveChartProps): React.ReactElement {
  const maxDataValue = Math.max(...data, 1);
  const intensity = data.reduce((sum, val) => sum + val, 0) / data.length / maxValue;

  return (
    <div className={`bg-nexus-surface border border-nexus-border p-4 ${className}`}>
      {/* Header */}
      <div className="font-mono text-xs text-nexus-label uppercase mb-3">
        {label}: {intensity.toFixed(2)}A
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between h-20 gap-1">
        {data.map((value) => {
          const height = (value / maxDataValue) * 100;
          const opacity = 0.3 + (value / maxDataValue) * 0.7;

          return (
            <div
              key={`bar-${height.toFixed(2)}`}
              className="flex-1 bg-nexus-green rounded-t transition-all duration-300"
              style={{
                height: `${height}%`,
                backgroundColor: `rgba(68, 214, 44, ${opacity})`,
              }}
            />
          );
        })}
      </div>

      {/* Grid Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }}
        role="img"
        aria-label="grid lines"
      >
        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={`h-${y}`}
            x1="0"
            y1={`${y}%`}
            x2="100%"
            y2={`${y}%`}
            stroke="var(--color-nexus-border)"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}

        {/* Vertical grid lines */}
        {data.map((_, index) => {
          const x = (index / (data.length - 1)) * 100;
          return (
            <line
              key={`v-${x.toFixed(0)}`}
              x1={`${x}%`}
              y1="0"
              x2={`${x}%`}
              y2="100%"
              stroke="var(--color-nexus-border)"
              strokeWidth="1"
              opacity="0.3"
            />
          );
        })}
      </svg>
    </div>
  );
});

// Circular Gauge Component
interface CircularGaugeProps {
  value: number; // 0-100
  maxValue?: number;
  label?: string;
  size?: number;
  className?: string;
}

export const CircularGauge = memo(function CircularGauge({
  value,
  maxValue = 100,
  label,
  size = 80,
  className = '',
}: CircularGaugeProps): React.ReactElement {
  const percentage = (value / maxValue) * 100;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        role="img"
        aria-label="circular gauge"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-nexus-border)"
          strokeWidth="4"
          fill="none"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-nexus-green)"
          strokeWidth="4"
          fill="none"
          strokeDasharray={strokeDasharray}
          className="transition-all duration-500"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-sm text-nexus-green">
          {Math.round(percentage)}%
        </span>
        {label && <span className="font-mono text-xs text-nexus-label uppercase">{label}</span>}
      </div>
    </div>
  );
});

// Decrypting Spinner Component
interface DecryptingSpinnerProps {
  className?: string;
}

export const DecryptingSpinner = memo(function DecryptingSpinner({
  className = '',
}: DecryptingSpinnerProps): React.ReactElement {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-mono text-xs text-nexus-label animate-pulse">DECRYPTING...</span>
      <div className="w-2 h-2 bg-nexus-green rounded-full animate-pulse" />
    </div>
  );
});
