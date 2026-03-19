import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHardwareData } from './hardwareHooks';

vi.mock('../stores/useHardwareStore', () => {
  const mockStore = vi.fn();
  return { useHardwareStore: mockStore };
});

vi.mock('../lib/hardwareFormatters', () => ({
  calculateMemUsagePercent: vi.fn((used: number, total: number) =>
    Math.round((used / total) * 100),
  ),
  formatUptime: vi.fn((secs: number) => `${Math.floor(secs / 3600)}h`),
  formatBootTime: vi.fn((_unix: number) => '2026-03-19 10:00'),
}));

import { useHardwareStore } from '../stores/useHardwareStore';

const mockInfo = {
  memUsedGb: 8,
  memTotalGb: 16,
  uptimeSecs: 7200,
  bootTimeUnix: 1742360400,
  disks: [{ usedGb: 200, totalGb: 500 }],
};

const subscribeFn = vi.fn();

describe('useHardwareData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('info がある場合、計算済みフィールドを返す', () => {
    vi.mocked(useHardwareStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: Record<string, unknown>) => unknown)({
          info: mockInfo,
          isListening: true,
          error: null,
          subscribe: subscribeFn,
        });
      }
      return {};
    });

    const { result } = renderHook(() => useHardwareData());

    expect(result.current.info).toEqual(mockInfo);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.memUsagePercent).toBe(50);
    expect(result.current.formattedUptime).toBe('2h');
    expect(result.current.formattedBootTime).toBe('2026-03-19 10:00');
    expect(result.current.diskUsagePercent).toBe(40);
    expect(result.current.fetchHardware).toBe(subscribeFn);
  });

  it('info が null の場合、デフォルト値を返す', () => {
    vi.mocked(useHardwareStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: Record<string, unknown>) => unknown)({
          info: null,
          isListening: false,
          error: null,
          subscribe: subscribeFn,
        });
      }
      return {};
    });

    const { result } = renderHook(() => useHardwareData());

    expect(result.current.info).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.memUsagePercent).toBe(0);
    expect(result.current.formattedUptime).toBe('--');
    expect(result.current.formattedBootTime).toBe('--');
    expect(result.current.diskUsagePercent).toBeNull();
  });

  it('エラーがある場合、error を返す', () => {
    vi.mocked(useHardwareStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: Record<string, unknown>) => unknown)({
          info: null,
          isListening: false,
          error: 'fetch failed',
          subscribe: subscribeFn,
        });
      }
      return {};
    });

    const { result } = renderHook(() => useHardwareData());

    expect(result.current.error).toBe('fetch failed');
  });
});
