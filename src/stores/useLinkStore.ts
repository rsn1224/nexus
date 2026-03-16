import { invoke } from '@tauri-apps/api/core';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { create } from 'zustand';
import log from '../lib/logger';
import type { Snippet } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_HISTORY = 50;
const WATCH_INTERVAL = 1000; // 1秒

// ─── Store shape ──────────────────────────────────────────────────────────────

interface LinkStore {
  history: string[]; // クリップボード履歴（最大 50 件）
  snippets: Snippet[];
  isLoading: boolean;
  error: string | null;
  isWatching: boolean;
  watchInterval: number | null; // setInterval ID

  startWatching: () => void;
  stopWatching: () => void;
  checkClipboard: () => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
  fetchSnippets: () => Promise<void>;
  saveSnippet: (id: string, label: string, content: string, category: string) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLinkStore = create<LinkStore>((set, get) => ({
  history: [],
  snippets: [],
  isLoading: false,
  error: null,
  isWatching: false,
  watchInterval: null,

  startWatching: () => {
    const { isWatching, watchInterval } = get();

    if (isWatching || watchInterval) {
      log.warn('link: clipboard watching already running');
      return;
    }

    log.info('link: starting clipboard watching');

    // 初回クリップボード読み込み
    void get().checkClipboard();

    // 1秒ポーリング開始
    const interval = setInterval(() => {
      void get().checkClipboard();
    }, WATCH_INTERVAL) as unknown as number;

    set({ isWatching: true, watchInterval: interval });
  },

  stopWatching: () => {
    const { watchInterval } = get();

    if (watchInterval) {
      clearInterval(watchInterval);
      log.info('link: stopped clipboard watching');
    }

    set({ isWatching: false, watchInterval: null });
  },

  checkClipboard: async () => {
    try {
      const text = await readText();
      const { history } = get();

      // 空文字列または重複チェック
      if (!text || text.trim() === '') {
        return;
      }

      // 履歴の先頭と比較して重複をチェック
      if (history.length > 0 && history[0] === text) {
        return;
      }

      // 履歴を更新
      const newHistory = [text, ...history.filter((item) => item !== text)].slice(0, MAX_HISTORY);
      set({ history: newHistory });

      log.info(
        { length: text.length, historyLength: newHistory.length },
        'link: clipboard updated',
      );
    } catch (err) {
      log.error({ err }, 'link: failed to read clipboard');
      // エラーはセットしない（頻繁すぎるため）
    }
  },

  copyToClipboard: async (text: string) => {
    try {
      await writeText(text);
      log.info({ length: text.length }, 'link: text copied to clipboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'link: failed to copy to clipboard');
      set({ error: message });
    }
  },

  fetchSnippets: async () => {
    set({ isLoading: true, error: null });
    try {
      const snippets = await invoke<Snippet[]>('list_snippets');
      log.info({ count: snippets.length }, 'link: snippets fetched');
      set({ snippets, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'link: fetch snippets failed');
      set({ error: message, isLoading: false });
    }
  },

  saveSnippet: async (id, label, content, category) => {
    try {
      const snippet = await invoke<Snippet>('save_snippet', {
        id,
        label,
        content,
        category,
      });
      log.info({ id, label, category }, 'link: snippet saved');

      set((state) => ({
        snippets: state.snippets.some((s) => s.id === id)
          ? state.snippets.map((s) => (s.id === id ? snippet : s))
          : [...state.snippets, snippet],
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'link: save snippet failed');
      set({ error: message });
    }
  },

  deleteSnippet: async (id) => {
    try {
      await invoke('delete_snippet', { id });
      log.info({ id }, 'link: snippet deleted');
      set((state) => ({
        snippets: state.snippets.filter((snippet) => snippet.id !== id),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'link: delete snippet failed');
      set({ error: message });
    }
  },
}));

// ─── Cleanup on unmount ───────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    useLinkStore.getState().stopWatching();
  });
}
