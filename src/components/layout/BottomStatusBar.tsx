import type React from 'react';
import { memo } from 'react';
import { usePulseStore } from '../../stores/usePulseStore';

const BottomStatusBar = memo(function BottomStatusBar(): React.ReactElement {
  const snap = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );

  const cpuPct = snap?.cpuPercent ?? null;
  const ramGb = snap !== null && snap.memTotalMb > 0 ? (snap.memUsedMb / 1024).toFixed(1) : null;
  const netKb = snap !== null ? Math.round((snap.netRecvKb + snap.netSentKb) / 2) : null;
  const tempC = snap?.cpuTempC ?? null;

  const cpuHigh = cpuPct !== null && cpuPct >= 80;
  const tempHigh = tempC !== null && tempC >= 80;

  return (
    <div className="h-10 shrink-0 bg-base-950/95 border-t border-white/5 flex items-center px-4 gap-6 font-mono text-[10px] tracking-[0.2em]">
      {/* CPU */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 uppercase">CPU</span>
        <span className={cpuHigh ? 'text-danger-500 bloom-red' : 'text-accent-500 bloom-razer'}>
          {cpuPct !== null ? `${Math.round(cpuPct)}%` : '--'}
        </span>
      </div>

      <div className="w-px h-4 bg-white/10" />

      {/* RAM */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 uppercase">RAM</span>
        <span className="text-accent-500">{ramGb !== null ? `${ramGb}GB` : '--'}</span>
      </div>

      <div className="w-px h-4 bg-white/10" />

      {/* NET */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 uppercase">NET</span>
        <span className="text-info-500">{netKb !== null ? `${netKb}KB/S` : '--'}</span>
      </div>

      <div className="w-px h-4 bg-white/10" />

      {/* TEMP */}
      <div className="flex items-center gap-2">
        <span className="text-white/30 uppercase">TEMP</span>
        <span className={tempHigh ? 'text-danger-500 bloom-red' : 'text-warning-500'}>
          {tempC !== null ? `${Math.round(tempC)}°C` : '--'}
        </span>
      </div>

      <div className="flex-1" />

      {/* Right: status indicator */}
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-accent-500 pulse-node" />
        <span className="text-[8px] text-white/20 tracking-[0.3em] uppercase">NEXUS ONLINE</span>
      </div>
    </div>
  );
});

export default BottomStatusBar;
