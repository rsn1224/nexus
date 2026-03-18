import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useNetoptStore } from './useNetoptStore';

const MOCK_ADAPTER = {
  name: 'Ethernet',
  ip: '192.168.1.1',
  mac: '00:11:22:33:44:55',
  isConnected: true,
};
const MOCK_PING_RESULT = { target: '8.8.8.8', latencyMs: 12, success: true };

function resetStore(): void {
  useNetoptStore.setState({
    adapters: [],
    currentDns: [],
    pingResult: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });
}

describe('useNetoptStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { adapters, currentDns, isLoading, error } = useNetoptStore.getState();
    expect(adapters).toEqual([]);
    expect(currentDns).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchAdapters stores adapters on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_ADAPTER]);
    await useNetoptStore.getState().fetchAdapters();
    expect(useNetoptStore.getState().adapters).toEqual([MOCK_ADAPTER]);
    expect(invoke).toHaveBeenCalledWith('get_network_adapters');
    expect(useNetoptStore.getState().isLoading).toBe(false);
  });

  it('fetchAdapters sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('adapter error'));
    await useNetoptStore.getState().fetchAdapters();
    expect(useNetoptStore.getState().error).toBe('adapter error');
    expect(useNetoptStore.getState().isLoading).toBe(false);
  });

  it('fetchCurrentDns stores dns on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(['8.8.8.8', '8.8.4.4']);
    await useNetoptStore.getState().fetchCurrentDns();
    expect(useNetoptStore.getState().currentDns).toEqual(['8.8.8.8', '8.8.4.4']);
    expect(invoke).toHaveBeenCalledWith('get_current_dns');
  });

  it('setDns calls set_dns command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useNetoptStore.getState().setDns('Ethernet', '1.1.1.1', '1.0.0.1');
    expect(invoke).toHaveBeenCalledWith('set_dns', {
      adapter: 'Ethernet',
      primary: '1.1.1.1',
      secondary: '1.0.0.1',
    });
  });

  it('pingHost stores ping result on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_PING_RESULT);
    await useNetoptStore.getState().pingHost('8.8.8.8');
    expect(useNetoptStore.getState().pingResult).toEqual(MOCK_PING_RESULT);
  });

  it('pingHost sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('ping failed'));
    await useNetoptStore.getState().pingHost('8.8.8.8');
    expect(useNetoptStore.getState().error).toBe('ping failed');
  });

  it('clearError resets error state', () => {
    useNetoptStore.setState({ error: 'test error' });
    useNetoptStore.getState().clearError();
    expect(useNetoptStore.getState().error).toBeNull();
  });

  it('reset restores initial state', () => {
    useNetoptStore.setState({ adapters: [MOCK_ADAPTER], isLoading: true });
    useNetoptStore.getState().reset();
    expect(useNetoptStore.getState().adapters).toEqual([]);
    expect(useNetoptStore.getState().isLoading).toBe(false);
  });
});
