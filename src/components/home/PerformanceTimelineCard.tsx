import type React from 'react';
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import type { SessionListItem } from '../../types';
import { Card } from '../ui';
import EmptyState from '../ui/EmptyState';
import FpsTimelineGraph from './FpsTimelineGraph';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDelta(pct: number): { text: string; cls: string } {
  if (pct > 0) return { text: `+${pct.toFixed(1)}%`, cls: 'text-success-500' };
  if (pct < 0) return { text: `${pct.toFixed(1)}%`, cls: 'text-danger-500' };
  return { text: '±0%', cls: 'text-text-muted' };
}

type Tab = 'list' | 'detail' | 'compare';

// ─── SessionRow ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  onSelect,
  onDelete,
  isSelected,
}: {
  session: SessionListItem;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <button
      type="button"
      className={`w-full flex items-center gap-2 px-2 py-1 border-b border-border-subtle text-[10px] font-mono text-left ${
        isSelected ? 'bg-accent-500/10' : 'hover:bg-base-700'
      } cursor-pointer`}
      onClick={() => onSelect(session.id)}
    >
      <div className="flex-1 min-w-0">
        <span className="text-text-primary truncate block">{session.gameName}</span>
        <span className="text-text-muted">{formatDate(session.startedAt)}</span>
      </div>
      <div className="text-right shrink-0">
        <div className="text-accent-500">{session.summary.avgFps.toFixed(1)} FPS</div>
        <div className="text-text-muted">1% {session.summary.pct1Low.toFixed(1)}</div>
      </div>
      {confirmDelete ? (
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
              setConfirmDelete(false);
            }}
            className="px-1 py-[1px] font-mono text-[9px] border border-danger-500 text-danger-500 hover:bg-danger-500 hover:text-base-900 transition-colors"
          >
            YES
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(false);
            }}
            className="px-1 py-[1px] font-mono text-[9px] border border-border-subtle text-text-muted hover:bg-base-700 transition-colors"
          >
            NO
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDelete(true);
          }}
          className="shrink-0 px-1 py-[1px] font-mono text-[9px] border border-border-subtle text-text-muted hover:border-danger-500 hover:text-danger-500 transition-colors"
        >
          DEL
        </button>
      )}
    </button>
  );
}

// ─── DetailView ───────────────────────────────────────────────────────────────

