import { describe, expect, it } from 'vitest';
import type { DiskDrive, HardwareInfo, ResourceSnapshot } from '../../types';
import {
  CPU_TEMP_CRITICAL_C,
  CPU_TEMP_WARN_C,
  CPU_USAGE_CRITICAL_PCT,
  CPU_USAGE_WARN_PCT,
  DISK_USAGE_CRITICAL_PCT,
  GPU_TEMP_CRITICAL_C,
  GPU_TEMP_WARN_C,
  MEM_USAGE_CRITICAL_PCT,
  MEM_USAGE_WARN_PCT,
} from '../constants';
import { homePageSuggestions } from './homeAi';

const baseSnapshot: ResourceSnapshot = {
  cpuPercent: 30,
  memUsedMb: 4000,
  memTotalMb: 16000,
} as ResourceSnapshot;

const baseHw: HardwareInfo = {
  cpuTempC: null,
  gpuTempC: null,
} as HardwareInfo;

describe('homePageSuggestions', () => {
  it('hwInfoがnullなら空配列を返す', () => {
    const result = homePageSuggestions(baseSnapshot, [], null);
    expect(result).toEqual([]);
  });

  it('正常なスナップショットならok提案を返す', () => {
    const result = homePageSuggestions(baseSnapshot, [], baseHw);
    expect(result).toHaveLength(1);
    expect(result[0].level).toBe('ok');
  });

  it('snapshotがnullでもhwInfoがあればok提案を返す', () => {
    const result = homePageSuggestions(null, [], baseHw);
    expect(result).toHaveLength(1);
    expect(result[0].level).toBe('ok');
  });

  it('CPU使用率がcritical閾値以上ならcritical提案', () => {
    const snap = { ...baseSnapshot, cpuPercent: CPU_USAGE_CRITICAL_PCT };
    const result = homePageSuggestions(snap, [], baseHw);
    expect(result.some((s) => s.id === 'cpu_usage_critical')).toBe(true);
  });

  it('CPU使用率がwarn閾値以上(critical未満)ならwarn提案', () => {
    const snap = { ...baseSnapshot, cpuPercent: CPU_USAGE_WARN_PCT };
    const result = homePageSuggestions(snap, [], baseHw);
    expect(result.some((s) => s.id === 'cpu_usage_warn')).toBe(true);
  });

  it('メモリ使用率がcritical閾値以上ならcritical提案', () => {
    const total = 16000;
    const used = total * (MEM_USAGE_CRITICAL_PCT / 100);
    const snap = { ...baseSnapshot, memUsedMb: used, memTotalMb: total };
    const result = homePageSuggestions(snap, [], baseHw);
    expect(result.some((s) => s.id === 'mem_critical')).toBe(true);
  });

  it('メモリ使用率がwarn閾値以上(critical未満)ならwarn提案', () => {
    const total = 16000;
    const used = total * (MEM_USAGE_WARN_PCT / 100);
    const snap = { ...baseSnapshot, memUsedMb: used, memTotalMb: total };
    const result = homePageSuggestions(snap, [], baseHw);
    expect(result.some((s) => s.id === 'mem_warn')).toBe(true);
  });

  it('ディスク使用率がcritical閾値以上ならcritical提案', () => {
    const drive: DiskDrive = {
      name: 'C:',
      sizeBytes: 1000,
      usedBytes: DISK_USAGE_CRITICAL_PCT * 10,
      availableBytes: (100 - DISK_USAGE_CRITICAL_PCT) * 10,
    } as DiskDrive;
    const result = homePageSuggestions(baseSnapshot, [drive], baseHw);
    expect(result.some((s) => s.id === 'disk_critical_C:')).toBe(true);
  });

  it('CPU温度がcritical閾値以上ならcritical提案', () => {
    const hw = { ...baseHw, cpuTempC: CPU_TEMP_CRITICAL_C };
    const result = homePageSuggestions(baseSnapshot, [], hw);
    expect(result.some((s) => s.id === 'temp_critical')).toBe(true);
  });

  it('CPU温度がwarn閾値以上(critical未満)ならwarn提案', () => {
    const hw = { ...baseHw, cpuTempC: CPU_TEMP_WARN_C };
    const result = homePageSuggestions(baseSnapshot, [], hw);
    expect(result.some((s) => s.id === 'temp_warn')).toBe(true);
  });

  it('GPU温度がcritical閾値以上ならcritical提案', () => {
    const hw = { ...baseHw, gpuTempC: GPU_TEMP_CRITICAL_C };
    const result = homePageSuggestions(baseSnapshot, [], hw);
    expect(result.some((s) => s.id === 'gpu_temp_critical')).toBe(true);
  });

  it('GPU温度がwarn閾値以上(critical未満)ならwarn提案', () => {
    const hw = { ...baseHw, gpuTempC: GPU_TEMP_WARN_C };
    const result = homePageSuggestions(baseSnapshot, [], hw);
    expect(result.some((s) => s.id === 'gpu_temp_warn')).toBe(true);
  });

  it('結果は最大3件に制限される', () => {
    const snap = { ...baseSnapshot, cpuPercent: CPU_USAGE_CRITICAL_PCT };
    const hw = { ...baseHw, cpuTempC: CPU_TEMP_CRITICAL_C, gpuTempC: GPU_TEMP_CRITICAL_C };
    const total = 16000;
    const used = total * (MEM_USAGE_CRITICAL_PCT / 100);
    const snap2 = { ...snap, memUsedMb: used, memTotalMb: total };
    const result = homePageSuggestions(snap2, [], hw);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
