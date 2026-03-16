import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VaultEntry } from '../types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useVaultStore } from './useVaultStore';

const MOCK_ENTRY: VaultEntry = {
  id: 'entry-1',
  label: 'GitHub',
  category: 'password',
  username: 'user@example.com',
  url: 'https://github.com',
  secret: 's3cr3t',
  createdAt: 1000,
  updatedAt: 1000,
};

function resetStore(): void {
  useVaultStore.setState({ entries: [], isUnlocked: false, isLoading: false, error: null });
}

describe('useVaultStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts locked with empty entries', () => {
    const { isUnlocked, entries, error } = useVaultStore.getState();
    expect(isUnlocked).toBe(false);
    expect(entries).toEqual([]);
    expect(error).toBeNull();
  });

  it('unlock returns true and sets isUnlocked on correct password', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true);
    const ok = await useVaultStore.getState().unlock('nexus');
    expect(ok).toBe(true);
    expect(useVaultStore.getState().isUnlocked).toBe(true);
    expect(useVaultStore.getState().error).toBeNull();
  });

  it('unlock returns false and sets error on wrong password', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(false);
    const ok = await useVaultStore.getState().unlock('wrong');
    expect(ok).toBe(false);
    expect(useVaultStore.getState().isUnlocked).toBe(false);
    expect(useVaultStore.getState().error).not.toBeNull();
  });

  it('unlock calls unlock_vault command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true);
    await useVaultStore.getState().unlock('nexus');
    expect(invoke).toHaveBeenCalledWith('unlock_vault', { masterPassword: 'nexus' });
  });

  it('fetchEntries populates entries', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_ENTRY]);
    await useVaultStore.getState().fetchEntries();
    expect(useVaultStore.getState().entries).toEqual([MOCK_ENTRY]);
    expect(useVaultStore.getState().isLoading).toBe(false);
  });

  it('fetchEntries sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('read failed'));
    await useVaultStore.getState().fetchEntries();
    expect(useVaultStore.getState().error).toBe('read failed');
    expect(useVaultStore.getState().isLoading).toBe(false);
  });

  it('deleteEntry removes entry from state', async () => {
    useVaultStore.setState({ entries: [MOCK_ENTRY] });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useVaultStore.getState().deleteEntry('entry-1');
    expect(useVaultStore.getState().entries).toEqual([]);
  });

  it('lock clears entries and isUnlocked', () => {
    useVaultStore.setState({ isUnlocked: true, entries: [MOCK_ENTRY] });
    useVaultStore.getState().lock();
    expect(useVaultStore.getState().isUnlocked).toBe(false);
    expect(useVaultStore.getState().entries).toEqual([]);
  });

  it('changePassword calls change_master_password command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true);
    await useVaultStore.getState().changePassword('current', 'new');
    expect(invoke).toHaveBeenCalledWith('change_master_password', {
      currentPassword: 'current',
      newPassword: 'new',
    });
  });

  it('changePassword sets error on wrong current password', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(false);
    const ok = await useVaultStore.getState().changePassword('wrong', 'new');
    expect(ok).toBe(false);
    expect(useVaultStore.getState().error).toBe('現在のパスワードが正しくありません');
  });

  it('changePassword returns true on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true);
    const ok = await useVaultStore.getState().changePassword('current', 'new');
    expect(ok).toBe(true);
    expect(useVaultStore.getState().error).toBeNull();
  });

  it('changePassword sets error on exception', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('command failed'));
    const ok = await useVaultStore.getState().changePassword('current', 'new');
    expect(ok).toBe(false);
    expect(useVaultStore.getState().error).toBe('command failed');
  });
});
