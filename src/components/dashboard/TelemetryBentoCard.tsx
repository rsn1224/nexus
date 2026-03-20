import type React from 'react';
import { memo } from 'react';

interface TelemetryBentoCardProps {
  icon: string; // Material Symbol 名
  category: string; // "Processor" / "Graphics" / "Memory"
  title: string; // "CPU LOAD" / "GPU TEMP" / "RAM USAGE"
  value: string; // "42" / "74" / "12.8"
  unit: string; // "%" / "C" / "GB"
  barPercent: number; // 0-100
  barColor: string; // Tailwind class
  glowClass: string; // glow class
  detail: string; // "CORE_01: 4.2GHz"
  status: string; // "OPTIMAL" / "HIGH LOAD" / "HEALTHY"
  statusColor: string; // Tailwind text color
}

const TelemetryBentoCard = memo(function TelemetryBentoCard({
  icon,
  category,
  title,
  value,
  unit,
  barPercent,
  barColor,
  glowClass,
  detail,
  status,
  statusColor,
}: TelemetryBentoCardProps): React.ReactElement {
  return (
    <div className={`glass-panel bloom-border p-6 relative overflow-hidden group ${glowClass}`}>
      {/* Top Right Icon */}
      <div className="absolute top-6 right-6">
        <span
          className="material-symbols-outlined text-[20px] text-white/30 group-hover:text-accent-500 transition-colors"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      {/* Category */}
      <div className="text-[10px] tracking-widest text-white/60 uppercase mb-1">{category}</div>

      {/* Title */}
      <div className="text-lg font-bold tracking-tight mb-2">{title}</div>

      {/* Value + Unit */}
      <div className="flex items-baseline gap-1 mb-4">
        <div className="text-4xl font-data">{value}</div>
        <div className="text-xl font-data text-white/40">{unit}</div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${barPercent}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[10px] font-data text-white/40">
        <div>{detail}</div>
        <div className={statusColor}>{status}</div>
      </div>
    </div>
  );
});

export default TelemetryBentoCard;
