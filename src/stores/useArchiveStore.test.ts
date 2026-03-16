import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArchiveNote } from '../types';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useArchiveStore } from './useArchiveStore';

const MOCK_NOTE: ArchiveNote = {
  id: 'note-1',
  title: 'Test Note',
  content: '# Hello\nworld',
  tags: ['test', 'nexus'],
  links: ['https://example.com'],
  createdAt: 1000,
  updatedAt: 2000,
};

function resetStore(): void {
  useArchiveStore.setState({ notes: [], isLoading: false, error: null });
}

describe('useArchiveStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { notes, isLoading, error } = useArchiveStore.getState();
    expect(notes).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchNotes populates notes', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_NOTE]);
    await useArchiveStore.getState().fetchNotes();
    expect(useArchiveStore.getState().notes).toEqual([MOCK_NOTE]);
    expect(useArchiveStore.getState().isLoading).toBe(false);
  });

  it('fetchNotes calls list_notes command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([]);
    await useArchiveStore.getState().fetchNotes();
    expect(invoke).toHaveBeenCalledWith('list_notes');
  });

  it('fetchNotes sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('io error'));
    await useArchiveStore.getState().fetchNotes();
    expect(useArchiveStore.getState().error).toBe('io error');
  });

  it('saveNote refreshes notes list', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_NOTE).mockResolvedValueOnce([MOCK_NOTE]);
    await useArchiveStore.getState().saveNote('', 'Test Note', '# Hello', ['test'], []);
    expect(useArchiveStore.getState().notes).toEqual([MOCK_NOTE]);
  });

  it('deleteNote removes note from state', async () => {
    useArchiveStore.setState({ notes: [MOCK_NOTE] });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useArchiveStore.getState().deleteNote('note-1');
    expect(useArchiveStore.getState().notes).toEqual([]);
  });

  it('deleteNote sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('not found'));
    await useArchiveStore.getState().deleteNote('bad-id');
    expect(useArchiveStore.getState().error).toBe('not found');
  });
});