function DetailView() {
  const { selectedSession, isLoading } = useSessionStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80px] font-mono text-[11px] text-text-muted tracking-[0.1em]">
        LOADING...
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex items-center justify-center h-[80px] font-mono text-[11px] text-text-muted tracking-[0.1em]">
        SELECT A SESSION FROM LIST
      </div>
    );
  }

  const s = selectedSession.summary;

  return (
    <div className="flex flex-col gap-3">
      {/* ゲーム名・日時 */}
      <div>
        <div className="font-mono text-[12px] font-bold text-accent-500">
          {selectedSession.gameName}
        </div>
        <div className="font-mono text-[10px] text-text-muted">
          {formatDate(selectedSession.startedAt)} — {formatDate(selectedSession.endedAt)}（
          {Math.round(selectedSession.playSecs / 60)} 分）
        </div>
      </div>

      {/* FPS タイムライン */}
      {selectedSession.fpsTimeline.length > 0 && (
        <div>
          <div className="font-mono text-[9px] text-text-muted mb-1 tracking-[0.1em]">
            FPS TIMELINE
          </div>
          <FpsTimelineGraph timeline={selectedSession.fpsTimeline} />
        </div>
      )}

      {/* 統計グリッド */}
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { label: 'AVG FPS', value: s.avgFps.toFixed(1) },
            { label: '1% LOW', value: s.pct1Low.toFixed(1) },
            { label: '0.1% LOW', value: s.pct01Low.toFixed(1) },
            { label: 'STUTTER', value: String(s.totalStutterCount) },
            { label: 'MAX FT', value: `${s.maxFrameTimeMs.toFixed(1)}ms` },
            { label: 'FRAMES', value: String(s.totalFrames) },
          ] as const
        ).map(({ label, value }) => (
          <div key={label}>
            <div className="font-mono text-[9px] text-text-muted tracking-[0.08em]">{label}</div>
            <div className="font-mono text-[13px] font-bold text-accent-500">{value}</div>
          </div>
        ))}
      </div>

      {/* パーセンタイル */}
      {selectedSession.percentiles.length > 0 && (
        <div>
          <div className="font-mono text-[9px] text-text-muted mb-1 tracking-[0.1em]">
            PERCENTILES
          </div>
          <div className="flex gap-3">
            {selectedSession.percentiles.map((p) => (
              <div key={p.percentile} className="text-center">
                <div className="font-mono text-[9px] text-text-muted">P{p.percentile}</div>
                <div className="font-mono text-[11px] text-text-primary">{p.fps.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ノート */}
      {selectedSession.note && (
        <div className="pt-2 border-t border-border-subtle">
          <div className="font-mono text-[9px] text-text-muted tracking-[0.1em] mb-1">NOTE</div>
          <div className="font-mono text-[10px] text-text-secondary">{selectedSession.note}</div>
        </div>
      )}

      {/* ハードウェア */}
      {selectedSession.hardwareSnapshot && (
        <div className="pt-2 border-t border-border-subtle">
          <div className="font-mono text-[9px] text-text-muted tracking-[0.1em] mb-1">HARDWARE</div>
          <div className="font-mono text-[10px] text-text-secondary flex flex-col gap-[2px]">
            <div>CPU {selectedSession.hardwareSnapshot.cpuName}</div>
            {selectedSession.hardwareSnapshot.gpuName && (
              <div>GPU {selectedSession.hardwareSnapshot.gpuName}</div>
            )}
            <div>RAM {selectedSession.hardwareSnapshot.memTotalGb.toFixed(0)} GB</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CompareView ──────────────────────────────────────────────────────────────

function CompareView({ sessions }: { sessions: SessionListItem[] }) {
  const { compareSessions, comparisonResult, isLoading } = useSessionStore();
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  const handleCompare = () => {
    if (aId && bId && aId !== bId) {
      compareSessions(aId, bId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* セレクト */}
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="font-mono text-[9px] text-text-muted mb-1 tracking-[0.08em]">
            SESSION A
          </div>
          <select
            aria-label="Session A"
            value={aId}
            onChange={(e) => setAId(e.target.value)}
            className="w-full px-2 py-1 font-mono text-[10px] bg-base-700 border border-border-subtle text-text-primary"
          >
            <option value="">SELECT...</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.gameName} {formatDate(s.startedAt)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <div className="font-mono text-[9px] text-text-muted mb-1 tracking-[0.08em]">
            SESSION B
          </div>
          <select
            aria-label="Session B"
            value={bId}
            onChange={(e) => setBId(e.target.value)}
            className="w-full px-2 py-1 font-mono text-[10px] bg-base-700 border border-border-subtle text-text-primary"
          >
            <option value="">SELECT...</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.gameName} {formatDate(s.startedAt)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCompare}
        disabled={!aId || !bId || aId === bId || isLoading}
        className={`w-full py-[5px] font-mono text-[10px] font-bold border tracking-[0.1em] transition-colors ${
          !aId || !bId || aId === bId || isLoading
            ? 'bg-base-800 text-text-muted border-border-subtle cursor-not-allowed'
            : 'bg-accent-500 text-base-900 border-accent-500 cursor-pointer hover:bg-accent-600'
        }`}
      >
        {isLoading ? 'COMPARING...' : 'COMPARE'}
      </button>

      {/* 比較結果 */}
      {comparisonResult && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
          <div className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
            COMPARISON RESULT
          </div>

          {/* デルタ表 */}
          <div className="flex flex-col gap-1">
            {(
              [
                { label: 'AVG FPS', delta: comparisonResult.fpsDeltaPct },
                { label: '1% LOW', delta: comparisonResult.pct1LowDeltaPct },
                { label: '0.1% LOW', delta: comparisonResult.pct01LowDeltaPct },
              ] as const
            ).map(({ label, delta }) => {
              const { text, cls } = formatDelta(delta);
              return (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-text-muted">{label}</span>
                  <div className="flex gap-4 font-mono text-[10px]">
                    <span className="text-text-secondary">
                      {label === 'AVG FPS'
                        ? comparisonResult.sessionA.avgFps.toFixed(1)
                        : label === '1% LOW'
                          ? comparisonResult.sessionA.pct1Low.toFixed(1)
                          : comparisonResult.sessionA.pct01Low.toFixed(1)}
                    </span>
                    <span className="text-text-muted">→</span>
                    <span className="text-text-secondary">
                      {label === 'AVG FPS'
                        ? comparisonResult.sessionB.avgFps.toFixed(1)
                        : label === '1% LOW'
                          ? comparisonResult.sessionB.pct1Low.toFixed(1)
                          : comparisonResult.sessionB.pct01Low.toFixed(1)}
                    </span>
                    <span className={cls}>{text}</span>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-text-muted">STUTTER Δ</span>
              <span
                className={`font-mono text-[10px] ${
                  comparisonResult.stutterDelta <= 0 ? 'text-success-500' : 'text-danger-500'
                }`}
              >
                {comparisonResult.stutterDelta > 0 ? '+' : ''}
                {comparisonResult.stutterDelta}
              </span>
            </div>
          </div>

          {/* 自動サマリー */}
          <div className="pt-2 border-t border-border-subtle">
            <div className="font-mono text-[9px] text-text-muted tracking-[0.08em] mb-1">
              SUMMARY
            </div>
            <div className="font-mono text-[10px] text-text-secondary leading-relaxed">
              {comparisonResult.autoSummary}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PerformanceTimelineCard ──────────────────────────────────────────────────

const PerformanceTimelineCard: React.FC = () => {
  const {
    sessionList,
    selectedSession,
    isLoading,
    error,
    fetchSessions,
    getSession,
    deleteSession,
  } = useSessionStore();

  const [activeTab, setActiveTab] = useState<Tab>('list');

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSelect = (id: string) => {
    getSession(id);
    setActiveTab('detail');
  };

  const handleDelete = (id: string) => {
    deleteSession(id);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'list', label: 'SESSIONS' },
    { id: 'detail', label: 'DETAIL' },
    { id: 'compare', label: 'COMPARE' },
  ];

  return (
    <Card title="PERFORMANCE TIMELINE" className="mt-4">
      {/* タブバー */}
      <div className="flex gap-0 mb-3 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 font-mono text-[9px] tracking-[0.1em] border-b-2 -mb-[2px] transition-colors ${
              activeTab === tab.id
                ? 'border-accent-500 text-accent-500'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* エラー */}
      {error && <div className="mb-2 font-mono text-[10px] text-danger-500">ERROR: {error}</div>}

      {/* コンテンツ */}
      {activeTab === 'list' && (
        <div>
          {isLoading && sessionList.length === 0 ? (
            <div className="flex items-center justify-center h-[60px] font-mono text-[11px] text-text-muted tracking-[0.1em]">
              LOADING...
            </div>
          ) : sessionList.length === 0 ? (
            <EmptyState
              message="NO SESSIONS RECORDED"
              action="START GAMING TO RECORD PERFORMANCE"
            />
          ) : (
            <ul className="flex flex-col max-h-[200px] overflow-y-auto list-none p-0 m-0">
              {sessionList.map((s) => (
                <li key={s.id}>
                  <SessionRow
                    session={s}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    isSelected={selectedSession?.id === s.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'detail' && <DetailView />}

      {activeTab === 'compare' && <CompareView sessions={sessionList} />}
    </Card>
  );
};

export default PerformanceTimelineCard;
