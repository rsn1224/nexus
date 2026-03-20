import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import type { GameSession, SessionListItem } from '../types/v2';
import { useHistoryStore } from './useHistoryStore';

const MOCK_SUMMARY = {
  avgFps: 60,
  pct1Low: 45,
  pct01Low: 30,
  totalStutterCount: 5,
  maxFrameTimeMs: 33,
  minFps: 25,
  totalFrames: 10000,
};

const MOCK_SESSIONS: SessionListItem[] = [
  {
    id: 'session-1',
    gameName: 'Game A',
    startedAt: '2026-03-20T10:00:00Z',
    endedAt: '2026-03-20T11:00:00Z',
    summary: MOCK_SUMMARY,
  },
  {
    id: 'session-2',
    gameName: 'Game B',
    startedAt: '2026-03-20T12:00:00Z',
    endedAt: '2026-03-20T12:30:00Z',
    summary: MOCK_SUMMARY,
  },
];

const MOCK_GAME_SESSION: GameSession = {
  id: 'session-1',
  gameName: 'Game A',
  startedAt: '2026-03-20T10:00:00Z',
  endedAt: '2026-03-20T11:00:00Z',
  durationMinutes: 60,
  healthScoreStart: 80,
  healthScoreEnd: 85,
  optimizationsApplied: ['boost'],
  summary: MOCK_SUMMARY,
  avgCpuTemp: 55,
  avgGpuTemp: 65,
  note: '',
};

function resetStore(): void {
  useHistoryStore.setState({
    sessions: [],
    selectedSession: null,
    trendRange: '7d',
    loading: false,
    error: null,
  });
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('初期状態', () => {
    const state = useHistoryStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.selectedSession).toBeNull();
    expect(state.trendRange).toBe('7d');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchSessions: 成功', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_SESSIONS);
    await useHistoryStore.getState().fetchSessions();
    const state = useHistoryStore.getState();
    expect(state.sessions).toHaveLength(2);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchSessions: エラー', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('DB error'));
    await useHistoryStore.getState().fetchSessions();
    const state = useHistoryStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeTruthy();
  });

  it('selectSession: 成功', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_GAME_SESSION);
    await useHistoryStore.getState().selectSession('session-1');
    expect(useHistoryStore.getState().selectedSession).toEqual(MOCK_GAME_SESSION);
    expect(useHistoryStore.getState().loading).toBe(false);
  });

  it('deleteSession: セッション削除', async () => {
    useHistoryStore.setState({ sessions: MOCK_SESSIONS });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useHistoryStore.getState().deleteSession('session-1');
    const state = useHistoryStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0].id).toBe('session-2');
  });

  it('deleteSession: 選択中のセッションを削除すると selectedSession=null', async () => {
    useHistoryStore.setState({ sessions: MOCK_SESSIONS, selectedSession: MOCK_GAME_SESSION });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useHistoryStore.getState().deleteSession('session-1');
    expect(useHistoryStore.getState().selectedSession).toBeNull();
  });

  it('setTrendRange: 値を変更', () => {
    useHistoryStore.getState().setTrendRange('30d');
    expect(useHistoryStore.getState().trendRange).toBe('30d');
  });

  it('clearSelection: 選択解除', () => {
    useHistoryStore.setState({ selectedSession: MOCK_GAME_SESSION });
    useHistoryStore.getState().clearSelection();
    expect(useHistoryStore.getState().selectedSession).toBeNull();
  });

  it('clearError: エラーをクリア', () => {
    useHistoryStore.setState({ error: 'some error' });
    useHistoryStore.getState().clearError();
    expect(useHistoryStore.getState().error).toBeNull();
  });
});
