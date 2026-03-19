import type React from 'react';
import { fmtDate, fmtDuration, fmtNum } from '../../lib/formatters';
import type { SavedFrameTimeSession, SessionListItem } from '../../types';
import SummaryPanel from './SummaryPanel';

interface SessionListViewProps {
  sessionList: SessionListItem[];
  selectedSession: SavedFrameTimeSession | null;
  selectedId: string | null;
  deleteConfirmId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
}

export default function SessionListView({
  sessionList,
  selectedSession,
  selectedId,
  deleteConfirmId,
  isLoading,
  onSelect,
  onDeleteRequest,
  onDeleteConfirm,
}: SessionListViewProps): React.ReactElement {
  return (
    <div className="flex gap-3">
      <div className="flex-1 min-w-0">
        {isLoading && <div className="text-[11px] text-text-muted">Loading...</div>}
        {!isLoading && sessionList.length === 0 && (
          <div className="text-[11px] text-text-muted">セッションがありません</div>
        )}
        {sessionList.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`w-full flex items-center justify-between px-2 py-1 border-b border-border-subtle text-left transition-colors ${
              selectedId === s.id ? 'bg-accent-500/10' : 'hover:bg-base-800'
            }`}
          >
            <div>
              <div className="text-[11px] text-text-primary">{s.gameName}</div>
              <div className="text-[9px] text-text-muted">
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
                    onDeleteConfirm(s.id);
                  }}
                  className="text-[9px] text-danger-500 border border-danger-500 px-1 rounded"
                >
                  CONFIRM
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(s.id);
                  }}
                  className="text-[9px] text-text-muted hover:text-danger-500"
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
          <div className="text-[9px] text-text-muted">DETAIL</div>
          <div className="text-[11px] text-text-primary">{selectedSession.gameName}</div>
          <SummaryPanel summary={selectedSession.summary} />
          {selectedSession.note && (
            <div className="text-[10px] text-text-secondary italic">{selectedSession.note}</div>
          )}
        </div>
      )}
    </div>
  );
}
