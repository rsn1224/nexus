import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { ErrorBanner } from '../ui';
import SessionCompareView from './SessionCompareView';
import SessionListView from './SessionListView';

export default function SessionTab(): React.ReactElement {
  const {
    sessionList,
    selectedSession,
    comparisonResult,
    isLoading,
    error,
    fetchSessions,
    getSession,
    deleteSession,
    compareSessions,
    clearError,
  } = useSessionStore();

  const [view, setView] = useState<'list' | 'compare'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareAId, setCompareAId] = useState('');
  const [compareBId, setCompareBId] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleSelect = async (id: string): Promise<void> => {
    setSelectedId(id);
    await getSession(id);
  };

  const handleDeleteRequest = (id: string): void => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setDeleteConfirmId(id);
    deleteTimerRef.current = setTimeout(() => setDeleteConfirmId(null), 3000);
  };

  const handleDeleteConfirm = async (id: string): Promise<void> => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setDeleteConfirmId(null);
    await deleteSession(id);
    if (selectedId === id) setSelectedId(null);
  };

  const handleCompare = async (): Promise<void> => {
    if (compareAId && compareBId && compareAId !== compareBId) {
      await compareSessions(compareAId, compareBId);
    }
  };

  const navBtnClass = (active: boolean): string =>
    `text-[10px] px-3 py-1 rounded transition-colors ${
      active ? 'bg-accent-500 text-white' : 'text-text-secondary hover:text-text-primary'
    }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setView('list')}
          className={navBtnClass(view === 'list')}
        >
          SESSION LIST
        </button>
        <button
          type="button"
          onClick={() => setView('compare')}
          className={navBtnClass(view === 'compare')}
        >
          COMPARE
        </button>
      </div>

      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {view === 'list' && (
        <SessionListView
          sessionList={sessionList}
          selectedSession={selectedSession}
          selectedId={selectedId}
          deleteConfirmId={deleteConfirmId}
          isLoading={isLoading}
          onSelect={(id) => {
            void handleSelect(id);
          }}
          onDeleteRequest={handleDeleteRequest}
          onDeleteConfirm={(id) => {
            void handleDeleteConfirm(id);
          }}
        />
      )}

      {view === 'compare' && (
        <SessionCompareView
          sessionList={sessionList}
          comparisonResult={comparisonResult}
          compareAId={compareAId}
          compareBId={compareBId}
          onSetCompareAId={setCompareAId}
          onSetCompareBId={setCompareBId}
          onCompare={() => {
            void handleCompare();
          }}
        />
      )}
    </div>
  );
}
