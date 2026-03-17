import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { DnsPreset, NetworkAdapter, PingResult } from '../types';

interface NetoptStore {
  adapters: NetworkAdapter[];
  currentDns: string[];
  pingResult: PingResult | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Actions
  fetchAdapters: () => Promise<void>;
  fetchCurrentDns: () => Promise<void>;
  setDns: (adapter: string, primary: string, secondary: string) => Promise<void>;
  pingHost: (target: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

// DNSプリセット定義
const DNS_PRESETS: DnsPreset[] = [
  {
    name: 'Cloudflare',
    primary: '1.1.1.1',
    secondary: '1.0.0.1',
  },
  {
    name: 'Google',
    primary: '8.8.8.8',
    secondary: '8.8.4.4',
  },
  {
    name: 'OpenDNS',
    primary: '208.67.222.222',
    secondary: '208.67.220.220',
  },
  {
    name: 'Quad9',
    primary: '9.9.9.9',
    secondary: '149.112.112.112',
  },
];

export const useNetoptStore = create<NetoptStore>((set, get) => ({
  adapters: [],
  currentDns: [],
  pingResult: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchAdapters: async () => {
    set({ isLoading: true, error: null });
    try {
      const adapters = await invoke<NetworkAdapter[]>('get_network_adapters');
      set({
        adapters,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch network adapters';
      log.error({ err }, 'fetch adapters failed: %s', errorMessage);
      set({
        adapters: [],
        error: errorMessage,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    }
  },

  fetchCurrentDns: async () => {
    set({ isLoading: true, error: null });
    try {
      const dns = await invoke<string[]>('get_current_dns');
      set({
        currentDns: dns,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch current DNS';
      log.error({ err }, 'fetch DNS failed: %s', errorMessage);
      set({
        currentDns: [],
        error: errorMessage,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    }
  },

  setDns: async (adapter: string, primary: string, secondary: string) => {
    set({ isLoading: true, error: null });
    try {
      await invoke('set_dns', { adapter, primary, secondary });

      // DNS設定後、現在のDNSを再取得
      await get().fetchCurrentDns();

      set({
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set DNS';
      log.error({ err }, 'set DNS failed: %s', errorMessage);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  pingHost: async (target: string) => {
    set({ isLoading: true, error: null, pingResult: null });
    try {
      const result = await invoke<PingResult>('ping_host', { target });
      set({
        pingResult: result,
        isLoading: false,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to ping host';
      log.error({ err }, 'ping failed: %s', errorMessage);
      set({
        pingResult: {
          target,
          latencyMs: null,
          success: false,
        },
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      adapters: [],
      currentDns: [],
      pingResult: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
  },
}));

// セレクター関数
export const useNetopt = () => {
  const {
    adapters,
    currentDns,
    pingResult,
    isLoading,
    error,
    fetchAdapters,
    fetchCurrentDns,
    setDns,
    pingHost,
    clearError,
    reset,
  } = useNetoptStore();

  return {
    adapters,
    currentDns,
    pingResult,
    isLoading,
    error,
    fetchAdapters,
    fetchCurrentDns,
    setDns,
    pingHost,
    clearError,
    reset,
    dnsPresets: DNS_PRESETS,
  };
};
