import { useMemo, useState } from 'react';
import type { ProcessSortKey } from '../components/performance/ProcessTable';
import type { SystemProcess } from '../types';

export interface UseProcessSortResult {
  filteredProcesses: SystemProcess[];
  sortedProcesses: SystemProcess[];
  targetCount: number;
  sortKey: ProcessSortKey;
  sortDirection: 'asc' | 'desc';
  handleSort: (key: ProcessSortKey) => void;
}

export function useProcessSort(
  processes: SystemProcess[],
  threshold: number,
  filterText: string,
): UseProcessSortResult {
  const [sortKey, setSortKey] = useState<ProcessSortKey>('cpu');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredProcesses = useMemo(
    () =>
      processes.filter(
        (p) => filterText === '' || p.name.toLowerCase().includes(filterText.toLowerCase()),
      ),
    [processes, filterText],
  );

  const sortedProcesses = useMemo(() => {
    const sorted = [...filteredProcesses];
    sorted.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortKey) {
        case 'name': {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
        }
        case 'cpu':
          aValue = a.cpuPercent;
          bValue = b.cpuPercent;
          break;
        case 'mem':
          aValue = a.memMb;
          bValue = b.memMb;
          break;
        case 'diskRead':
          aValue = a.diskReadKb;
          bValue = b.diskReadKb;
          break;
        case 'diskWrite':
          aValue = a.diskWriteKb;
          bValue = b.diskWriteKb;
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    return sorted;
  }, [filteredProcesses, sortKey, sortDirection]);

  const targetCount = useMemo(
    () => processes.filter((p) => p.cpuPercent >= threshold && p.canTerminate).length,
    [processes, threshold],
  );

  const handleSort = (key: ProcessSortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return { filteredProcesses, sortedProcesses, targetCount, sortKey, sortDirection, handleSort };
}
