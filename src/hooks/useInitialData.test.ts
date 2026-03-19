import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventSubscription, useInitialData, useStateSync } from './useInitialData';

describe('useInitialData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('マウント時に fetchFn を呼び出す', () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useInitialData(fetchFn));

    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('依存配列が変わると再度 fetchFn を呼び出す', () => {
    const fetchFn = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(({ dep }) => useInitialData(fetchFn, [dep]), {
      initialProps: { dep: 1 },
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);

    rerender({ dep: 2 });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

describe('useEventSubscription', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('マウント時に subscribeFn を呼び出す', () => {
    const subscribeFn = vi.fn();

    renderHook(() => useEventSubscription(subscribeFn));

    expect(subscribeFn).toHaveBeenCalledOnce();
  });

  it('アンマウント時にクリーンアップ関数を呼び出す', () => {
    const cleanup = vi.fn();
    const subscribeFn = vi.fn().mockReturnValue(cleanup);

    const { unmount } = renderHook(() => useEventSubscription(subscribeFn));

    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('クリーンアップ関数がない場合でもエラーにならない', () => {
    const subscribeFn = vi.fn().mockReturnValue(undefined);

    const { unmount } = renderHook(() => useEventSubscription(subscribeFn));

    expect(() => unmount()).not.toThrow();
  });
});

describe('useStateSync', () => {
  it('マウント時に syncFn を呼び出す', () => {
    const syncFn = vi.fn();

    renderHook(() => useStateSync(syncFn, []));

    expect(syncFn).toHaveBeenCalledOnce();
  });

  it('依存配列の変化で syncFn を再実行する', () => {
    const syncFn = vi.fn();

    const { rerender } = renderHook(({ dep }) => useStateSync(syncFn, [dep]), {
      initialProps: { dep: 'a' },
    });

    expect(syncFn).toHaveBeenCalledTimes(1);
    rerender({ dep: 'b' });
    expect(syncFn).toHaveBeenCalledTimes(2);
  });
});
