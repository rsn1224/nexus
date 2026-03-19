import { memo, useCallback, useEffect } from 'react';
import { useHistoryActions, useHistoryState } from '../../stores/useHistoryStore';
import { SessionList } from './SessionList';
import { TrendChart } from './TrendChart';

export const HistoryWing = memo(function HistoryWing() {
  const { sessions, selectedSession, trendRange, loading, error } = useHistoryState();
  const { fetchSessions, selectSession, deleteSession, setTrendRange, clearError } =
    useHistoryActions();

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleSelect = useCallback(
    (id: string): void => {
      void selectSession(id);
    },
    [selectSession],
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 gap-6">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/3 pb-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter">
            HISTORY{' '}
            <span className="text-accent-500 hover-glitch inline-block bloom-razer">WING</span>
          </h1>
          <p className="text-text-muted font-light tracking-[0.6em] text-[9px] uppercase mt-2">
            {'ANALYSIS PROTOCOL // DATA-DENSE MODE'}
          </p>
        </div>
        <div className="glass-panel px-6 py-4 text-right border-l-[3px] border-l-accent-500">
          <p className="text-[8px] font-black text-text-muted tracking-[0.3em] uppercase flex items-center justify-end gap-3 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 pulse-node" />
            SYNC COHERENCE / 同期率
          </p>
          <p className="text-accent-500 font-black text-2xl tracking-tighter bloom-razer">
            {sessions.length}
            <span className="text-sm opacity-60 ml-1">SESSIONS</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-danger-500/10 border border-danger-500/30">
          <span className="text-danger-500 text-xs">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-danger-500 text-xs hover:text-text-primary"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bento Grid: Trend + Detail */}
      <div className="grid grid-cols-12 gap-6">
        {/* Trend Chart */}
        <div className="col-span-12 lg:col-span-8">
          <TrendChart sessions={sessions} range={trendRange} onRangeChange={setTrendRange} />
        </div>

        {/* Session Detail or Info */}
        <div className="col-span-12 lg:col-span-4 glass-panel p-6 border-l-4 border-l-warning-500">
          <div className="flex items-center gap-3 mb-6">
            <span className="glow-yellow-icon">🧠</span>
            <h3 className="font-black text-[10px] tracking-[0.3em] text-warning-500 uppercase">
              SESSION DETAIL
            </h3>
          </div>
          {selectedSession ? (
            <SessionDetail session={selectedSession} />
          ) : (
            <p className="text-text-muted text-xs">← テーブルからセッションを選択</p>
          )}
        </div>
      </div>

      {/* Session Table */}
      <SessionList
        sessions={sessions}
        selectedId={selectedSession?.id ?? null}
        onSelect={handleSelect}
        onDelete={(id) => void deleteSession(id)}
        loading={loading}
      />
    </div>
  );
});

// ─── Session Detail sub-component ────────────────────────

import type { GameSession } from '../../types/v2';

const SessionDetail = memo(function SessionDetail({ session }: { session: GameSession }) {
  const stats = [
    { label: 'AVG FPS', value: session.summary.avgFps.toFixed(0) },
    { label: '1% LOW', value: session.summary.pct1Low.toFixed(0) },
    { label: 'STUTTER', value: String(session.summary.totalStutterCount) },
    { label: 'MAX FT', value: `${session.summary.maxFrameTimeMs.toFixed(1)}ms` },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-text-primary text-sm font-bold">{session.gameName}</h4>
        <p className="text-text-muted text-[9px] mt-1">
          {new Date(session.startedAt).toLocaleString('ja-JP')} — {session.durationMinutes}分
        </p>
      </div>
      <div className="space-y-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex justify-between items-center text-[9px] tracking-[0.3em] uppercase"
          >
            <span className="text-text-muted">{stat.label}</span>
            <span className="text-warning-500 font-black">{stat.value}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] tracking-[0.2em] uppercase pt-4 border-t border-white/5">
        <span className="text-text-muted">HEALTH</span>
        <span className="text-accent-500 font-black">
          {session.healthScoreStart} → {session.healthScoreEnd}
        </span>
      </div>
    </div>
  );
});
