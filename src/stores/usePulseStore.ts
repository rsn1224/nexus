import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import { checkAndNotify } from '../services/notificationService';
import type { ResourceSnapshot } from '../types';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface PulseStore {
  snapshots: ResourceSnapshot[];
  isListening: boolean;
  error: string | null;
  unlisten: (() => void) | null;

  subscribe: () => void;
  unsubscribe: () => void;
  clearSnapshots: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SNAPSHOTS = 60;

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePulseStore = create<PulseStore>((set, get) => ({
  snapshots: [],
  isListening: false,
  error: null,
  unlisten: null,

  subscribe: () => {
    if (get().isListening) {
      log.warn('pulse: already listening');
      return;
    }

    log.info('pulse: subscribing to nexus://pulse');

    set({ isListening: true, error: null });

    listen<ResourceSnapshot>('nexus://pulse', (event) => {
      const snapshot = event.payload;

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
        const newSnapshots = [...state.snapshots, snapshot];
        if (newSnapshots.length > MAX_SNAPSHOTS) {
          newSnapshots.splice(0, newSnapshots.length - MAX_SNAPSHOTS);
        }
        return { snapshots: newSnapshots, error: null };
      });
    })
      .then((fn) => {
        set({ unlisten: fn });
      })
      .catch((err) => {
        const errorMessage = extractErrorMessage(err);
        log.error({ err }, 'pulse: listen failed: %s', errorMessage);
        set({
          snapshots: [],
          isListening: false,
          error: errorMessage,
        });
      });
  },

  unsubscribe: () => {
    const { unlisten } = get();
    if (unlisten) {
      unlisten();
      set({ unlisten: null });
      log.info('pulse: unsubscribed');
    }
    set({ isListening: false });
  },

  clearSnapshots: () => {
    log.info('pulse: clearing snapshots');
    set({ snapshots: [] });
  },
}));

// useShallow セレクタ
export const usePulseState = () =>
  usePulseStore(
    useShallow((s) => ({
      snapshots: s.snapshots,
      isListening: s.isListening,
      error: s.error,
    })),
  );

export const usePulseActions = () =>
  usePulseStore(
    useShallow((s) => ({
      subscribe: s.subscribe,
      unsubscribe: s.unsubscribe,
      clearSnapshots: s.clearSnapshots,
    })),
  );

// ─── Cleanup on unload ─────────────────────────────────────────────────────--

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    usePulseStore.getState().unsubscribe();
  });
}
