import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { GameSession, SessionListItem } from '../types/v2';
import type { HistoryStore } from './types/historyStore';

// =============================================================================
// useHistoryStore — セッション履歴管理
// =============================================================================

export const useHistoryStore = create<HistoryStore>((set) => ({
  sessions: [],
  selectedSession: null,
  trendRange: '7d',
  loading: false,
  error: null,

  fetchSessions: async (): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const sessions = await invoke<SessionListItem[]>('list_sessions');
      log.info({ count: sessions.length }, 'history: sessions fetched');
      set({ sessions, loading: false });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'history: fetchSessions failed: %s', msg);
      set({ loading: false, error: msg });
    }
  },

  selectSession: async (sessionId: string): Promise<void> => {
    set({ loading: true, error: null });
    try {
      const session = await invoke<GameSession>('get_session', {
        sessionId,
      });
      log.info({ sessionId }, 'history: session selected');
      set({ selectedSession: session, loading: false });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'history: selectSession failed: %s', msg);
      set({ loading: false, error: msg });
    }
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    set({ loading: true, error: null });
    try {
      await invoke('delete_session', { sessionId });
      log.info({ sessionId }, 'history: session deleted');
      set((state) => ({
        loading: false,
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        selectedSession: state.selectedSession?.id === sessionId ? null : state.selectedSession,
      }));
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'history: deleteSession failed: %s', msg);
      set({ loading: false, error: msg });
    }
  },

  updateNote: async (sessionId: string, note: string): Promise<void> => {
    set({ error: null });
    try {
      await invoke('update_session_note', { sessionId, note });
      log.info({ sessionId }, 'history: note updated');
      set((state) => ({
        selectedSession:
          state.selectedSession?.id === sessionId
            ? { ...state.selectedSession, note }
            : state.selectedSession,
      }));
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'history: updateNote failed: %s', msg);
      set({ error: msg });
    }
  },

  setTrendRange: (range: '7d' | '30d'): void => {
    log.info({ range }, 'history: trendRange changed');
    set({ trendRange: range });
  },

  clearSelection: (): void => {
    set({ selectedSession: null });
  },

  clearError: (): void => {
    set({ error: null });
  },
}));

// ─── useShallow セレクタ ───────────────────────────────────────────────────

export const useHistoryState = () =>
  useHistoryStore(
    useShallow((s) => ({
      sessions: s.sessions,
      selectedSession: s.selectedSession,
      trendRange: s.trendRange,
      loading: s.loading,
      error: s.error,
    })),
  );

export const useHistoryActions = () =>
  useHistoryStore(
    useShallow((s) => ({
      fetchSessions: s.fetchSessions,
      selectSession: s.selectSession,
      deleteSession: s.deleteSession,
      updateNote: s.updateNote,
      setTrendRange: s.setTrendRange,
      clearSelection: s.clearSelection,
      clearError: s.clearError,
    })),
  );

// ─── ゲッター（コンポーネント外からも使用可） ─────────────────────────────

export const getSelectedSession = (): GameSession | null =>
  useHistoryStore.getState().selectedSession;
