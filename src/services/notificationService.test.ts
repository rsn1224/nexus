import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-notification', () => ({
  sendNotification: vi.fn(),
}));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { sendNotification } from '@tauri-apps/plugin-notification';
import type { ResourceSnapshot } from '../types';
import { checkAndNotify, resetNotificationTimestamps } from './notificationService';

function makeSnapshot(overrides: Partial<ResourceSnapshot> = {}): ResourceSnapshot {
  return {
    timestamp: Date.now(),
    cpuPercent: 50,
    cpuTempC: null,
    memUsedMb: 4096,
    memTotalMb: 16384, // 25% usage
    diskReadKb: 0,
    diskWriteKb: 0,
    ...overrides,
  };
}

describe('notificationService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetNotificationTimestamps();
  });

  it('does not send notification when CPU and memory are below threshold', async () => {
    await checkAndNotify(makeSnapshot({ cpuPercent: 50, memUsedMb: 4096, memTotalMb: 16384 }));
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('sends CPU alert when cpuPercent exceeds 90%', async () => {
    await checkAndNotify(makeSnapshot({ cpuPercent: 95 }));
    expect(sendNotification).toHaveBeenCalledOnce();
    const call = vi.mocked(sendNotification).mock.calls[0]?.[0] as { title: string; body: string };
    expect(call.title).toBe('⚠️ CPU使用率アラート');
    expect(call.body).toContain('95.0%');
  });

  it('sends memory alert when mem usage exceeds 90%', async () => {
    await checkAndNotify(
      makeSnapshot({
        cpuPercent: 50,
        memUsedMb: 15000,
        memTotalMb: 16000, // ~93.75%
      }),
    );
    expect(sendNotification).toHaveBeenCalledOnce();
    const call = vi.mocked(sendNotification).mock.calls[0]?.[0] as { title: string; body: string };
    expect(call.title).toBe('⚠️ メモリ使用率アラート');
  });

  it('sends both CPU and memory alerts when both exceed threshold', async () => {
    await checkAndNotify(
      makeSnapshot({
        cpuPercent: 95,
        memUsedMb: 15000,
        memTotalMb: 16000,
      }),
    );
    expect(sendNotification).toHaveBeenCalledTimes(2);
  });

  it('suppresses duplicate CPU alert within 60 seconds', async () => {
    const snapshot = makeSnapshot({ cpuPercent: 95 });
    await checkAndNotify(snapshot);
    await checkAndNotify(snapshot);
    // 2回呼んでも1回しか通知されない
    expect(sendNotification).toHaveBeenCalledOnce();
  });

  it('sends CPU alert again after dedup interval expires', async () => {
    vi.useFakeTimers();

    const snapshot = makeSnapshot({ cpuPercent: 95 });
    await checkAndNotify(snapshot);
    expect(sendNotification).toHaveBeenCalledOnce();

    // 61秒経過
    vi.advanceTimersByTime(61 * 1000);
    await checkAndNotify(snapshot);
    expect(sendNotification).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('does not divide by zero when memTotalMb is 0', async () => {
    await checkAndNotify(makeSnapshot({ memUsedMb: 100, memTotalMb: 0 }));
    // No memory alert should fire (guard prevents division by zero)
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('sends CPU temperature alert when cpuTempC exceeds 90°C', async () => {
    await checkAndNotify(makeSnapshot({ cpuTempC: 95.5 }));
    expect(sendNotification).toHaveBeenCalledOnce();
    const call = vi.mocked(sendNotification).mock.calls[0]?.[0] as { title: string; body: string };
    expect(call.title).toBe('⚠️ CPU温度アラート');
    expect(call.body).toContain('95.5℃');
  });

  it('does not send CPU temperature alert when cpuTempC is null', async () => {
    await checkAndNotify(makeSnapshot({ cpuTempC: null }));
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('suppresses duplicate CPU temperature alert within 60 seconds', async () => {
    const snapshot = makeSnapshot({ cpuTempC: 95 });
    await checkAndNotify(snapshot);
    await checkAndNotify(snapshot);
    expect(sendNotification).toHaveBeenCalledOnce();
  });
});
