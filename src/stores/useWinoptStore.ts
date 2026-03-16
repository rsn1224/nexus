import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { WinSetting } from '../types';

interface WinoptStore {
  winSettings: WinSetting[];
  netSettings: WinSetting[];
  isLoading: boolean;
  activeId: string | null;
  error: string | null;
  flushDnsResult: string | null;

  fetchWinSettings: () => Promise<void>;
  fetchNetSettings: () => Promise<void>;
  applyWin: (id: string) => Promise<void>;
  revertWin: (id: string) => Promise<void>;
  applyNet: (id: string) => Promise<void>;
  revertNet: (id: string) => Promise<void>;
  flushDns: () => Promise<void>;
}

export const useWinoptStore = create<WinoptStore>((set, get) => ({
  winSettings: [],
  netSettings: [],
  isLoading: false,
  activeId: null,
  error: null,
  flushDnsResult: null,

  fetchWinSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const winSettings = await invoke<WinSetting[]>('get_win_settings');
      set({ winSettings, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'winopt: fetchWinSettings failed');
      set({ error: msg, isLoading: false });
    }
  },

  fetchNetSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const netSettings = await invoke<WinSetting[]>('get_net_settings');
      set({ netSettings, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'winopt: fetchNetSettings failed');
      set({ error: msg, isLoading: false });
    }
  },

  applyWin: async (id) => {
    set({ activeId: id, error: null });
    try {
      await invoke('apply_win_setting', { id });
      await get().fetchWinSettings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err, id }, 'winopt: applyWin failed');
      set({ error: msg });
    } finally {
      set({ activeId: null });
    }
  },

  revertWin: async (id) => {
    set({ activeId: id, error: null });
    try {
      await invoke('revert_win_setting', { id });
      await get().fetchWinSettings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err, id }, 'winopt: revertWin failed');
      set({ error: msg });
    } finally {
      set({ activeId: null });
    }
  },

  applyNet: async (id) => {
    set({ activeId: id, error: null });
    try {
      await invoke('apply_net_setting', { id });
      await get().fetchNetSettings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err, id }, 'winopt: applyNet failed');
      set({ error: msg });
    } finally {
      set({ activeId: null });
    }
  },

  revertNet: async (id) => {
    set({ activeId: id, error: null });
    try {
      await invoke('revert_net_setting', { id });
      await get().fetchNetSettings();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err, id }, 'winopt: revertNet failed');
      set({ error: msg });
    } finally {
      set({ activeId: null });
    }
  },

  flushDns: async () => {
    set({ activeId: 'flush_dns', error: null, flushDnsResult: null });
    try {
      const result = await invoke<string>('flush_dns_cache');
      set({ flushDnsResult: result });
      log.info('winopt: DNS flushed');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'winopt: flushDns failed');
      set({ error: msg });
    } finally {
      set({ activeId: null });
    }
  },
}));
