import { memo, useCallback, useRef, useState } from 'react';
import type { SessionListItem } from '../../types/v2';

interface Props {
  sessions: SessionListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

export const SessionList = memo(function SessionList({
  sessions,
  selectedId,
  onSelect,
  onDelete,
  loading,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleDeleteClick = useCallback(
    (id: string, e: React.MouseEvent): void => {
      e.stopPropagation();
      if (confirmDelete === id) {
        if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        setConfirmDelete(null);
        onDelete(id);
      } else {
        setConfirmDelete(id);
        deleteTimerRef.current = setTimeout(() => setConfirmDelete(null), 3000);
      }
    },
    [confirmDelete, onDelete],
  );

  if (loading && sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-xs font-mono">
        LOADING...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <span className="text-text-secondary text-xs font-mono uppercase">NO SESSIONS</span>
        <span className="text-text-secondary text-xs font-mono opacity-60">
          プレイ後にセッションが記録されます
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto flex-1">
      {sessions.map((s) => {
        const start = new Date(s.startedAt);
        const dateStr = start.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
        const timeStr = start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors ${
              selectedId === s.id
                ? 'bg-accent-500/10 border border-accent-500/30'
                : 'border border-transparent hover:bg-base-700/40'
            }`}
          >
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-text-primary text-xs font-mono truncate">{s.gameName}</span>
              <span className="text-text-secondary text-xs font-mono">
                {dateStr} {timeStr}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-text-primary text-xs font-mono">
                  {s.summary.avgFps.toFixed(0)} FPS
                </div>
                <div className="text-text-secondary text-xs font-mono">
                  1%: {s.summary.pct1Low.toFixed(0)}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleDeleteClick(s.id, e)}
                className={`text-xs font-mono px-1.5 py-0.5 rounded border transition-colors ${
                  confirmDelete === s.id
                    ? 'border-danger-500 bg-danger-500/10 text-danger-500'
                    : 'border-transparent text-text-secondary hover:border-danger-500/40 hover:text-danger-500'
                }`}
              >
                {confirmDelete === s.id ? '✓?' : '✕'}
              </button>
            </div>
          </button>
        );
      })}
    </div>
  );
});
