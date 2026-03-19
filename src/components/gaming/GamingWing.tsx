import { memo, useState } from 'react';
import type { GamingSection } from '../../types/v2';
import { CpuPanel } from './CpuPanel';
import { MemoryPanel } from './MemoryPanel';
import { NetworkPanel } from './NetworkPanel';
import { OptimizeNowPanel } from './OptimizeNowPanel';
import { ProcessPanel } from './ProcessPanel';
import { TimerPanel } from './TimerPanel';
import { WindowsSettingsPanel } from './WindowsSettingsPanel';

const SECTIONS: { id: GamingSection; label: string }[] = [
  { id: 'optimize_all', label: 'OPTIMIZE ALL' },
  { id: 'windows', label: 'WINDOWS' },
  { id: 'process', label: 'PROCESS' },
  { id: 'network', label: 'NETWORK' },
  { id: 'memory', label: 'MEMORY' },
  { id: 'timer', label: 'TIMER' },
  { id: 'cpu', label: 'CPU' },
];

export const GamingWing = memo(function GamingWing() {
  const [activeSection, setActiveSection] = useState<GamingSection>('optimize_all');

  return (
    <div className="flex h-full overflow-hidden">
      <nav className="flex flex-col gap-0.5 p-2 border-r border-border-subtle shrink-0 w-32 overflow-y-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`text-left px-2 py-1.5 text-xs font-mono rounded transition-colors ${
              activeSection === s.id
                ? 'bg-accent-500/10 text-accent-500'
                : 'text-text-secondary hover:text-text-primary hover:bg-base-700/50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeSection === 'optimize_all' && <OptimizeNowPanel />}
        {activeSection === 'windows' && <WindowsSettingsPanel />}
        {activeSection === 'process' && <ProcessPanel />}
        {activeSection === 'network' && <NetworkPanel />}
        {activeSection === 'memory' && <MemoryPanel />}
        {activeSection === 'timer' && <TimerPanel />}
        {activeSection === 'cpu' && <CpuPanel />}
      </div>
    </div>
  );
});
