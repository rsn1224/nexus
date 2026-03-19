import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import type { SessionSummary } from '../../types';
import { ErrorBanner } from '../ui';

function fmtNum(n: number, dec = 1): string {
  return n.toFixed(dec);
}

function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDuration(startTs: number, endTs: number): string {
  const secs = endTs - startTs;
  const m = Math.floor(secs / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60}m` : `${m}m`;
}

function SummaryPanel({
  summary,
  title,
}: {
  summary: SessionSummary;
  title?: string;
}): React.ReactElement {
  return (
    <div className="bg-base-800 border border-border-subtle rounded p-2 space-y-1 flex-1">
      {title && <div className="font-mono text-[9px] text-text-muted mb-2 uppercase">{title}</div>}
      {(
        [
          ['AVG FPS', fmtNum(summary.avgFps)],
          ['1% LOW', fmtNum(summary.pct1Low)],
          ['0.1% LOW', fmtNum(summary.pct01Low)],
          ['STUTTER', String(summary.totalStutterCount)],
          ['MIN FPS', fmtNum(summary.minFps)],
        ] as [string, string][]
      ).map(([label, value]) => (
        <div key={label} className="flex justify-between font-mono text-[11px]">
          <span className="text-text-muted">{label}</span>
          <span className="text-text-primary">{value}</span>
        </div>
      ))}
    </div>
  );
}

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
    `font-mono text-[10px] px-3 py-1 rounded transition-colors ${
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
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {isLoading && <div className="font-mono text-[11px] text-text-muted">Loading...</div>}
            {!isLoading && sessionList.length === 0 && (
              <div className="font-mono text-[11px] text-text-muted">セッションがありません</div>
            )}
            {sessionList.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  void handleSelect(s.id);
                }}
                className={`w-full flex items-center justify-between px-2 py-1 border-b border-border-subtle text-left transition-colors ${
                  selectedId === s.id ? 'bg-accent-500/10' : 'hover:bg-base-800'
                }`}
              >
                <div>
                  <div className="font-mono text-[11px] text-text-primary">{s.gameName}</div>
                  <div className="font-mono text-[9px] text-text-muted">
                    {fmtDate(s.startedAt)} · {fmtDuration(s.startedAt, s.endedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-text-secondary">
                    {fmtNum(s.summary.avgFps)} fps
                  </span>
                  {deleteConfirmId === s.id ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteConfirm(s.id);
                      }}
                      className="font-mono text-[9px] text-danger-500 border border-danger-500 px-1 rounded"
                    >
                      CONFIRM
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(s.id);
                      }}
                      className="font-mono text-[9px] text-text-muted hover:text-danger-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>

          {selectedSession && selectedId === selectedSession.id && (
            <div className="w-44 shrink-0 space-y-2">
              <div className="font-mono text-[9px] text-text-muted">DETAIL</div>
              <div className="font-mono text-[11px] text-text-primary">
                {selectedSession.gameName}
              </div>
              <SummaryPanel summary={selectedSession.summary} />
              {selectedSession.note && (
                <div className="font-mono text-[10px] text-text-secondary italic">
                  {selectedSession.note}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === 'compare' && (
        <div className="space-y-3">
          <div className="flex gap-2 items-end">
            {(['A', 'B'] as const).map((side) => {
              const val = side === 'A' ? compareAId : compareBId;
              const setter = side === 'A' ? setCompareAId : setCompareBId;
              return (
                <div key={side} className="flex-1">
                  <div className="font-mono text-[9px] text-text-muted mb-1">SESSION {side}</div>
                  <select
                    aria-label={`Session ${side}`}
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full px-2 py-1 font-mono text-[10px] bg-base-800 border border-border-subtle text-text-primary rounded"
                  >
                    <option value="">選択...</option>
                    {sessionList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.gameName} {fmtDate(s.startedAt)}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => {
                void handleCompare();
              }}
              disabled={!compareAId || !compareBId || compareAId === compareBId}
              className="px-3 py-1 font-mono text-[10px] bg-accent-500 text-white rounded disabled:opacity-50"
            >
              COMPARE
            </button>
          </div>

          {comparisonResult && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <SummaryPanel summary={comparisonResult.sessionA} title="Session A" />
                <SummaryPanel summary={comparisonResult.sessionB} title="Session B" />
              </div>
              <div className="bg-base-800 border border-border-subtle rounded p-2 space-y-1">
                <div className="font-mono text-[9px] text-text-muted mb-1">DELTA</div>
                {(
                  [
                    ['FPS', comparisonResult.fpsDeltaPct, '%'],
                    ['1% LOW', comparisonResult.pct1LowDeltaPct, '%'],
                    ['0.1% LOW', comparisonResult.pct01LowDeltaPct, '%'],
                    ['STUTTER', comparisonResult.stutterDelta, ''],
                  ] as [string, number, string][]
                ).map(([label, delta, unit]) => (
                  <div key={label} className="flex justify-between font-mono text-[11px]">
                    <span className="text-text-muted">{label}</span>
                    <span
                      className={
                        delta > 0
                          ? 'text-accent-500'
                          : delta < 0
                            ? 'text-danger-500'
                            : 'text-text-primary'
                      }
                    >
                      {delta > 0 ? '+' : ''}
                      {fmtNum(delta)}
                      {unit}
                    </span>
                  </div>
                ))}
              </div>
              {comparisonResult.autoSummary && (
                <div className="font-mono text-[10px] text-text-secondary">
                  {comparisonResult.autoSummary}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
