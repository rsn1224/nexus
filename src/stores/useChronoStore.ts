import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { ChronoTask } from '../types';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface ChronoStore {
  tasks: ChronoTask[];
  isLoading: boolean;
  error: string | null;
  pomodoroSeconds: number; // 残り秒数（0 で停止）
  isPomodoro: boolean;
  pomodoroInterval: number | null; // setInterval ID

  fetchTasks: () => Promise<void>;
  saveTask: (
    id: string,
    title: string,
    done: boolean,
    priority: string,
    dueAt?: number,
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  startPomodoro: (minutes?: number) => void; // デフォルト 25 分
  stopPomodoro: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_POMODORO_MINUTES = 25;
const SECONDS_PER_MINUTE = 60;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useChronoStore = create<ChronoStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  pomodoroSeconds: 0,
  isPomodoro: false,
  pomodoroInterval: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await invoke<ChronoTask[]>('list_tasks');
      log.info({ count: tasks.length }, 'chrono: tasks fetched');
      set({ tasks, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'chrono: fetch tasks failed');
      set({ error: message, isLoading: false });
    }
  },

  saveTask: async (id, title, done, priority, dueAt) => {
    try {
      const task = await invoke<ChronoTask>('save_task', {
        id,
        title,
        done,
        priority,
        dueAt,
      });
      log.info({ id, title, done, priority }, 'chrono: task saved');

      set((state) => ({
        tasks: state.tasks.some((t) => t.id === id)
          ? state.tasks.map((t) => (t.id === id ? task : t))
          : [...state.tasks, task],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'chrono: save task failed');
      set({ error: message });
    }
  },

  deleteTask: async (id) => {
    try {
      await invoke('delete_task', { id });
      log.info({ id }, 'chrono: task deleted');
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'chrono: delete task failed');
      set({ error: message });
    }
  },

  toggleDone: async (id) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    await get().saveTask(id, task.title, !task.done, task.priority, task.dueAt);
  },

  startPomodoro: (minutes = DEFAULT_POMODORO_MINUTES) => {
    const { pomodoroInterval } = get();

    if (pomodoroInterval) {
      log.warn('chrono: pomodoro already running');
      return;
    }

    const totalSeconds = minutes * SECONDS_PER_MINUTE;
    log.info({ minutes, totalSeconds }, 'chrono: starting pomodoro');

    const interval = setInterval(() => {
      const { pomodoroSeconds } = get();

      if (pomodoroSeconds <= 1) {
        // タイマー終了
        get().stopPomodoro();
        log.info('chrono: pomodoro completed');
      } else {
        set({ pomodoroSeconds: pomodoroSeconds - 1 });
      }
    }, 1000) as unknown as number;

    set({
      pomodoroSeconds: totalSeconds,
      isPomodoro: true,
      pomodoroInterval: interval,
    });
  },

  stopPomodoro: () => {
    const { pomodoroInterval } = get();

    if (pomodoroInterval) {
      clearInterval(pomodoroInterval);
      log.info('chrono: pomodoro stopped');
    }

    set({
      pomodoroSeconds: 0,
      isPomodoro: false,
      pomodoroInterval: null,
    });
  },
}));

// ─── Cleanup on unmount ───────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useChronoStore.getState().stopPomodoro();
  });
}
