import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { TotpResult, VaultEntry } from '../types';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface VaultStore {
  entries: VaultEntry[];
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  totpResults: Record<string, TotpResult>; // entryId -> TotpResult

  unlock: (masterPassword: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  fetchEntries: () => Promise<void>;
  saveEntry: (
    id: string,
    label: string,
    category: VaultEntry['category'],
    username: string,
    url: string,
    secret: string,
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  generateTotp: (entryId: string, secret: string) => Promise<void>;
  lock: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVaultStore = create<VaultStore>((set) => ({
  entries: [],
  isUnlocked: false,
  isLoading: false,
  error: null,
  totpResults: {},

  unlock: async (masterPassword: string) => {
    try {
      const ok = await invoke<boolean>('unlock_vault', { masterPassword });
      if (ok) {
        log.info('vault: unlocked');
        set({ isUnlocked: true, error: null });
      } else {
        log.warn('vault: wrong password');
        set({ error: 'パスワードが正しくありません' });
      }
      return ok;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'vault: unlock failed');
      set({ error: message });
      return false;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const ok = await invoke<boolean>('change_master_password', {
        currentPassword,
        newPassword,
      });
      if (ok) {
        log.info('vault: password changed successfully');
        set({ error: null });
      } else {
        log.warn('vault: current password incorrect');
        set({ error: '現在のパスワードが正しくありません' });
      }
      return ok;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'vault: change password failed');
      set({ error: message });
      return false;
    }
  },

  fetchEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await invoke<VaultEntry[]>('list_vault_entries');
      log.info({ count: entries.length }, 'vault: entries loaded');
      set({ entries, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'vault: fetch entries failed');
      set({ error: message, isLoading: false });
    }
  },

  saveEntry: async (id, label, category, username, url, secret) => {
    set({ error: null });
    try {
      await invoke<VaultEntry>('save_vault_entry', { id, label, category, username, url, secret });
      log.info({ label }, 'vault: entry saved');
      const entries = await invoke<VaultEntry[]>('list_vault_entries');
      set({ entries });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'vault: save entry failed');
      set({ error: message });
    }
  },

  deleteEntry: async (id: string) => {
    set({ error: null });
    try {
      await invoke<void>('delete_vault_entry', { id });
      log.info({ id }, 'vault: entry deleted');
      set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'vault: delete entry failed');
      set({ error: message });
    }
  },

  generateTotp: async (entryId: string, secret: string) => {
    try {
      const result = await invoke<TotpResult>('generate_totp', { secret });
      log.info({ entryId }, 'vault: TOTP generated');
      set((s) => ({
        totpResults: { ...s.totpResults, [entryId]: result },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err, entryId }, 'vault: TOTP generation failed');
      set({ error: message });
    }
  },

  lock: () => {
    log.info('vault: locked');
    set({ isUnlocked: false, entries: [], totpResults: {} });
  },
}));
