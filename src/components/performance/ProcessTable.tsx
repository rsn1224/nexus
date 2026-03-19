import type React from 'react';
import type { SystemProcess } from '../../types';
import { EmptyState, LoadingState } from '../ui';
import ProcessRow from './ProcessRow';

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

export function formatMemory(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb.toFixed(1)}MB`;
}

export function formatDiskIO(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB/s` : `${kb.toFixed(1)}KB/s`;
}

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
      <div className="text-xs text-text-muted mb-2">
        {filterText
          ? `LIVE PROCESSES (表示 ${filteredProcesses.length} / 全 ${processes.length} 件 / BOOST対象: ${targetCount}件)`
          : `LIVE PROCESSES (${processes.length}件 / BOOST対象: ${targetCount}件)`}
      </div>
      <div className="bg-base-800 border border-border-subtle rounded-xl overflow-hidden">
        {isLoading ? (
          <LoadingState message="LOADING PROCESSES..." />
        ) : processes.length === 0 ? (
          <EmptyState message="NO DATA" action="PRESS REFRESH TO LOAD" />
        ) : (
          <table className="w-full border-collapse font-mono text-xs">
            <thead className="sticky top-0 bg-base-800 border-b border-border-subtle">
              <tr>
                {(['name', 'cpu', 'mem', 'diskRead', 'diskWrite'] as const).map((key) => {
                  const labels: Record<ProcessSortKey, string> = {
                    name: 'NAME',
                    cpu: 'CPU%',
                    mem: 'MEM',
                    diskRead: 'DISK R',
                    diskWrite: 'DISK W',
                  };
                  const widths: Partial<Record<ProcessSortKey, string>> = {
                    cpu: 'w-16',
                    mem: 'w-16',
                    diskRead: 'w-20',
                    diskWrite: 'w-20',
                  };
                  const isActive = sortKey === key;
                  return (
                    <th
                      key={key}
                      className={`px-3 py-[6px] text-xs font-semibold text-text-muted text-left cursor-pointer select-none hover:text-text-secondary ${widths[key] ?? ''}`}
                      onClick={() => onSort(key)}
                    >
                      <span className="flex items-center gap-1">
                        {labels[key]}
                        {isActive ? (
                          <span className="text-accent-500">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        ) : (
                          <span className="text-text-muted opacity-40">▼</span>
                        )}
                      </span>
                    </th>
                  );
                })}
                <th className="px-3 py-[6px] text-xs font-semibold text-text-muted text-left w-20">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProcesses.map((process, index) => (
                <ProcessRow
                  key={process.pid}
                  process={process}
                  index={index}
                  threshold={threshold}
                  selectedPid={selectedPid}
                  onRowClick={onRowClick}
                  onPriority={onPriority}
                  onKillRequest={onKillRequest}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
