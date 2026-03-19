import React from 'react';
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
        ? 'text-accent-400'
        : 'text-text-secondary';
  const isSelected = selectedPid === process.pid;

  return (
    <React.Fragment>
      <tr
        className={`cursor-pointer transition-colors duration-100 hover:bg-white/4 ${
          isSelected ? 'bg-base-900/10 border-l-2 border-accent-500' : ''
        } ${index % 2 === 0 ? 'bg-white/2' : ''}`}
        onClick={() => onRowClick(process.pid)}
      >
        <td className="px-3 py-[5px] text-[12px] text-text-primary">{process.name}</td>
        <td className={`px-3 py-[5px] font-mono text-[12px] text-right ${cpuColor}`}>
          {process.cpuPercent.toFixed(1)}%
        </td>
        <td className="px-3 py-[5px] font-mono text-[12px] text-right text-text-primary">
          {formatMemory(process.memMb)}
        </td>
        <td className="px-3 py-[5px] font-mono text-[12px] text-right text-text-primary">
          {formatDiskIO(process.diskReadKb)}
        </td>
        <td className="px-3 py-[5px] font-mono text-[12px] text-right text-text-primary">
          {formatDiskIO(process.diskWriteKb)}
        </td>
        <td className="px-3 py-[5px] text-[12px]">
          {status === 'target' ? (
            <span className="inline-block px-1 py-0.5 border border-accent-500 text-accent-500 text-xs">
              [TARGET]
            </span>
          ) : status === 'protected' ? (
            <span className="inline-block px-1 py-0.5 border border-text-muted text-text-muted text-xs">
              [PROT]
            </span>
          ) : (
            <span className="text-text-muted">─</span>
          )}
        </td>
      </tr>

      {isSelected && (
        <tr>
          <td colSpan={6} className="px-3 py-2 bg-base-700">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">PRIORITY:</span>
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
