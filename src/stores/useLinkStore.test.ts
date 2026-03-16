import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Snippet } from '../types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  readText: vi.fn(),
  writeText: vi.fn(),
}));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useLinkStore } from './useLinkStore';

const MOCK_SNIPPET: Snippet = {
  id: 'snippet-1',
  label: 'Test Snippet',
  content: 'Test content',
  category: 'text',
  createdAt: 1640995200000,
};

function resetStore(): void {
  useLinkStore.setState({
    history: [],
    snippets: [],
    isLoading: false,
    error: null,
    isWatching: false,
    watchInterval: null,
  });
}

describe('useLinkStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    vi.useFakeTimers();
  });

  it('starts with empty history and snippets', () => {
    const { history, snippets, isLoading, error, isWatching } = useLinkStore.getState();
    expect(history).toEqual([]);
    expect(snippets).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
    expect(isWatching).toBe(false);

    // クリーンアップ
    vi.useRealTimers();
  });

  it('fetchSnippets loads snippets from backend', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_SNIPPET]);

    await useLinkStore.getState().fetchSnippets();

    const state = useLinkStore.getState();
    expect(state.snippets).toHaveLength(1);
    expect(state.snippets[0]).toEqual(MOCK_SNIPPET);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchSnippets sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('API error'));

    await useLinkStore.getState().fetchSnippets();

    const state = useLinkStore.getState();
    expect(state.snippets).toEqual([]);
    expect(state.error).toBe('API error');
    expect(state.isLoading).toBe(false);
  });

  it('saveSnippet creates new snippet', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_SNIPPET);

    await useLinkStore.getState().saveSnippet('new-snippet', 'New Snippet', 'New content', 'code');

    const state = useLinkStore.getState();
    expect(state.snippets).toHaveLength(1);
    expect(state.snippets[0]).toEqual(MOCK_SNIPPET);
    expect(state.error).toBeNull();
  });

  it('saveSnippet updates existing snippet', async () => {
    const updatedSnippet = { ...MOCK_SNIPPET, label: 'Updated Snippet' };

    // 初期状態でスニペットを追加
    useLinkStore.setState({ snippets: [MOCK_SNIPPET] });

    vi.mocked(invoke).mockResolvedValueOnce(updatedSnippet);

    await useLinkStore
      .getState()
      .saveSnippet('snippet-1', 'Updated Snippet', 'Updated content', 'text');

    const state = useLinkStore.getState();
    expect(state.snippets).toHaveLength(1);
    expect(state.snippets[0].label).toBe('Updated Snippet');
  });

  it('deleteSnippet removes snippet from store', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    // 初期状態でスニペットを追加
    useLinkStore.setState({ snippets: [MOCK_SNIPPET] });

    await useLinkStore.getState().deleteSnippet('snippet-1');

    const state = useLinkStore.getState();
    expect(state.snippets).toHaveLength(0);
    expect(state.error).toBeNull();
  });

  it('deleteSnippet sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Delete failed'));

    useLinkStore.setState({ snippets: [MOCK_SNIPPET] });

    await useLinkStore.getState().deleteSnippet('snippet-1');

    const state = useLinkStore.getState();
    expect(state.snippets).toHaveLength(1); // スニペットは残ったまま
    expect(state.error).toBe('Delete failed');
  });

  it('copyToClipboard writes text to clipboard', async () => {
    vi.mocked(writeText).mockResolvedValueOnce(undefined);

    await useLinkStore.getState().copyToClipboard('test text');

    expect(writeText).toHaveBeenCalledWith('test text');
    expect(useLinkStore.getState().error).toBeNull();
  });

  it('copyToClipboard sets error on failure', async () => {
    vi.mocked(writeText).mockRejectedValueOnce(new Error('Copy failed'));

    await useLinkStore.getState().copyToClipboard('test text');

    expect(useLinkStore.getState().error).toBe('Copy failed');
  });

  it('startWatching begins clipboard monitoring', () => {
    vi.mocked(readText).mockResolvedValueOnce('test clipboard content');

    useLinkStore.getState().startWatching();

    const state = useLinkStore.getState();
    expect(state.isWatching).toBe(true);
    expect(state.watchInterval).not.toBeNull();

    // クリーンアップ
    vi.useRealTimers();
    useLinkStore.getState().stopWatching();
  });

  it('stopWatching stops clipboard monitoring', () => {
    useLinkStore.getState().startWatching();
    expect(useLinkStore.getState().isWatching).toBe(true);

    useLinkStore.getState().stopWatching();

    const state = useLinkStore.getState();
    expect(state.isWatching).toBe(false);
    expect(state.watchInterval).toBeNull();

    // クリーンアップ
    vi.useRealTimers();
  });

  it('checkClipboard updates history with new content', async () => {
    vi.mocked(readText).mockResolvedValueOnce('new content');

    await useLinkStore.getState().checkClipboard();

    const state = useLinkStore.getState();
    expect(state.history).toEqual(['new content']);
  });

  it('checkClipboard ignores empty content', async () => {
    vi.mocked(readText).mockResolvedValueOnce('');

    await useLinkStore.getState().checkClipboard();

    const state = useLinkStore.getState();
    expect(state.history).toEqual([]);
  });

  it('checkClipboard ignores duplicate content', async () => {
    // 初期状態で履歴を設定
    useLinkStore.setState({ history: ['existing content'] });

    vi.mocked(readText).mockResolvedValueOnce('existing content');

    await useLinkStore.getState().checkClipboard();

    const state = useLinkStore.getState();
    expect(state.history).toEqual(['existing content']); // 変更なし
  });

  it('checkClipboard limits history to MAX_HISTORY items', async () => {
    // 最大50件の履歴を設定
    const fullHistory = Array.from({ length: 50 }, (_, i) => `content ${i}`);
    useLinkStore.setState({ history: fullHistory });

    vi.mocked(readText).mockResolvedValueOnce('new content');

    await useLinkStore.getState().checkClipboard();

    const state = useLinkStore.getState();
    expect(state.history).toHaveLength(50); // 最大50件を維持
    expect(state.history[0]).toBe('new content'); // 新しい内容が先頭
  });
});
