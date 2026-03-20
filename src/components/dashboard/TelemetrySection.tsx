import type React from 'react';
import { memo } from 'react';
import TelemetryBentoCard from './TelemetryBentoCard';

interface Props {
  cpuUsage: number;
  cpuTemp: number;
  memUsed: string;
  memTotal: string;
}

function getThreshold(
  value: number,
  warnAt: number,
  critAt: number,
): { barColor: string; glowClass: string; statusColor: string } {
  if (value > critAt)
    return { barColor: 'bg-danger-500', glowClass: 'glow-red', statusColor: 'text-danger-500' };
  if (value > warnAt)
    return {
      barColor: 'bg-warning-500',
      glowClass: 'glow-warm',
      statusColor: 'text-warning-500',
    };
  return { barColor: 'bg-accent-500', glowClass: 'glow-green', statusColor: 'text-accent-500' };
}

const TelemetrySection = memo(function TelemetrySection({
  cpuUsage,
  cpuTemp,
  memUsed,
  memTotal,
}: Props): React.ReactElement {
  const cpu = getThreshold(cpuUsage, 60, 80);
  const gpu = getThreshold(cpuTemp, 70, 80);
  const memPct = (parseFloat(memUsed) / parseFloat(memTotal)) * 100;

  return (
    <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-panel p-6 border-l-4 border-accent-500 hover:bg-accent-500/10 transition-all duration-500 relative">
        <TelemetryBentoCard
          icon="memory"
          category="Processor"
          title="CPU LOAD"
          value={cpuUsage.toFixed(0)}
          unit="%"
          barPercent={cpuUsage}
          barColor={cpu.barColor}
          glowClass={cpu.glowClass}
          detail="CORE_01: 4.2GHz"
          status={cpuUsage > 80 ? 'HIGH LOAD' : cpuUsage > 60 ? 'MODERATE' : 'OPTIMAL'}
          statusColor={cpu.statusColor}
        />
      </div>

      <div className="glass-panel p-6 border-l-4 border-transparent hover:border-info-500/60 hover:bg-info-500/10 transition-all duration-500 relative">
        <TelemetryBentoCard
          icon="device_thermostat"
          category="Graphics"
          title="GPU TEMP"
          value={cpuTemp.toFixed(0)}
          unit="C"
          barPercent={cpuTemp}
          barColor={gpu.barColor}
          glowClass={gpu.glowClass}
          detail="GPU_01: 1.8GHz"
          status={cpuTemp > 80 ? 'OVERHEAT' : cpuTemp > 70 ? 'WARM' : 'HEALTHY'}
          statusColor={gpu.statusColor}
        />
      </div>

      <div className="glass-panel p-6 border-l-4 border-transparent hover:border-info-500/60 hover:bg-info-500/10 transition-all duration-500 relative">
        <TelemetryBentoCard
          icon="storage"
          category="Memory"
          title="RAM USAGE"
          value={memUsed}
          unit="GB"
          barPercent={memPct}
          barColor="bg-accent-500"
          glowClass="glow-green"
          detail={`Total: ${memTotal}GB`}
          status="HEALTHY"
          statusColor="text-accent-500"
        />
      </div>
    </div>
  );
});

export default TelemetrySection;
