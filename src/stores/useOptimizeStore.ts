import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { commands } from '../lib/tauri-commands';
import type { ApplyResult, OptCandidate, OptSession } from '../types';

interface OptimizeStore {
  candidates: OptCandidate[];
  selected: Set<string>;
  isLoadingCandidates: boolean;
  isApplying: boolean;
  isReverting: boolean;
  lastResult: ApplyResult | null;
  history: OptSession[];
  error: string | null;
  fetchCandidates: () => Promise<void>;
  toggleCandidate: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  applySelected: () => Promise<void>;
  revertAll: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
}

export const useOptimizeStore = create<OptimizeStore>((set, get) => ({
  candidates: [],
  selected: new Set(),
  isLoadingCandidates: false,
  isApplying: false,
  isReverting: false,
  lastResult: null,
  history: [],
  error: null,

  fetchCandidates: async () => {
    set({ isLoadingCandidates: true, error: null });
    try {
      const candidates = await commands.getOptimizationCandidates();
      const recommended = new Set(candidates.filter((c) => c.is_recommended).map((c) => c.id));
      set({ candidates, selected: recommended, isLoadingCandidates: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'fetch candidates failed: %s', msg);
      set({ isLoadingCandidates: false, error: msg });
    }
  },

  toggleCandidate: (id: string) => {
    const next = new Set(get().selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selected: next });
  },

  selectAll: () => {
    set({ selected: new Set(get().candidates.map((c) => c.id)) });
  },

  deselectAll: () => {
    set({ selected: new Set() });
  },

  applySelected: async () => {
    const ids = [...get().selected];
    if (ids.length === 0) return;
    set({ isApplying: true, error: null });
    try {
      const result = await commands.applyOptimizations(ids);
      set({ isApplying: false, lastResult: result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'apply optimizations failed: %s', msg);
      set({ isApplying: false, error: msg });
    }
  },

  revertAll: async () => {
    set({ isReverting: true, error: null });
    try {
      await commands.revertAll();
      set({ isReverting: false, lastResult: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'revert all failed: %s', msg);
      set({ isReverting: false, error: msg });
    }
  },

  fetchHistory: async () => {
    try {
      const history = await commands.getHistory();
      set({ history });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'fetch history failed: %s', msg);
      set({ error: msg });
    }
  },

  clearResult: () => set({ lastResult: null }),
  clearError: () => set({ error: null }),
}));

export const useOptimize = () =>
  useOptimizeStore(
    useShallow((s) => ({
      candidates: s.candidates,
      selected: s.selected,
      isLoadingCandidates: s.isLoadingCandidates,
      isApplying: s.isApplying,
      isReverting: s.isReverting,
      lastResult: s.lastResult,
      history: s.history,
      error: s.error,
    })),
  );
