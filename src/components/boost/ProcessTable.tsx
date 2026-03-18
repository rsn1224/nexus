import React from 'react';
import type { SystemProcess } from '../../types';
import { Button, EmptyState, LoadingState } from '../ui';

// ─── 型定義 ─────────────────────────────────────────────────────────────────

export type ProcessSortKey = 'name' | 'cpu' | 'mem' | 'diskRead' | 'diskWrite';

export interface ProcessTableProps {
  processes: SystemProcess[];
  filteredProcesses: SystemProcess[];
  sortedProcesses: SystemProcess[];
  filterText: string;
  targetCount: number;
  threshold: number;
  isLoading: boolean;
  sortKey: ProcessSortKey;
  sortDirection: 'asc' | 'desc';
  onSort: (key: ProcessSortKey) => void;
  selectedPid: number | null;
  onRowClick: (pid: number) => void;
  onPriority: (pid: number, priority: 'high' | 'normal' | 'idle') => void;
  onKillRequest: (pid: number, name: string) => void;
}

// ─── ユーティリティ ──────────────────────────────────────────────────────────

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

export function formatMemory(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb}MB`;
}

export function formatDiskIO(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB/s` : `${kb.toFixed(1)}KB/s`;
}

// ─── テーブルコンポーネント ──────────────────────────────────────────────────

export default function ProcessTable({
  processes,
  filteredProcesses,
  sortedProcesses,
  filterText,
  targetCount,
  threshold,
  isLoading,
  sortKey,
  sortDirection,
  onSort,
  selectedPid,
  onRowClick,
  onPriority,
  onKillRequest,
}: ProcessTableProps): React.ReactElement {
  return (
    <div className="mb-6">
      <div className="font-(--font-mono) text-[10px] text-text-muted mb-2 tracking-[0.12em]">
        {filterText
          ? `LIVE PROCESSES (表示 ${filteredProcesses.length} / 全 ${processes.length} 件 / BOOST対象: ${targetCount}件)`
          : `LIVE PROCESSES (${processes.length}件 / BOOST対象: ${targetCount}件)`}
      </div>
      <div className="bg-base-800 border border-border-subtle rounded overflow-hidden">
        {isLoading ? (
          <LoadingState message="LOADING PROCESSES..." />
        ) : processes.length === 0 ? (
          <EmptyState message="NO DATA" action="PRESS REFRESH TO LOAD" />
        ) : (
          <table className="w-full border-collapse font-(--font-mono) text-[10px]">
            <thead className="sticky top-0 bg-base-800 border-b border-border-subtle">
              <tr>
                <th
                  className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none"
                  onClick={() => onSort('name')}
                >
                  NAME {sortKey === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none w-16"
                  onClick={() => onSort('cpu')}
                >
                  CPU% {sortKey === 'cpu' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none w-16"
                  onClick={() => onSort('mem')}
                >
                  MEM {sortKey === 'mem' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none w-20"
                  onClick={() => onSort('diskRead')}
                >
                  DISK R {sortKey === 'diskRead' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none w-20"
                  onClick={() => onSort('diskWrite')}
                >
                  DISK W {sortKey === 'diskWrite' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left w-20">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProcesses.map((process, index) => {
                const status = getProcessStatus(process, threshold);
                const cpuColor =
                  process.cpuPercent >= 50
                    ? 'text-danger-500'
                    : process.cpuPercent >= 20
                      ? 'text-accent-400'
                      : 'text-text-secondary';
                const isSelected = selectedPid === process.pid;

                return (
                  <React.Fragment key={process.pid}>
                    <tr
                      className={`cursor-pointer hover:bg-base-700 ${
                        isSelected ? 'bg-base-900/10 border-l-2 border-accent-500' : ''
                      } ${index % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                      onClick={() => onRowClick(process.pid)}
                    >
                      <td className="px-3 py-[5px] font-(--font-mono) text-[12px] text-text-primary">
                        {process.name}
                      </td>
                      <td
                        className={`px-3 py-[5px] font-(--font-mono) text-[12px] text-right ${cpuColor}`}
                      >
                        {process.cpuPercent.toFixed(1)}%
                      </td>
                      <td className="px-3 py-[5px] font-(--font-mono) text-[12px] text-right text-text-primary">
                        {formatMemory(process.memMb)}
                      </td>
                      <td className="px-3 py-[5px] font-(--font-mono) text-[12px] text-right text-text-primary">
                        {formatDiskIO(process.diskReadKb)}
                      </td>
                      <td className="px-3 py-[5px] font-(--font-mono) text-[12px] text-right text-text-primary">
                        {formatDiskIO(process.diskWriteKb)}
                      </td>
                      <td className="px-3 py-[5px] font-(--font-mono) text-[12px]">
                        {status === 'target' ? (
                          <span className="inline-block px-1 py-0.5 border border-accent-500 text-accent-500 text-[9px] font-(--font-mono)">
                            [TARGET]
                          </span>
                        ) : status === 'protected' ? (
                          <span className="inline-block px-1 py-0.5 border border-text-muted text-text-muted text-[9px] font-(--font-mono)">
                            [PROT]
                          </span>
                        ) : (
                          <span className="text-text-muted">─</span>
                        )}
                      </td>
                    </tr>

                    {/* アクションパネル */}
                    {isSelected && (
                      <tr>
                        <td colSpan={6} className="px-3 py-2 bg-base-700">
                          <div className="flex items-center gap-2">
                            <span className="font-(--font-mono) text-[10px] text-text-muted">
                              PRIORITY:
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onPriority(process.pid, 'high')}
                            >
                              HIGH
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onPriority(process.pid, 'normal')}
                            >
                              NORMAL
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onPriority(process.pid, 'idle')}
                            >
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
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
