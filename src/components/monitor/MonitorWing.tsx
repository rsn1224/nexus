import type React from 'react';
import { useEffect, useRef } from 'react';
import { usePulseStore } from '../../stores/usePulseStore';
import { KpiCard } from './KpiCard';
import ProcessList from './ProcessList';
import SystemMetrics from './SystemMetrics';

interface ProcessItem {
  id: string;
  name: string;
  status: 'normal' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  color: string;
}

export default function MonitorWing(): React.ReactElement {
  const snapshots = usePulseStore((s) => s.snapshots);
  const subscribe = usePulseStore((s) => s.subscribe);
  const unsubscribe = usePulseStore((s) => s.unsubscribe);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    void subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  const latest = snapshots[snapshots.length - 1];
  const cpuPct = latest?.cpuPercent ?? 0;
  const cpuTemp = latest?.cpuTempC ?? null;
  const netKb = latest?.netRecvKb ?? 0;
  const memPct = latest ? Math.round((latest.memUsedMb / latest.memTotalMb) * 100) : 0;
  const uptimeSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

  const processes: ProcessItem[] = [
    {
      id: 'P-2847',
      name: 'nexus.exe',
      status: 'normal',
      cpu: 12,
      memory: 256,
      color: 'green',
    },
    {
      id: 'P-1932',
      name: 'chrome.exe',
      status: 'warning',
      cpu: 8,
      memory: 512,
      color: 'amber',
    },
    {
      id: 'P-0821',
      name: 'system.exe',
      status: 'critical',
      cpu: 45,
      memory: 128,
      color: 'red',
    },
    {
      id: 'P-4456',
      name: 'discord.exe',
      status: 'normal',
      cpu: 3,
      memory: 192,
      color: 'green',
    },
  ];

  return (
    <div className="min-h-screen bg-base-900 p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scanline-overlay"></div>
        <div className="scanning-line animate-pulse opacity-20"></div>
        <div className="absolute top-[20%] left-[20%] w-96 h-96 rounded-full bg-accent-500/2 blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 rounded-full bg-warning-500/1 blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="mb-14 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-px w-12 bg-accent-500"></div>
              <span className="font-label text-accent-500 text-[10px] tracking-[0.3em] font-bold">
                MONITOR_MODULE_02
              </span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-text-primary mb-2">
              TACTICS{' '}
              <span className="text-accent-500 drop-shadow-[0_0_15px_rgba(68,214,44,0.3)]">
                WING
              </span>
            </h1>
            <p className="font-label text-text-secondary/40 text-[10px] tracking-[0.2em] uppercase">
              System Status: OPTIMAL {/* */} {/* Uptime: */}
              {Math.floor(uptimeSeconds / 3600)}H
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative group">
              <span className="absolute -top-5 right-0 font-label text-[8px] text-warning-500/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-widest">
                [リフレッシュ中]
              </span>
              <button
                type="button"
                className="relative group px-6 py-2.5 border border-text-secondary/20 text-text-secondary/60 hover:text-warning-500 hover:border-warning-500/50 font-label text-[10px] tracking-widest uppercase transition-all bg-white/2 glass-panel"
              >
                <div className="hud-btn-scan"></div>
                リフレッシュ
              </button>
            </div>
            <div className="relative group">
              <span className="absolute -top-5 right-0 font-label text-[8px] text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse whitespace-nowrap tracking-widest">
                [最適化済み]
              </span>
              <button
                type="button"
                className="relative px-8 py-2.5 bg-accent-500/10 border border-accent-500 text-accent-500 font-black text-[10px] tracking-widest uppercase transition-all hover:bg-accent-500/20 glass-panel"
              >
                <div className="scanning-line animate-pulse opacity-20"></div>
                最適化
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* KPI Cards */}
          <div className="md:col-span-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <KpiCard
                label="CPU Usage"
                value={`${cpuPct}`}
                unit="%"
                percent={cpuPct}
                color="accent"
                moduleId="CPU_001"
              />
              <KpiCard
                label="Memory"
                value={`${memPct}`}
                unit="%"
                percent={memPct}
                color="warning"
                moduleId="MEM_001"
              />
              <KpiCard
                label="Network"
                value={`${netKb}`}
                unit="KB/s"
                percent={Math.min((netKb / 1000) * 100, 100)}
                color="accent"
                moduleId="NET_001"
              />
              <KpiCard
                label="Temperature"
                value={cpuTemp ? `${cpuTemp}` : 'N/A'}
                unit="°C"
                percent={cpuTemp ? Math.min((cpuTemp / 100) * 100, 100) : 0}
                color={cpuTemp && cpuTemp > 70 ? 'warning' : 'accent'}
                moduleId="TEMP_001"
              />
            </div>
          </div>

          {/* System Metrics */}
          <div className="md:col-span-12">
            <SystemMetrics
              cpu={cpuPct}
              memory={Math.round((latest?.memUsedMb ?? 0) / 1024)}
              latency="0.02ms"
              bandwidth="1.2Gbps"
            />
          </div>

          {/* Process List */}
          <div className="md:col-span-12">
            <ProcessList processes={processes} />
          </div>
        </div>
      </div>
    </div>
  );
}
