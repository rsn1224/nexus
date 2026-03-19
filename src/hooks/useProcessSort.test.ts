import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SystemProcess } from '../types';
import { useProcessSort } from './useProcessSort';

const makeProcess = (overrides: Partial<SystemProcess>): SystemProcess => ({
  pid: 1,
  name: 'test.exe',
  cpuPercent: 0,
  memMb: 0,
  diskReadKb: 0,
  diskWriteKb: 0,
  canTerminate: false,
  ...overrides,
});

const PROCESSES: SystemProcess[] = [
  makeProcess({ pid: 1, name: 'alpha.exe', cpuPercent: 80, memMb: 200, canTerminate: true }),
  makeProcess({ pid: 2, name: 'beta.exe', cpuPercent: 20, memMb: 500, canTerminate: false }),
  makeProcess({ pid: 3, name: 'gamma.exe', cpuPercent: 50, memMb: 100, canTerminate: true }),
];

describe('useProcessSort', () => {
  it('初期状態では CPU 降順でソートされる', () => {
    const { result } = renderHook(() => useProcessSort(PROCESSES, 10, ''));
    const cpus = result.current.sortedProcesses.map((p) => p.cpuPercent);
    expect(cpus).toEqual([80, 50, 20]);
  });

  it('filterText でプロセス名を絞り込む', () => {
    const { result } = renderHook(() => useProcessSort(PROCESSES, 10, 'alpha'));
    expect(result.current.filteredProcesses).toHaveLength(1);
    expect(result.current.filteredProcesses[0].name).toBe('alpha.exe');
  });

  it('handleSort で同じキーを渡すと昇順/降順が切り替わる', () => {
    const { result } = renderHook(() => useProcessSort(PROCESSES, 10, ''));
    // 初期: cpu 降順
    expect(result.current.sortDirection).toBe('desc');

    act(() => result.current.handleSort('cpu'));
    expect(result.current.sortDirection).toBe('asc');
    expect(result.current.sortedProcesses[0].cpuPercent).toBe(20);
  });

  it('handleSort で別キーに変えると昇順になる', () => {
    const { result } = renderHook(() => useProcessSort(PROCESSES, 10, ''));
    act(() => result.current.handleSort('mem'));
    expect(result.current.sortKey).toBe('mem');
    expect(result.current.sortDirection).toBe('asc');
    expect(result.current.sortedProcesses[0].memMb).toBe(100);
  });

  it('targetCount は threshold 以上の canTerminate プロセスを数える', () => {
    const { result } = renderHook(() => useProcessSort(PROCESSES, 60, ''));
    // alpha (80%, canTerminate=true) のみ
    expect(result.current.targetCount).toBe(1);
  });

  it('name キーで昇順ソート', () => {
    const { result } = renderHook(() => useProcessSort(PROCESSES, 10, ''));
    act(() => result.current.handleSort('name'));
    const names = result.current.sortedProcesses.map((p) => p.name);
    expect(names).toEqual(['alpha.exe', 'beta.exe', 'gamma.exe']);
  });
});
