import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FrameTimeMonitorState, FrameTimeSnapshot } from '../types';
import { useFrameTimeActions, useFrameTimeState, useFrameTimeStore } from './useFrameTimeStore';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn((_event, _callback) => {
    return Promise.resolve(() => {});
  }),
}));

describe('useFrameTimeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useFrameTimeStore.setState({
      monitorState: { type: 'stopped' },
      snapshot: null,
      history: [],
      isLoading: false,
      error: null,
    });
  });

  it('startMonitor が正常に呼び出せる', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValue({ type: 'running', pid: 1234, processName: 'test.exe' });

    const { result } = renderHook(() => useFrameTimeActions());

    await result.current.startMonitor(1234, 'test.exe');

    expect(invoke).toHaveBeenCalledWith('start_frame_time_monitor', {
      pid: 1234,
      processName: 'test.exe',
    });

    expect(useFrameTimeStore.getState().monitorState).toEqual({
      type: 'running',
      pid: 1234,
      processName: 'test.exe',
    });
  });

  it('stopMonitor が状態をリセットする', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValue({ type: 'stopped' });

    // 最初に監視中状態に設定
    useFrameTimeStore.setState({
      monitorState: { type: 'running', pid: 1234, processName: 'test.exe' },
      snapshot: {
        pid: 1234,
        processName: 'test.exe',
        avgFps: 60,
        pct1Low: 55,
        pct01Low: 50,
        stutterCount: 0,
        lastFrameTimeMs: 16.6,
        frameTimes: [],
        timestamp: Date.now(),
      },
      history: [],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useFrameTimeActions());

    await result.current.stopMonitor();

    expect(invoke).toHaveBeenCalledWith('stop_frame_time_monitor');

    const state = useFrameTimeStore.getState();
    expect(state.monitorState).toEqual({ type: 'stopped' });
    expect(state.snapshot).toBeNull();
    expect(state.history).toEqual([]);
  });

  it('snapshot 受信時に history が蓄積される', async () => {
    const { listen } = await import('@tauri-apps/api/event');
    const mockListen = vi.mocked(listen);

    type EventHandler = (event: { payload: FrameTimeSnapshot }) => void;
    const captured: { cb: EventHandler | null } = { cb: null };
    mockListen.mockImplementation((_event, callback) => {
      captured.cb = callback as unknown as EventHandler;
      return Promise.resolve(() => {}); // unlisten function
    });

    const { result } = renderHook(() => useFrameTimeActions());

    // リスナーをセットアップ
    await result.current.setupListeners();

    expect(captured.cb).not.toBeNull();

    // スナップショットを模擬
    const snapshot: FrameTimeSnapshot = {
      pid: 1234,
      processName: 'test.exe',
      avgFps: 60,
      pct1Low: 55,
      pct01Low: 50,
      stutterCount: 0,
      lastFrameTimeMs: 16.6,
      frameTimes: [16.6, 16.7, 16.5],
      timestamp: Date.now(),
    };

    captured.cb?.({ payload: snapshot });

    const state = useFrameTimeStore.getState();
    expect(state.snapshot).toEqual(
      expect.objectContaining({
        pid: snapshot.pid,
        processName: snapshot.processName,
        avgFps: snapshot.avgFps,
      }),
    );
    expect(state.history).toHaveLength(1);
    expect(state.history[0]).toEqual(
      expect.objectContaining({
        pid: snapshot.pid,
        processName: snapshot.processName,
        avgFps: snapshot.avgFps,
      }),
    );
  });

  it('history が MAX_HISTORY を超えない', async () => {
    const { listen } = await import('@tauri-apps/api/event');
    const mockListen = vi.mocked(listen);

    type EventHandler = (event: { payload: FrameTimeSnapshot }) => void;
    const captured: { cb: EventHandler | null } = { cb: null };
    mockListen.mockImplementation((_event, callback) => {
      captured.cb = callback as unknown as EventHandler;
      return Promise.resolve(() => {});
    });

    const { result } = renderHook(() => useFrameTimeActions());
    await result.current.setupListeners();

    expect(captured.cb).not.toBeNull();

    // MAX_HISTORY (60) より多くのスナップショットを送信
    for (let i = 0; i < 70; i++) {
      const snapshot: FrameTimeSnapshot = {
        pid: 1234,
        processName: 'test.exe',
        avgFps: 60 + i,
        pct1Low: 55,
        pct01Low: 50,
        stutterCount: 0,
        lastFrameTimeMs: 16.6,
        frameTimes: [],
        timestamp: Date.now() + i,
      };

      captured.cb?.({ payload: snapshot });
    }

    const state = useFrameTimeStore.getState();
    expect(state.history).toHaveLength(60); // MAX_HISTORY に制限される
  });

  it('エラーハンドリング', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useFrameTimeActions());

    await result.current.startMonitor(1234, 'test.exe');

    const state = useFrameTimeStore.getState();
    expect(state.error).toBe('Test error');
    expect(state.isLoading).toBe(false);
  });

  it('useFrameTimeState セレクターが正しく状態を取得する', () => {
    const testState: FrameTimeMonitorState = {
      type: 'running',
      pid: 1234,
      processName: 'test.exe',
    };
    const testSnapshot: FrameTimeSnapshot = {
      pid: 1234,
      processName: 'test.exe',
      avgFps: 60,
      pct1Low: 55,
      pct01Low: 50,
      stutterCount: 0,
      lastFrameTimeMs: 16.6,
      frameTimes: [],
      timestamp: Date.now(),
    };

    useFrameTimeStore.setState({
      monitorState: testState,
      snapshot: testSnapshot,
      history: [testSnapshot],
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useFrameTimeState());

    expect(result.current.monitorState).toEqual(testState);
    expect(result.current.snapshot).toEqual(testSnapshot);
    expect(result.current.history).toEqual([testSnapshot]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('useFrameTimeActions セレクターが正しくアクションを取得する', () => {
    const { result } = renderHook(() => useFrameTimeActions());

    expect(typeof result.current.startMonitor).toBe('function');
    expect(typeof result.current.stopMonitor).toBe('function');
    expect(typeof result.current.getStatus).toBe('function');
    expect(typeof result.current.setupListeners).toBe('function');
  });

  it('getStatus が状態を取得する', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockResolvedValue({ type: 'stopped' });

    const { result } = renderHook(() => useFrameTimeActions());

    await result.current.getStatus();

    expect(invoke).toHaveBeenCalledWith('get_frame_time_status');
    expect(useFrameTimeStore.getState().monitorState).toEqual({ type: 'stopped' });
  });
});
