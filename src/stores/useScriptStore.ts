import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { extractErrorMessage } from '../lib/tauri';
import type { ExecutionLog, ScriptEntry } from '../types';

interface ScriptStore {
  scripts: ScriptEntry[];
  logs: ExecutionLog[];
  isLoading: boolean;
  isRunning: boolean;
  error: string | null;

  fetchScripts: () => Promise<void>;
  addScript: (name: string, path: string, scriptType: string, description: string) => Promise<void>;
  deleteScript: (id: string) => Promise<void>;
  runScript: (id: string) => Promise<void>;
  fetchLogs: () => Promise<void>;
  clearLogs: () => Promise<void>;
}

export const useScriptStore = create<ScriptStore>((set, get) => ({
  scripts: [],
  logs: [],
  isLoading: false,
  isRunning: false,
  error: null,

  fetchScripts: async () => {
    set({ isLoading: true, error: null });
    try {
      const scripts = await invoke<ScriptEntry[]>('list_scripts');
      set({ scripts, isLoading: false });
    } catch (error) {
      set({
        error: typeof error === 'string' ? error : 'Failed to fetch scripts',
        isLoading: false,
      });
    }
  },

  addScript: async (name, path, scriptType, description) => {
    set({ isLoading: true, error: null });
    try {
      const newScript = await invoke<ScriptEntry>('add_script', {
        name,
        path,
        script_type: scriptType,
        description,
      });

      set((state) => ({
        scripts: [...state.scripts, newScript],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: extractErrorMessage(error),
        isLoading: false,
      });
    }
  },

  deleteScript: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('delete_script', { id });
      set((state) => ({
        scripts: state.scripts.filter((script) => script.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: extractErrorMessage(error),
        isLoading: false,
      });
    }
  },

  runScript: async (id) => {
    const { isRunning } = get();
    if (isRunning) return;

    set({ isRunning: true, error: null });
    try {
      const log = await invoke<ExecutionLog>('run_script', { id });
      set((state) => ({
        logs: [log, ...state.logs],
        isRunning: false,
      }));
    } catch (error) {
      set({
        error: extractErrorMessage(error),
        isLoading: false,
      });
    }
  },

  fetchLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const logs = await invoke<ExecutionLog[]>('get_execution_logs');
      set({ logs, isLoading: false });
    } catch (error) {
      set({
        error: extractErrorMessage(error),
        isLoading: false,
      });
    }
  },

  clearLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      await invoke('clear_execution_logs');
      set({ logs: [], isLoading: false });
    } catch (error) {
      set({
        error: extractErrorMessage(error),
        isLoading: false,
      });
    }
  },
}));
