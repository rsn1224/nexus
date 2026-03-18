import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../lib/tauri', () => ({
  extractErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

import { invoke } from '@tauri-apps/api/core';
import type { WinSetting } from '../types';
import { useWinoptStore } from './useWinoptStore';

const MOCK_WIN_SETTING: WinSetting = {
  id: 'disable-nagle',
  label: 'Nagle Algorithm',
  description: 'Disable Nagle algorithm for lower latency',
  isOptimized: false,
  canRevert: true,
};

function resetStore(): void {
  useWinoptStore.setState({
    winSettings: [],
    netSettings: [],
    isLoading: false,
    activeId: null,
    error: null,
    flushDnsResult: null,
  });
}

describe('useWinoptStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { winSettings, netSettings, isLoading, error } = useWinoptStore.getState();
    expect(winSettings).toEqual([]);
    expect(netSettings).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchWinSettings stores settings on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_WIN_SETTING]);
    await useWinoptStore.getState().fetchWinSettings();
    expect(useWinoptStore.getState().winSettings).toEqual([MOCK_WIN_SETTING]);
    expect(invoke).toHaveBeenCalledWith('get_win_settings');
    expect(useWinoptStore.getState().isLoading).toBe(false);
  });

  it('fetchWinSettings sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('registry error'));
    await useWinoptStore.getState().fetchWinSettings();
    expect(useWinoptStore.getState().error).toBe('registry error');
    expect(useWinoptStore.getState().isLoading).toBe(false);
  });

  it('fetchNetSettings stores net settings on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_WIN_SETTING]);
    await useWinoptStore.getState().fetchNetSettings();
    expect(useWinoptStore.getState().netSettings).toEqual([MOCK_WIN_SETTING]);
    expect(invoke).toHaveBeenCalledWith('get_net_settings');
  });

  it('applyWin calls apply_win_setting and refreshes', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined).mockResolvedValueOnce([MOCK_WIN_SETTING]);
    await useWinoptStore.getState().applyWin('disable-nagle');
    expect(invoke).toHaveBeenCalledWith('apply_win_setting', { id: 'disable-nagle' });
    expect(useWinoptStore.getState().activeId).toBeNull();
  });

  it('revertWin calls revert_win_setting and refreshes', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined).mockResolvedValueOnce([MOCK_WIN_SETTING]);
    await useWinoptStore.getState().revertWin('disable-nagle');
    expect(invoke).toHaveBeenCalledWith('revert_win_setting', { id: 'disable-nagle' });
    expect(useWinoptStore.getState().activeId).toBeNull();
  });

  it('applyNet calls apply_net_setting and refreshes', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined).mockResolvedValueOnce([MOCK_WIN_SETTING]);
    await useWinoptStore.getState().applyNet('some-net');
    expect(invoke).toHaveBeenCalledWith('apply_net_setting', { id: 'some-net' });
  });

  it('flushDns stores result on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce('DNS cache flushed successfully');
    await useWinoptStore.getState().flushDns();
    expect(useWinoptStore.getState().flushDnsResult).toBe('DNS cache flushed successfully');
    expect(invoke).toHaveBeenCalledWith('flush_dns_cache');
    expect(useWinoptStore.getState().activeId).toBeNull();
  });

  it('flushDns sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('flush error'));
    await useWinoptStore.getState().flushDns();
    expect(useWinoptStore.getState().error).toBe('flush error');
    expect(useWinoptStore.getState().activeId).toBeNull();
  });
});
