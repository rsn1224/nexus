import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/tauri-commands', () => ({
  commands: {
    getOptimizationCandidates: vi.fn(),
    applyOptimizations: vi.fn(),
    revertAll: vi.fn(),
    getHistory: vi.fn(),
  },
}));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { commands } from '../lib/tauri-commands';
import type { ApplyResult, OptCandidate, OptSession } from '../types';
import { useOptimizeStore } from './useOptimizeStore';

const MOCK_CANDIDATES: OptCandidate[] = [
  { id: 'opt-1', label: '最適化A', description: '説明A', current_state: 'off', is_recommended: true },
  { id: 'opt-2', label: '最適化B', description: '説明B', current_state: 'off', is_recommended: false },
  { id: 'opt-3', label: '最適化C', description: '説明C', current_state: 'on', is_recommended: true },
];

const MOCK_APPLY_RESULT: ApplyResult = {
  applied: [{ id: 'opt-1', before: 'off', after: 'on' }],
  failed: [],
  session_id: 'sess-abc',
};

const MOCK_HISTORY: OptSession[] = [
  {
    id: 'sess-abc',
    timestamp: 1700000000000,
    applied: [{ id: 'opt-1', before: 'off', after: 'on' }],
    failed: [],
  },
];

function resetStore(): void {
  useOptimizeStore.setState({
    candidates: [],
    selected: new Set(),
    isLoadingCandidates: false,
    isApplying: false,
    isReverting: false,
    lastResult: null,
    history: [],
    error: null,
  });
}

