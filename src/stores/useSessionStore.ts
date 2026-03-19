import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import type { SavedFrameTimeSession, SessionComparisonResult, SessionListItem } from '../types';

interface SessionState {
  // データ
  sessionList: SessionListItem[];
  selectedSession: SavedFrameTimeSession | null;
  comparisonResult: SessionComparisonResult | null;

  // 状態
  isLoading: boolean;
  error: string | null;

  // アクション
  fetchSessions: () => Promise<void>;
  getSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  compareSessions: (sessionAId: string, sessionBId: string) => Promise<void>;
  updateSessionNote: (sessionId: string, note: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  // 初期状態
  sessionList: [],
  selectedSession: null,
  comparisonResult: null,
  isLoading: false,
  error: null,

  // セッション一覧を取得
  fetchSessions: async () => {
    set({ isLoading: true, error: null });

    try {
      const sessions = await invoke<SessionListItem[]>('list_sessions');
      log.info(`Fetched sessions: ${sessions.length}`);
      set({ sessionList: sessions, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sessions';
      log.error(`Failed to fetch sessions: ${errorMessage}`);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // セッション詳細を取得
  getSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const session = await invoke<SavedFrameTimeSession>('get_session', {
        sessionId,
      });
      log.info(`Fetched session: ${sessionId}`);
      set({ selectedSession: session, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get session';
      log.error(`Failed to get session ${sessionId}: ${errorMessage}`);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // セッションを削除
  deleteSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });

    try {
      await invoke('delete_session', { sessionId });
      log.info(`Deleted session: ${sessionId}`);

      // リストから削除
      const { sessionList } = get();
      const updatedList = sessionList.filter((s) => s.id !== sessionId);
      set({
        sessionList: updatedList,
        selectedSession: null,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
      log.error(`Failed to delete session ${sessionId}: ${errorMessage}`);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // セッションを比較
  compareSessions: async (sessionAId: string, sessionBId: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await invoke<SessionComparisonResult>('compare_sessions', {
        sessionAId,
        sessionBId,
      });
      log.info(`Compared sessions: ${sessionAId} vs ${sessionBId}`);
      set({ comparisonResult: result, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to compare sessions';
      log.error(`Failed to compare sessions ${sessionAId} vs ${sessionBId}: ${errorMessage}`);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // セッションノートを更新
  updateSessionNote: async (sessionId: string, note: string) => {
    set({ isLoading: true, error: null });

    try {
      await invoke('update_session_note', { sessionId, note });
      log.info(`Updated session note: ${sessionId}`);

      // 選択中のセッションを更新
      const { selectedSession } = get();
      if (selectedSession && selectedSession.id === sessionId) {
        const updatedSession = { ...selectedSession, note };
        set({ selectedSession: updatedSession, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update session note';
      log.error(`Failed to update session note ${sessionId}: ${errorMessage}`);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },

  // 状態をリセット
  reset: () => {
    set({
      sessionList: [],
      selectedSession: null,
      comparisonResult: null,
      isLoading: false,
      error: null,
    });
  },
}));

export const useSessionState = () =>
  useSessionStore(
    useShallow((s) => ({
      sessionList: s.sessionList,
      selectedSession: s.selectedSession,
      comparisonResult: s.comparisonResult,
      isLoading: s.isLoading,
      error: s.error,
    })),
  );

export const useSessionActions = () =>
  useSessionStore(
    useShallow((s) => ({
      fetchSessions: s.fetchSessions,
      getSession: s.getSession,
      deleteSession: s.deleteSession,
      compareSessions: s.compareSessions,
      updateSessionNote: s.updateSessionNote,
      clearError: s.clearError,
      reset: s.reset,
    })),
  );
