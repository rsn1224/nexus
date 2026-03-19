import React from 'react';
import { progressWidth } from '../../lib/styles';
import type { SystemProcess } from '../../types';
import { Button } from '../ui';
import { formatDiskIO, formatMemory } from './ProcessTable';

const PROTECTED_PROCESS_NAMES = new Set([
  'system',
  'smss.exe',
  'csrss.exe',
  'wininit.exe',
  'winlogon.exe',
  'lsass.exe',
  'services.exe',
  'svchost.exe',
]);

function getProcessStatus(p: SystemProcess, threshold: number): 'target' | 'protected' | 'normal' {
  if (PROTECTED_PROCESS_NAMES.has(p.name.toLowerCase())) return 'protected';
  if (p.cpuPercent >= threshold && p.canTerminate) return 'target';
  return 'normal';
}

function getCpuBarColor(pct: number): string {
  if (pct >= 50) return 'bg-danger-500';
  if (pct >= 20) return 'bg-warm-500';
  return 'bg-accent-500';
}

interface ProcessRowProps {
  process: SystemProcess;
  index: number;
  threshold: number;
  selectedPid: number | null;
  onRowClick: (pid: number) => void;
  onPriority: (pid: number, priority: 'high' | 'normal' | 'idle') => void;
  onKillRequest: (pid: number, name: string) => void;
}

export default function ProcessRow({
  process,
  index,
  threshold,
  selectedPid,
  onRowClick,
  onPriority,
  onKillRequest,
}: ProcessRowProps): React.ReactElement {
  const status = getProcessStatus(process, threshold);
  const cpuColor =
    process.cpuPercent >= 50
      ? 'text-danger-500'
      : process.cpuPercent >= 20
        ? 'text-warm-400'
        : 'text-text-secondary';
  const isSelected = selectedPid === process.pid;

  return (
    <React.Fragment>
      <tr
        className={`cursor-pointer transition-colors duration-100 hover:bg-white/[0.04] ${
          isSelected ? 'bg-accent-500/5 border-l-2 border-accent-500' : ''
        } ${index % 2 === 0 ? 'bg-white/[0.01]' : ''}`}
        onClick={() => onRowClick(process.pid)}
      >
        <td className="px-3 py-[5px] text-xs text-text-primary">{process.name}</td>
        <td className="px-3 py-[5px] w-32">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-base-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${getCpuBarColor(process.cpuPercent)}`}
                style={progressWidth(Math.min(process.cpuPercent, 100))}
              />
            </div>
            <span className={`font-mono text-xs w-10 text-right ${cpuColor}`}>
              {process.cpuPercent.toFixed(1)}%
            </span>
          </div>
        </td>
        <td className="px-3 py-[5px] font-mono text-xs text-right text-text-primary">
          {formatMemory(process.memMb)}
        </td>
        <td className="px-3 py-[5px] font-mono text-xs text-right text-text-primary">
          {formatDiskIO(process.diskReadKb)}
        </td>
        <td className="px-3 py-[5px] font-mono text-xs text-right text-text-primary">
          {formatDiskIO(process.diskWriteKb)}
        </td>
        <td className="px-3 py-[5px] text-xs">
          {status === 'target' ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-warm-500/15 border border-warm-500/40 text-warm-400 text-[10px] font-bold uppercase">
              TARGET
            </span>
          ) : status === 'protected' ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-base-700 border border-white/[0.08] text-text-muted text-[10px] font-bold uppercase">
              PROT
            </span>
          ) : (
            <span className="text-text-muted">─</span>
          )}
        </td>
      </tr>

      {isSelected && (
        <tr>
          <td colSpan={6} className="px-3 py-2 bg-base-700/60 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted uppercase tracking-wide">PRIORITY:</span>
              <Button size="sm" variant="secondary" onClick={() => onPriority(process.pid, 'high')}>
                HIGH
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onPriority(process.pid, 'normal')}
              >
                NORMAL
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onPriority(process.pid, 'idle')}>
                IDLE
              </Button>
              <div className="w-px h-4 bg-border-subtle mx-1" />
              <Button
                size="sm"
                variant="danger"
                onClick={() => onKillRequest(process.pid, process.name)}
                disabled={!process.canTerminate}
              >
                ✕ KILL
              </Button>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
