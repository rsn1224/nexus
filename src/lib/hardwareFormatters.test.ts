import { describe, expect, it } from 'vitest';
import {
  calculateMemUsagePercent,
  createDiskProgressBar,
  defaultHardwareInfo,
  formatBootTime,
  formatUptime,
} from './hardwareFormatters';

describe('formatUptime', () => {
  it('0秒の場合は0mを返す', () => {
    expect(formatUptime(0)).toBe('0m');
  });

  it('59秒の場合は0mを返す', () => {
    expect(formatUptime(59)).toBe('0m');
  });

  it('60秒の場合は1mを返す', () => {
    expect(formatUptime(60)).toBe('1m');
  });

  it('3600秒の場合は1h 0mを返す', () => {
    expect(formatUptime(3600)).toBe('1h 0m');
  });

  it('3661秒の場合は1h 1mを返す', () => {
    expect(formatUptime(3661)).toBe('1h 1m');
  });

  it('86400秒の場合は1d 0h 0mを返す', () => {
    expect(formatUptime(86400)).toBe('1d 0h 0m');
  });

  it('90061秒の場合は1d 1h 1mを返す', () => {
    expect(formatUptime(90061)).toBe('1d 1h 1m');
  });

  it('複数日の大きな値を正しく表示する', () => {
    expect(formatUptime(259200)).toBe('3d 0h 0m');
  });
});

describe('createDiskProgressBar', () => {
  it('0%の場合は空のバーを返す', () => {
    expect(createDiskProgressBar(0, 100)).toBe('░░░░░░░░░░');
  });

  it('100%の場合は満杯のバーを返す', () => {
    expect(createDiskProgressBar(100, 100)).toBe('██████████');
  });

  it('50%の場合は半分のバーを返す', () => {
    expect(createDiskProgressBar(50, 100)).toBe('█████░░░░░');
  });

  it('totalGbが0の場合は空のバーを返す', () => {
    expect(createDiskProgressBar(50, 0)).toBe('░░░░░░░░░░');
  });

  it('バーの長さは常に10文字', () => {
    expect(createDiskProgressBar(33, 100)).toHaveLength(10);
  });
});

describe('formatBootTime', () => {
  it('UNIXタイムスタンプを日本語日時に変換する', () => {
    const result = formatBootTime(1700000000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('タイムスタンプ0を処理する', () => {
    const result = formatBootTime(0);
    expect(typeof result).toBe('string');
  });
});

describe('calculateMemUsagePercent', () => {
  it('正常な値で使用率を計算する', () => {
    expect(calculateMemUsagePercent(8, 16)).toBe(50);
  });

  it('totalGbが0の場合は0を返す', () => {
    expect(calculateMemUsagePercent(8, 0)).toBe(0);
  });

  it('全量使用時は100を返す', () => {
    expect(calculateMemUsagePercent(16, 16)).toBe(100);
  });

  it('未使用時は0を返す', () => {
    expect(calculateMemUsagePercent(0, 16)).toBe(0);
  });
});

describe('defaultHardwareInfo', () => {
  it('デフォルト値が存在する', () => {
    expect(defaultHardwareInfo).toBeDefined();
  });

  it('CPU名がUnknown CPUである', () => {
    expect(defaultHardwareInfo.cpuName).toBe('Unknown CPU');
  });

  it('数値フィールドが0で初期化されている', () => {
    expect(defaultHardwareInfo.cpuCores).toBe(0);
    expect(defaultHardwareInfo.cpuThreads).toBe(0);
    expect(defaultHardwareInfo.memTotalGb).toBe(0);
    expect(defaultHardwareInfo.uptimeSecs).toBe(0);
  });

  it('nullableフィールドがnullで初期化されている', () => {
    expect(defaultHardwareInfo.cpuTempC).toBeNull();
    expect(defaultHardwareInfo.gpuName).toBeNull();
    expect(defaultHardwareInfo.gpuTempC).toBeNull();
  });

  it('disksが空配列で初期化されている', () => {
    expect(defaultHardwareInfo.disks).toEqual([]);
  });
});
