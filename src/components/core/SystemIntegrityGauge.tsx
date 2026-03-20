import type React from 'react';
import { memo } from 'react';

interface Props {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export const SystemIntegrityGauge = memo(function SystemIntegrityGauge({
  value,
  size = 240,
  strokeWidth = 8,
}: Props): React.ReactElement {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* SVG Circle Gauge */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 transform -rotate-90"
        style={{ filter: 'drop-shadow(0 0 12px #00e5ff)' }}
      >
        <title>System Integrity Gauge: {value}%</title>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress gradient */}
        <defs>
          <linearGradient id="integrityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#39ff14" />
          </linearGradient>
        </defs>

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#integrityGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="text-center flex flex-col items-center justify-center">
        <div className="font-black text-6xl text-white tracking-tighter">{value}</div>
        <div className="text-xs text-text-secondary uppercase tracking-widest mt-1">
          システム整合性
        </div>

        {/* Status badge */}
        <div className="mt-4 px-3 py-1 bg-base-600 text-accent-500 font-mono text-xs rounded-full flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-accent-500 rounded-full pulse-node" />
          OPTIMIZED
        </div>
      </div>
    </div>
  );
});
