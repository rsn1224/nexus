import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { NetworkDevice, TrafficSnapshot } from '../types';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface ReconStore {
  devices: NetworkDevice[];
  traffic: TrafficSnapshot | null;
  isScanning: boolean;
  error: string | null;
  lastUpdated: number | null;

  scanNetwork: () => Promise<void>;
  fetchTraffic: () => Promise<void>;
  resolveHostnames: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useReconStore = create<ReconStore>((set, get) => ({
  devices: [],
  traffic: null,
  isScanning: false,
  error: null,
  lastUpdated: null,

  scanNetwork: async () => {
    set({ isScanning: true, error: null });
    try {
      const devices = await invoke<NetworkDevice[]>('scan_network');
      log.info({ count: devices.length }, 'recon: devices scanned');
      set({ devices, isScanning: false, lastUpdated: Date.now() });
      // バックグラウンドでホスト名を解決する（エラーは無視）
      void get().resolveHostnames();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'recon: scan failed');
      set({ error: message, isScanning: false });
    }
  },

  fetchTraffic: async () => {
    try {
      const traffic = await invoke<TrafficSnapshot>('get_traffic_snapshot');
      log.debug({ traffic }, 'recon: traffic fetched');
      set({ traffic });
    } catch (err) {
      log.error({ err }, 'recon: traffic fetch failed');
    }
  },

  resolveHostnames: async () => {
    const { devices } = get();
    for (const device of devices) {
      try {
        const hostname = await invoke<string>('resolve_hostname', { ip: device.ip });
        if (hostname) {
          set((state) => ({
            devices: state.devices.map((d) => (d.ip === device.ip ? { ...d, hostname } : d)),
          }));
        }
      } catch (err) {
        log.debug({ err, ip: device.ip }, 'recon: hostname resolution failed');
      }
    }
  },
}));
