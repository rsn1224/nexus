import { create } from 'zustand';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  level: LogLevel;
  timestamp: number;
  message: string;
  data?: unknown;
}

const MAX_LOG_ENTRIES = 200;
let _nextId = 0;

interface LogStore {
  entries: LogEntry[];
  addEntry: (level: LogLevel, message: string, data?: unknown) => void;
  clear: () => void;
}

export const useLogStore = create<LogStore>((set) => ({
  entries: [],

  addEntry: (level, message, data) => {
    const entry: LogEntry = {
      id: ++_nextId,
      level,
      timestamp: Date.now(),
      message,
      data,
    };
    set((state) => {
      const next = [...state.entries, entry];
      return { entries: next.length > MAX_LOG_ENTRIES ? next.slice(-MAX_LOG_ENTRIES) : next };
    });
  },

  clear: () => set({ entries: [] }),
}));