describe('useOptimizeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  // ── 初期状態 ──────────────────────────────────────────────────────────────

  it('starts with empty state', () => {
    const s = useOptimizeStore.getState();
    expect(s.candidates).toEqual([]);
    expect(s.selected.size).toBe(0);
    expect(s.isLoadingCandidates).toBe(false);
    expect(s.isApplying).toBe(false);
    expect(s.isReverting).toBe(false);
    expect(s.lastResult).toBeNull();
    expect(s.error).toBeNull();
  });

  // ── fetchCandidates ───────────────────────────────────────────────────────

  it('fetchCandidates stores candidates and pre-selects recommended', async () => {
    vi.mocked(commands.getOptimizationCandidates).mockResolvedValueOnce(MOCK_CANDIDATES);
    await useOptimizeStore.getState().fetchCandidates();
    const s = useOptimizeStore.getState();
    expect(s.candidates).toEqual(MOCK_CANDIDATES);
    // is_recommended の opt-1, opt-3 だけ選択済み
    expect(s.selected.has('opt-1')).toBe(true);
    expect(s.selected.has('opt-3')).toBe(true);
    expect(s.selected.has('opt-2')).toBe(false);
    expect(s.isLoadingCandidates).toBe(false);
    expect(s.error).toBeNull();
  });

  it('fetchCandidates sets error on failure', async () => {
    vi.mocked(commands.getOptimizationCandidates).mockRejectedValueOnce(new Error('fetch error'));
    await useOptimizeStore.getState().fetchCandidates();
    const s = useOptimizeStore.getState();
    expect(s.error).toBe('fetch error');
    expect(s.isLoadingCandidates).toBe(false);
  });

  // ── toggleCandidate ───────────────────────────────────────────────────────

  it('toggleCandidate adds unselected item to selection', () => {
    useOptimizeStore.setState({ candidates: MOCK_CANDIDATES, selected: new Set(['opt-1']) });
    useOptimizeStore.getState().toggleCandidate('opt-2');
    expect(useOptimizeStore.getState().selected.has('opt-2')).toBe(true);
  });

  it('toggleCandidate removes already-selected item from selection', () => {
    useOptimizeStore.setState({ candidates: MOCK_CANDIDATES, selected: new Set(['opt-1', 'opt-2']) });
    useOptimizeStore.getState().toggleCandidate('opt-1');
    expect(useOptimizeStore.getState().selected.has('opt-1')).toBe(false);
    expect(useOptimizeStore.getState().selected.has('opt-2')).toBe(true);
  });

  it('selectAll selects all candidates', () => {
    useOptimizeStore.setState({ candidates: MOCK_CANDIDATES, selected: new Set() });
    useOptimizeStore.getState().selectAll();
    const ids = useOptimizeStore.getState().selected;
    expect(ids.has('opt-1')).toBe(true);
    expect(ids.has('opt-2')).toBe(true);
    expect(ids.has('opt-3')).toBe(true);
  });

  it('deselectAll clears all selections', () => {
    useOptimizeStore.setState({ candidates: MOCK_CANDIDATES, selected: new Set(['opt-1', 'opt-2']) });
    useOptimizeStore.getState().deselectAll();
    expect(useOptimizeStore.getState().selected.size).toBe(0);
  });

  // ── applySelected ─────────────────────────────────────────────────────────

  it('applySelected calls apply with selected ids and stores result', async () => {
    useOptimizeStore.setState({ selected: new Set(['opt-1']) });
    vi.mocked(commands.applyOptimizations).mockResolvedValueOnce(MOCK_APPLY_RESULT);
    await useOptimizeStore.getState().applySelected();
    expect(commands.applyOptimizations).toHaveBeenCalledWith(['opt-1']);
    const s = useOptimizeStore.getState();
    expect(s.lastResult).toEqual(MOCK_APPLY_RESULT);
    expect(s.isApplying).toBe(false);
    expect(s.error).toBeNull();
  });

  it('applySelected does nothing when selection is empty', async () => {
    useOptimizeStore.setState({ selected: new Set() });
    await useOptimizeStore.getState().applySelected();
    expect(commands.applyOptimizations).not.toHaveBeenCalled();
  });

  it('applySelected sets error on failure', async () => {
    useOptimizeStore.setState({ selected: new Set(['opt-1']) });
    vi.mocked(commands.applyOptimizations).mockRejectedValueOnce(new Error('apply error'));
    await useOptimizeStore.getState().applySelected();
    expect(useOptimizeStore.getState().error).toBe('apply error');
    expect(useOptimizeStore.getState().isApplying).toBe(false);
  });

  // ── revertAll ─────────────────────────────────────────────────────────────

  it('revertAll clears lastResult on success', async () => {
    useOptimizeStore.setState({ lastResult: MOCK_APPLY_RESULT });
    vi.mocked(commands.revertAll).mockResolvedValueOnce({ reverted: ['opt-1'], failed: [] });
    await useOptimizeStore.getState().revertAll();
    const s = useOptimizeStore.getState();
    expect(s.lastResult).toBeNull();
    expect(s.isReverting).toBe(false);
    expect(s.error).toBeNull();
  });

  it('revertAll sets error on failure', async () => {
    vi.mocked(commands.revertAll).mockRejectedValueOnce(new Error('revert error'));
    await useOptimizeStore.getState().revertAll();
    expect(useOptimizeStore.getState().error).toBe('revert error');
    expect(useOptimizeStore.getState().isReverting).toBe(false);
  });

  // ── ユーティリティ ────────────────────────────────────────────────────────

  it('clearResult sets lastResult to null', () => {
    useOptimizeStore.setState({ lastResult: MOCK_APPLY_RESULT });
    useOptimizeStore.getState().clearResult();
    expect(useOptimizeStore.getState().lastResult).toBeNull();
  });

  it('clearError sets error to null', () => {
    useOptimizeStore.setState({ error: 'some error' });
    useOptimizeStore.getState().clearError();
    expect(useOptimizeStore.getState().error).toBeNull();
  });

  // ── fetchHistory ──────────────────────────────────────────────────────────

  it('fetchHistory stores history on success', async () => {
    vi.mocked(commands.getHistory).mockResolvedValueOnce(MOCK_HISTORY);
    await useOptimizeStore.getState().fetchHistory();
    expect(useOptimizeStore.getState().history).toEqual(MOCK_HISTORY);
  });

  it('fetchHistory sets error on failure', async () => {
    vi.mocked(commands.getHistory).mockRejectedValueOnce(new Error('history error'));
    await useOptimizeStore.getState().fetchHistory();
    expect(useOptimizeStore.getState().error).toBe('history error');
  });
});
