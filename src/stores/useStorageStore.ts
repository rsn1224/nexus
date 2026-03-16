import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import type { DriveInfo } from '../types';

interface StorageStore {
  drives: DriveInfo[];
  isLoading: boolean;
  error: string | null;
  fetchStorage: () => Promise<void>;
}

export const useStorageStore = create<StorageStore>((set) => ({
  drives: [],
  isLoading: false,
  error: null,
  fetchStorage: async () => {
    set({ isLoading: true, error: null });
    try {
      const drives = await invoke<DriveInfo[]>('get_storage_info');
      set({ drives, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
}));
