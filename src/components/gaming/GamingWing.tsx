import { memo, useState } from 'react';
import { usePulseStore } from '../../stores/usePulseStore';
import type { GamingSection } from '../../types/v2';
import { CpuPanel } from './CpuPanel';
import { MemoryPanel } from './MemoryPanel';
import { NetworkPanel } from './NetworkPanel';
import { OptimizeNowPanel } from './OptimizeNowPanel';
import { ProcessPanel } from './ProcessPanel';
import { TimerPanel } from './TimerPanel';
import { WindowsSettingsPanel } from './WindowsSettingsPanel';

const TABS: { id: GamingSection; label: string; jpLabel: string; icon: string }[] = [
  { id: 'optimize_all', label: 'OPTIMIZE', jpLabel: '最適化', icon: 'bolt' },
  { id: 'windows', label: 'WINDOWS', jpLabel: 'ウィンドウズ', icon: 'window' },
  { id: 'process', label: 'PROCESS', jpLabel: 'プロセス', icon: 'memory' },
  { id: 'network', label: 'NETWORK', jpLabel: 'ネットワーク', icon: 'lan' },
  { id: 'memory', label: 'MEMORY', jpLabel: 'メモリ', icon: 'developer_board' },
  { id: 'timer', label: 'TIMER', jpLabel: 'タイマー', icon: 'timer' },
  { id: 'cpu', label: 'CPU', jpLabel: 'プロセッサ', icon: 'speed' },
];

export const GamingWing = memo(function GamingWing() {
  const [activeSection, setActiveSection] = useState<GamingSection>('optimize_all');
  const snapshots = usePulseStore((s) => s.snapshots);
  const latest = snapshots[snapshots.length - 1];
  const cpuTemp = latest?.cpuTempC ?? null;
  const memPct = latest ? Math.round((latest.memUsedMb / latest.memTotalMb) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Hero Header */}
      <header className="flex items-end justify-between px-6 pt-6 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] text-accent-500 font-light tracking-[0.3em] uppercase">
              Tactical_Advantage_Module
            </span>
            <div className="h-px grow bg-linear-to-r from-accent-500/50 to-transparent" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-text-primary uppercase leading-none">
            ARSENAL <span className="text-info-500">WING</span>
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-accent-500 tracking-[0.2em] blink-fast uppercase">
            {'CMD_READY // SYSTEM_STABLE'}
          </span>
        </div>
      </header>

      {/* Horizontal Tab Bar */}
      <div className="flex items-center gap-6 px-6 pt-4 pb-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveSection(t.id)}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-all whitespace-nowrap ${
              activeSection === t.id
                ? 'border-info-500 text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-white/20'
            }`}
          >
            <span className="text-sm font-bold tracking-tight uppercase">{t.label}</span>
            <span className="text-[10px] text-text-muted font-light">{t.jpLabel}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeSection === 'optimize_all' && <OptimizeNowPanel />}
        {activeSection === 'windows' && <WindowsSettingsPanel />}
        {activeSection === 'process' && <ProcessPanel />}
        {activeSection === 'network' && <NetworkPanel />}
        {activeSection === 'memory' && <MemoryPanel />}
        {activeSection === 'timer' && <TimerPanel />}
        {activeSection === 'cpu' && <CpuPanel />}
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="grid grid-cols-2 gap-3 px-6 py-3 border-t border-white/5">
        <div className="piano-surface p-3 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-warning-500 font-light tracking-[0.2em] uppercase mb-1">
            CORE_TEMP
          </span>
          <span className="text-2xl font-black text-text-primary tracking-tighter">
            {cpuTemp != null ? cpuTemp.toFixed(0) : '—'}
            <span className="text-sm">°C</span>
          </span>
        </div>
        <div className="piano-surface p-3 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-accent-500 font-light tracking-[0.2em] uppercase mb-1">
            MEM_UTIL
          </span>
          <span className="text-2xl font-black text-text-primary tracking-tighter">
            {memPct}
            <span className="text-sm">%</span>
          </span>
        </div>
      </div>
    </div>
  );
});
