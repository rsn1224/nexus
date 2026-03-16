import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SignalFeed } from '../types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useSignalStore } from './useSignalStore';

const MOCK_FEEDS: SignalFeed[] = [
  {
    id: 'feed-1',
    label: 'Tech News',
    url: 'https://example.com/feed',
    kind: 'rss',
    intervalSecs: 300,
    lastChecked: 1640995200,
    isActive: true,
    lastResult: {
      title: 'Latest Article',
      link: 'https://example.com/article',
      description: 'Article description',
      published: 1640995200,
      guid: 'article-1',
    },
  },
  {
    id: 'feed-2',
    label: 'Status Check',
    url: 'https://example.com/status',
    kind: 'http',
    intervalSecs: 600,
    lastChecked: 1640995100,
    isActive: false,
    lastResult: {
      title: 'HTTP 200',
      link: 'https://example.com/status',
      description: 'Status: OK',
      published: 1640995100,
      guid: 'status-1',
    },
  },
];

function resetStore(): void {
  useSignalStore.setState({
    feeds: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });
}

describe('useSignalStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const state = useSignalStore.getState();
    expect(state.feeds).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastUpdated).toBeNull();
  });

  it('fetchFeeds loads feeds from backend', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_FEEDS);
    await useSignalStore.getState().fetchFeeds();

    const state = useSignalStore.getState();
    expect(state.feeds).toEqual(MOCK_FEEDS);
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.lastUpdated).toBeGreaterThan(0);
  });

  it('fetchFeeds handles errors', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Network error'));
    await useSignalStore.getState().fetchFeeds();

    const state = useSignalStore.getState();
    expect(state.feeds).toEqual([]);
    expect(state.error).toBe('Network error');
    expect(state.isLoading).toBe(false);
  });

  it('fetchFeeds clears previous error on success', async () => {
    useSignalStore.setState({ error: 'old error' });
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_FEEDS);
    await useSignalStore.getState().fetchFeeds();

    expect(useSignalStore.getState().error).toBeNull();
  });

  it('addFeed creates new feed', async () => {
    const newFeed: SignalFeed = {
      id: 'new-feed',
      label: 'New Feed',
      url: 'https://example.com/new',
      kind: 'rss',
      intervalSecs: 300,
      lastChecked: 0,
      isActive: true,
    };

    vi.mocked(invoke).mockResolvedValueOnce(newFeed);
    await useSignalStore.getState().addFeed('New Feed', 'https://example.com/new', 'rss', 300);

    const state = useSignalStore.getState();
    expect(state.feeds).toHaveLength(1);
    expect(state.feeds[0]).toEqual(newFeed);
    expect(state.error).toBeNull();
  });

  it('addFeed handles errors', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Invalid URL'));
    await useSignalStore.getState().addFeed('Invalid', 'invalid-url', 'rss', 300);

    const state = useSignalStore.getState();
    expect(state.feeds).toEqual([]);
    expect(state.error).toBe('Invalid URL');
  });

  it('removeFeed deletes feed', async () => {
    useSignalStore.setState({ feeds: MOCK_FEEDS });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useSignalStore.getState().removeFeed('feed-1');

    const state = useSignalStore.getState();
    expect(state.feeds).toHaveLength(1);
    expect(state.feeds[0].id).toBe('feed-2');
  });

  it('toggleFeed changes active status', async () => {
    useSignalStore.setState({ feeds: MOCK_FEEDS });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useSignalStore.getState().toggleFeed('feed-1');

    const state = useSignalStore.getState();
    const toggledFeed = state.feeds.find((f) => f.id === 'feed-1');
    expect(toggledFeed?.isActive).toBe(false);
  });

  it('checkFeedNow updates feed with latest result', async () => {
    useSignalStore.setState({ feeds: MOCK_FEEDS });
    const newResults = [
      {
        title: 'Updated Article',
        link: 'https://example.com/updated',
        description: 'Updated description',
        published: 1640995300,
        guid: 'updated-1',
      },
    ];

    vi.mocked(invoke).mockResolvedValueOnce(newResults);
    const results = await useSignalStore.getState().checkFeedNow('feed-1');

    const state = useSignalStore.getState();
    const updatedFeed = state.feeds.find((f) => f.id === 'feed-1');
    expect(updatedFeed?.lastResult).toEqual(newResults[0]);
    expect(updatedFeed?.lastChecked).toBeGreaterThan(1640995200);
    expect(results).toEqual(newResults);
  });

  it('checkFeedNow handles errors', async () => {
    useSignalStore.setState({ feeds: MOCK_FEEDS });
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Fetch failed'));

    await expect(useSignalStore.getState().checkFeedNow('feed-1')).rejects.toThrow('Fetch failed');

    const state = useSignalStore.getState();
    expect(state.error).toBe('Fetch failed');
  });

  it('checkFeedNow throws error on failure', async () => {
    useSignalStore.setState({ feeds: MOCK_FEEDS });
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Network error'));

    await expect(useSignalStore.getState().checkFeedNow('feed-1')).rejects.toThrow('Network error');
  });

  it('accepts empty feeds list', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([]);
    await useSignalStore.getState().fetchFeeds();

    expect(useSignalStore.getState().feeds).toEqual([]);
    expect(useSignalStore.getState().error).toBeNull();
  });
});
