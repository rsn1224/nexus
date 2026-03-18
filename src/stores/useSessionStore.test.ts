import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

import { invoke } from '@tauri-apps/api/core';
import type { SavedFrameTimeSession, SessionComparisonResult, SessionListItem } from '../types';
import { useSessionStore } from './useSessionStore';

const MOCK_SUMMARY = {
  avgFps: 120,
  pct1Low: 90,
  pct01Low: 60,
  totalStutterCount: 2,
  maxFrameTimeMs: 33,
  minFps: 58,
  totalFrames: 7200,
};

const MOCK_SESSION_ITEM: SessionListItem = {
  id: 'sess-1',
  gameName: 'Test Game',
  startedAt: 1_700_000_000,
  endedAt: 1_700_003_600,
  summary: MOCK_SUMMARY,
};

const MOCK_SESSION_DETAIL: SavedFrameTimeSession = {
  id: 'sess-1',
  gameName: 'Test Game',
  startedAt: 1_700_000_000,
  endedAt: 1_700_003_600,
  playSecs: 3600,
  summary: MOCK_SUMMARY,
  percentiles: [],
  fpsTimeline: [],
  note: '',
};

const MOCK_COMPARISON: SessionComparisonResult = {
  sessionA: MOCK_SUMMARY,
  sessionB: MOCK_SUMMARY,
  fpsDeltaPct: 0,
  pct1LowDeltaPct: 0,
  pct01LowDeltaPct: 0,
  stutterDelta: 0,
  autoSummary: 'equal',
};

function resetStore(): void {
  useSessionStore.setState({
    sessionList: [],
    selectedSession: null,
    comparisonResult: null,
    isLoading: false,
    error: null,
  });
}

describe('useSessionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { sessionList, selectedSession, isLoading, error } = useSessionStore.getState();
    expect(sessionList).toEqual([]);
    expect(selectedSession).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchSessions stores session list on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_SESSION_ITEM]);
    await useSessionStore.getState().fetchSessions();
    expect(useSessionStore.getState().sessionList).toEqual([MOCK_SESSION_ITEM]);
    expect(invoke).toHaveBeenCalledWith('list_sessions');
    expect(useSessionStore.getState().isLoading).toBe(false);
  });

  it('fetchSessions sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('fetch failed'));
    await useSessionStore.getState().fetchSessions();
    expect(useSessionStore.getState().error).toBe('fetch failed');
    expect(useSessionStore.getState().isLoading).toBe(false);
  });

  it('getSession stores selected session on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_SESSION_DETAIL);
    await useSessionStore.getState().getSession('sess-1');
    expect(useSessionStore.getState().selectedSession).toEqual(MOCK_SESSION_DETAIL);
    expect(invoke).toHaveBeenCalledWith('get_session', { sessionId: 'sess-1' });
  });

  it('deleteSession removes session from list', async () => {
    useSessionStore.setState({ sessionList: [MOCK_SESSION_ITEM] });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useSessionStore.getState().deleteSession('sess-1');
    expect(useSessionStore.getState().sessionList).toEqual([]);
    expect(invoke).toHaveBeenCalledWith('delete_session', { sessionId: 'sess-1' });
  });

  it('compareSessions stores result', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_COMPARISON);
    await useSessionStore.getState().compareSessions('sess-1', 'sess-2');
    expect(useSessionStore.getState().comparisonResult).toEqual(MOCK_COMPARISON);
    expect(invoke).toHaveBeenCalledWith('compare_sessions', {
      sessionAId: 'sess-1',
      sessionBId: 'sess-2',
    });
  });

  it('updateSessionNote updates note on selected session', async () => {
    useSessionStore.setState({ selectedSession: MOCK_SESSION_DETAIL });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useSessionStore.getState().updateSessionNote('sess-1', 'great run');
    expect(useSessionStore.getState().selectedSession?.note).toBe('great run');
  });

  it('clearError resets error state', () => {
    useSessionStore.setState({ error: 'some error' });
    useSessionStore.getState().clearError();
    expect(useSessionStore.getState().error).toBeNull();
  });

  it('reset restores initial state', () => {
    useSessionStore.setState({ sessionList: [MOCK_SESSION_ITEM], isLoading: true });
    useSessionStore.getState().reset();
    expect(useSessionStore.getState().sessionList).toEqual([]);
    expect(useSessionStore.getState().isLoading).toBe(false);
  });
});
