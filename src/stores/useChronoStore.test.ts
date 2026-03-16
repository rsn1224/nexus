import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChronoTask } from '../types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useChronoStore } from './useChronoStore';

const MOCK_TASK: ChronoTask = {
  id: 'test-1',
  title: 'Test Task',
  done: false,
  priority: 'high',
  dueAt: 1640995200000,
  createdAt: 1640995200000,
  updatedAt: 1640995200000,
};

function resetStore(): void {
  useChronoStore.setState({
    tasks: [],
    isLoading: false,
    error: null,
    pomodoroSeconds: 0,
    isPomodoro: false,
    pomodoroInterval: null,
  });
}

describe('useChronoStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    vi.useFakeTimers();
  });

  it('starts with empty tasks and not polling', () => {
    const { tasks, isLoading, error, pomodoroSeconds, isPomodoro } = useChronoStore.getState();
    expect(tasks).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
    expect(pomodoroSeconds).toBe(0);
    expect(isPomodoro).toBe(false);

    // クリーンアップ
    vi.useRealTimers();
    useChronoStore.getState().stopPomodoro();
  });

  it('fetchTasks loads tasks from backend', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_TASK]);

    await useChronoStore.getState().fetchTasks();

    const state = useChronoStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0]).toEqual(MOCK_TASK);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchTasks sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('API error'));

    await useChronoStore.getState().fetchTasks();

    const state = useChronoStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.error).toBe('API error');
    expect(state.isLoading).toBe(false);
  });

  it('saveTask creates new task', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_TASK);

    await useChronoStore.getState().saveTask('new-task', 'New Task', false, 'medium', undefined);

    const state = useChronoStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0]).toEqual(MOCK_TASK);
    expect(state.error).toBeNull();
  });

  it('saveTask updates existing task', async () => {
    const updatedTask = { ...MOCK_TASK, title: 'Updated Task', done: true };

    // 初期状態でタスクを追加
    useChronoStore.setState({ tasks: [MOCK_TASK] });

    vi.mocked(invoke).mockResolvedValueOnce(updatedTask);

    await useChronoStore.getState().saveTask('test-1', 'Updated Task', true, 'high', 1640995200000);

    const state = useChronoStore.getState();
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].title).toBe('Updated Task');
    expect(state.tasks[0].done).toBe(true);
  });

  it('deleteTask removes task from store', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    // 初期状態でタスクを追加
    useChronoStore.setState({ tasks: [MOCK_TASK] });

    await useChronoStore.getState().deleteTask('test-1');

    const state = useChronoStore.getState();
    expect(state.tasks).toHaveLength(0);
    expect(state.error).toBeNull();
  });

  it('deleteTask sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Delete failed'));

    useChronoStore.setState({ tasks: [MOCK_TASK] });

    await useChronoStore.getState().deleteTask('test-1');

    const state = useChronoStore.getState();
    expect(state.tasks).toHaveLength(1); // タスクは残ったまま
    expect(state.error).toBe('Delete failed');
  });

  it('toggleDone flips task completion status', async () => {
    const updatedTask = { ...MOCK_TASK, done: true };

    // 初期状態でタスクを追加
    useChronoStore.setState({ tasks: [MOCK_TASK] });
    vi.mocked(invoke).mockResolvedValueOnce(updatedTask);

    await useChronoStore.getState().toggleDone('test-1');

    const state = useChronoStore.getState();
    expect(state.tasks[0].done).toBe(true);
  });

  it('startPomodoro starts timer with default 25 minutes', () => {
    useChronoStore.getState().startPomodoro();

    const state = useChronoStore.getState();
    expect(state.isPomodoro).toBe(true);
    expect(state.pomodoroSeconds).toBe(25 * 60); // 1500 seconds
    expect(state.pomodoroInterval).not.toBeNull();
  });

  it('startPomodoro accepts custom minutes', () => {
    useChronoStore.getState().startPomodoro(10); // 10 minutes

    const state = useChronoStore.getState();
    expect(state.pomodoroSeconds).toBe(10 * 60); // 600 seconds
  });

  it('stopPomodoro stops timer and resets state', () => {
    // タイマーを開始
    useChronoStore.getState().startPomodoro();
    expect(useChronoStore.getState().isPomodoro).toBe(true);

    // タイマーを停止
    useChronoStore.getState().stopPomodoro();

    const state = useChronoStore.getState();
    expect(state.isPomodoro).toBe(false);
    expect(state.pomodoroSeconds).toBe(0);
    expect(state.pomodoroInterval).toBeNull();
  });

  it('pomodoro countdown stops when reaches zero', () => {
    useChronoStore.getState().startPomodoro(1); // 1 minute = 60 seconds

    // 59秒後
    vi.advanceTimersByTime(59000);
    expect(useChronoStore.getState().pomodoroSeconds).toBe(1);
    expect(useChronoStore.getState().isPomodoro).toBe(true);

    // 1秒後（タイマー終了）
    vi.advanceTimersByTime(1000);

    const state = useChronoStore.getState();
    expect(state.isPomodoro).toBe(false);
    expect(state.pomodoroSeconds).toBe(0);
    expect(state.pomodoroInterval).toBeNull();

    // クリーンアップ
    vi.useRealTimers();
  });

  it('startPomodoro does nothing if already running', () => {
    useChronoStore.getState().startPomodoro();
    const initialInterval = useChronoStore.getState().pomodoroInterval;

    useChronoStore.getState().startPomodoro();

    expect(useChronoStore.getState().pomodoroInterval).toBe(initialInterval);

    // クリーンアップ
    vi.useRealTimers();
    useChronoStore.getState().stopPomodoro();
  });
});
