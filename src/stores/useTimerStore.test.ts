import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimerStore } from './useTimerStore';

// invoke モック
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('useTimerStore', () => {
  beforeEach(() => {
    useTimerStore.setState({
      timerState: null,
      isLoading: false,
      isApplying: false,
      error: null,
    });
  });

  it('fetchTimerState が正常にタイマー状態を取得する', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const mockState = {
      current100ns: 10000,
      nexusRequested100ns: null,
      default100ns: 156250,
      minimum100ns: 5000,
      maximum100ns: 156250,
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockState);

    await useTimerStore.getState().fetchTimerState();

    expect(useTimerStore.getState().timerState).toEqual(mockState);
    expect(useTimerStore.getState().isLoading).toBe(false);
  });

  it('setTimerResolution が値を設定して状態を更新する', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const mockResult = {
      current100ns: 5000,
      nexusRequested100ns: 5000,
      default100ns: 156250,
      minimum100ns: 5000,
      maximum100ns: 156250,
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockResult);

    await useTimerStore.getState().setTimerResolution(5000);

    expect(vi.mocked(invoke)).toHaveBeenCalledWith('set_timer_resolution', {
      resolution100ns: 5000,
    });
    expect(useTimerStore.getState().timerState?.nexusRequested100ns).toBe(5000);
  });

  it('restoreTimerResolution が復元して状態を再取得する', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValueOnce(undefined); // restore
    vi.mocked(invoke).mockResolvedValueOnce({
      current100ns: 156250,
      nexusRequested100ns: null,
      default100ns: 156250,
      minimum100ns: 5000,
      maximum100ns: 156250,
    }); // re-fetch

    await useTimerStore.getState().restoreTimerResolution();

    expect(useTimerStore.getState().timerState?.nexusRequested100ns).toBeNull();
  });

  it('fetchTimerState のエラーハンドリング', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Permission denied'));

    await useTimerStore.getState().fetchTimerState();

    expect(useTimerStore.getState().error).toBeTruthy();
    expect(useTimerStore.getState().isLoading).toBe(false);
  });

  it('setTimerResolution のエラーハンドリング', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Invalid value'));

    await useTimerStore.getState().setTimerResolution(999);

    expect(useTimerStore.getState().error).toBeTruthy();
    expect(useTimerStore.getState().isApplying).toBe(false);
  });
});
