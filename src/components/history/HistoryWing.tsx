import { memo, useCallback, useEffect, useState } from 'react';
import { useHistoryActions, useHistoryState } from '../../stores/useHistoryStore';
import { SessionList } from './SessionList';
import { TrendChart } from './TrendChart';

export const HistoryWing = memo(function HistoryWing() {
  const { sessions, selectedSession, trendRange, loading, error } = useHistoryState();
  const { fetchSessions, selectSession, deleteSession, updateNote, setTrendRange, clearError } =
    useHistoryActions();

  const [noteEditing, setNoteEditing] = useState(false);
  const [noteValue, setNoteValue] = useState('');

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleSelect = useCallback(
    (id: string): void => {
      void selectSession(id);
      setNoteEditing(false);
    },
    [selectSession],
  );

  const handleNoteEdit = useCallback((): void => {
    setNoteValue(selectedSession?.note ?? '');
    setNoteEditing(true);
  }, [selectedSession]);

  const handleNoteSave = useCallback((): void => {
    if (!selectedSession) return;
    void updateNote(selectedSession.id, noteValue);
    setNoteEditing(false);
  }, [selectedSession, noteValue, updateNote]);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col w-64 shrink-0 border-r border-border-subtle overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
          <span className="text-text-secondary text-xs font-mono uppercase tracking-widest">
            SESSIONS
          </span>
          <button
            type="button"
            onClick={() => void fetchSessions()}
            disabled={loading}
            className="text-xs font-mono text-accent-500 hover:text-text-primary disabled:opacity-40 transition-colors"
          >
            REFRESH
          </button>
        </div>
        {error && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-danger-500/10 border-b border-danger-500/30">
            <span className="text-danger-500 text-xs font-mono truncate">{error}</span>
            <button type="button" onClick={clearError} className="text-danger-500 text-xs ml-2">
              ✕
            </button>
          </div>
        )}
        <SessionList
          sessions={sessions}
          selectedId={selectedSession?.id ?? null}
          onSelect={handleSelect}
          onDelete={(id) => void deleteSession(id)}
          loading={loading}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedSession ? (
          <div className="flex flex-col gap-3 p-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-text-primary text-sm font-mono font-bold">
                  {selectedSession.gameName}
                </h3>
                <p className="text-text-secondary text-xs font-mono mt-0.5">
                  {new Date(selectedSession.startedAt).toLocaleString('ja-JP')}
                  {' — '}
                  {selectedSession.durationMinutes}分
                </p>
              </div>
              <div className="flex gap-2 text-xs font-mono shrink-0">
                <div className="card-glass rounded px-2 py-1">
                  <div className="text-text-secondary">HEALTH</div>
                  <div className="text-text-primary">
                    {selectedSession.healthScoreStart}→{selectedSession.healthScoreEnd}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'AVG FPS', value: selectedSession.summary.avgFps.toFixed(0) },
                { label: '1% LOW', value: selectedSession.summary.pct1Low.toFixed(0) },
                { label: '0.1% LOW', value: selectedSession.summary.pct01Low.toFixed(0) },
                { label: 'STUTTER', value: String(selectedSession.summary.totalStutterCount) },
                { label: 'MAX FT ms', value: selectedSession.summary.maxFrameTimeMs.toFixed(1) },
                { label: 'TOTAL FR', value: String(selectedSession.summary.totalFrames) },
              ].map((stat) => (
                <div key={stat.label} className="card-glass rounded px-3 py-2">
                  <div className="text-text-secondary text-xs font-mono">{stat.label}</div>
                  <div className="text-text-primary text-sm font-mono font-bold">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="card-glass rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-text-secondary text-xs font-mono uppercase">NOTE</p>
                {!noteEditing && (
                  <button
                    type="button"
                    onClick={handleNoteEdit}
                    className="text-xs font-mono text-accent-500 hover:text-text-primary transition-colors"
                  >
                    EDIT
                  </button>
                )}
              </div>
              {noteEditing ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={noteValue}
                    onChange={(e) => setNoteValue(e.target.value)}
                    rows={3}
                    aria-label="セッションノート"
                    className="w-full bg-base-800 border border-border-subtle rounded px-2 py-1.5 text-xs font-mono text-text-primary resize-none focus:outline-none focus:border-accent-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleNoteSave}
                      className="flex-1 px-2 py-1 text-xs font-mono rounded border border-accent-500 text-accent-500 hover:bg-accent-500/10 transition-colors"
                    >
                      SAVE
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteEditing(false)}
                      className="flex-1 px-2 py-1 text-xs font-mono rounded border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary text-xs font-mono whitespace-pre-wrap">
                  {selectedSession.note || '—'}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 overflow-y-auto">
            <div className="flex items-center gap-3">
              <span className="text-text-secondary text-xs font-mono uppercase tracking-widest">
                TREND
              </span>
              <div className="flex gap-1">
                {(['7d', '30d'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTrendRange(r)}
                    className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                      trendRange === r
                        ? 'border-accent-500 bg-accent-500/10 text-accent-500'
                        : 'border-border-subtle text-text-secondary hover:border-accent-500/50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <TrendChart sessions={sessions} range={trendRange} />
            <p className="text-text-secondary text-xs font-mono text-center mt-4">
              ← セッションを選択して詳細を表示
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
