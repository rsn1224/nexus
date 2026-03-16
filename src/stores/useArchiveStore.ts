import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import type { ArchiveNote } from '../types';

// ─── Store shape ──────────────────────────────────────────────────────────────

interface ArchiveStore {
  notes: ArchiveNote[];
  isLoading: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  saveNote: (
    id: string,
    title: string,
    content: string,
    tags: string[],
    links: string[],
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useArchiveStore = create<ArchiveStore>((set) => ({
  notes: [],
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const notes = await invoke<ArchiveNote[]>('list_notes');
      log.info({ count: notes.length }, 'archive: notes loaded');
      set({ notes, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'archive: fetch notes failed');
      set({ error: message, isLoading: false });
    }
  },

  saveNote: async (id, title, content, tags, links) => {
    set({ error: null });
    try {
      await invoke<ArchiveNote>('save_note', { id, title, content, tags, links });
      log.info({ title }, 'archive: note saved');
      const notes = await invoke<ArchiveNote[]>('list_notes');
      set({ notes });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'archive: save note failed');
      set({ error: message });
    }
  },

  deleteNote: async (id: string) => {
    set({ error: null });
    try {
      await invoke<void>('delete_note', { id });
      log.info({ id }, 'archive: note deleted');
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error({ err }, 'archive: delete note failed');
      set({ error: message });
    }
  },
}));
