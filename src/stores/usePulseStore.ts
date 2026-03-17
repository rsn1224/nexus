import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import { checkAndNotify } from '../services/notificationService';
import type { ResourceSnapshot } from '../types';
import { useSettingsStore } from './useSettingsStore';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface PulseStore {
  snapshots: ResourceSnapshot[]; // 直近 60 件のみ保持
  isPolling: boolean;
  error: string | null;
  pollInterval: number | null; // setInterval ID

  startPolling: () => void;
  stopPolling: () => void;
  fetchSnapshot: () => Promise<void>;
  clearSnapshots: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SNAPSHOTS = 60; // 最大保持数

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePulseStore = create<PulseStore>((set, get) => ({
  snapshots: [],
  isPolling: false,
  error: null,
  pollInterval: null,

  startPolling: () => {
    const { isPolling, pollInterval } = get();

    if (isPolling || pollInterval) {
      log.warn('pulse: polling already started');
      return;
    }

    log.info('pulse: starting resource polling');

    // 最初のスナップショットを即時取得
    void get().fetchSnapshot();

    // ポーリングを開始
    const interval = setInterval(() => {
      void get().fetchSnapshot();
    }, useSettingsStore.getState().pollIntervalMs) as unknown as number;

    set({
      isPolling: true,
      pollInterval: interval,
      error: null,
    });
  },

  stopPolling: () => {
    const { pollInterval } = get();

    if (pollInterval) {
      clearInterval(pollInterval);
      log.info('pulse: stopped resource polling');
    }

    set({
      isPolling: false,
      pollInterval: null,
    });
  },

  fetchSnapshot: async () => {
    try {
      const snapshot = await invoke<ResourceSnapshot>('get_resource_snapshot');
      log.info(
        {
          cpu: snapshot.cpuPercent,
          mem: snapshot.memUsedMb,
          diskRead: snapshot.diskReadKb,
          diskWrite: snapshot.diskWriteKb,
        },
        'pulse: snapshot received',
      );

      void checkAndNotify(snapshot);

      set((state) => {
        // 新しいスナップショットを追加し、最大数を超えた場合は古いものを削除
        const newSnapshots = [...state.snapshots, snapshot];
        if (newSnapshots.length > MAX_SNAPSHOTS) {
          newSnapshots.splice(0, newSnapshots.length - MAX_SNAPSHOTS);
        }

        return {
          snapshots: newSnapshots,
          error: null,
        };
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      log.error({ err }, 'pulse: fetch snapshot failed');
      set({ error: message });
    }
  },

  clearSnapshots: () => {
    log.info('pulse: clearing snapshots');
    set({ snapshots: [] });
  },
}));

// ─── Cleanup on unmount ───────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    usePulseStore.getState().stopPolling();
  });
}
