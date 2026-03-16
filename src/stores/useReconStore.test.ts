import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NetworkDevice, TrafficSnapshot } from '../types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useReconStore } from './useReconStore';

const MOCK_DEVICES: NetworkDevice[] = [
  {
    ip: '192.168.1.1',
    mac: 'AA:BB:CC:DD:EE:FF',
    hostname: '',
    vendor: '',
    status: 'unknown',
    lastSeen: 1000,
  },
  {
    ip: '192.168.1.100',
    mac: '11:22:33:44:55:66',
    hostname: 'my-pc',
    vendor: 'Intel',
    status: 'known',
    lastSeen: 2000,
  },
];

const MOCK_TRAFFIC: TrafficSnapshot = { bytesSent: 1024, bytesRecv: 4096, timestamp: 9999 };

function resetStore(): void {
  useReconStore.setState({
    devices: [],
    traffic: null,
    isScanning: false,
    error: null,
    lastUpdated: null,
  });
}

describe('useReconStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { devices, traffic, isScanning, error, lastUpdated } = useReconStore.getState();
    expect(devices).toEqual([]);
    expect(traffic).toBeNull();
    expect(isScanning).toBe(false);
    expect(error).toBeNull();
    expect(lastUpdated).toBeNull();
  });

  it('scanNetwork populates devices on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_DEVICES);
    await useReconStore.getState().scanNetwork();

    const { devices, isScanning, error } = useReconStore.getState();
    expect(devices).toEqual(MOCK_DEVICES);
    expect(isScanning).toBe(false);
    expect(error).toBeNull();
  });

  it('scanNetwork calls scan_network command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([]);
    await useReconStore.getState().scanNetwork();
    expect(invoke).toHaveBeenCalledWith('scan_network');
  });

  it('scanNetwork sets lastUpdated on success', async () => {
    const before = Date.now();
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_DEVICES);
    await useReconStore.getState().scanNetwork();
    expect(useReconStore.getState().lastUpdated ?? 0).toBeGreaterThanOrEqual(before);
  });

  it('scanNetwork sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('network unreachable'));
    await useReconStore.getState().scanNetwork();

    const { error, isScanning } = useReconStore.getState();
    expect(error).toBe('network unreachable');
    expect(isScanning).toBe(false);
  });

  it('scanNetwork handles non-Error rejection', async () => {
    vi.mocked(invoke).mockRejectedValueOnce('permission denied');
    await useReconStore.getState().scanNetwork();
    expect(useReconStore.getState().error).toBe('permission denied');
  });

  it('scanNetwork clears previous error', async () => {
    useReconStore.setState({ error: 'old error' });
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_DEVICES);
    await useReconStore.getState().scanNetwork();
    expect(useReconStore.getState().error).toBeNull();
  });

  it('fetchTraffic populates traffic on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_TRAFFIC);
    await useReconStore.getState().fetchTraffic();
    expect(useReconStore.getState().traffic).toEqual(MOCK_TRAFFIC);
  });

  it('fetchTraffic calls get_traffic_snapshot command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_TRAFFIC);
    await useReconStore.getState().fetchTraffic();
    expect(invoke).toHaveBeenCalledWith('get_traffic_snapshot');
  });

  it('fetchTraffic silently handles failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('access denied'));
    await useReconStore.getState().fetchTraffic();
    // traffic stays null, no error state set
    expect(useReconStore.getState().traffic).toBeNull();
    expect(useReconStore.getState().error).toBeNull();
  });
});
