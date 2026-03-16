import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import type { HardwareInfo } from '../types';

interface HardwareStore {
  info: HardwareInfo | null;
  isLoading: boolean;
  error: string | null;
  fetchHardware: () => Promise<void>;
}

export const useHardwareStore = create<HardwareStore>((set) => ({
  info: null,
  isLoading: false,
  error: null,
  fetchHardware: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await invoke<HardwareInfo>('get_hardware_info');
      set({ info, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false,
      });
    }
  },
}));
