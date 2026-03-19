import { useState } from 'react';
import type { SessionListItem } from '../../types';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SessionRowProps {
  session: SessionListItem;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
}

export default function SessionRow({ session, onSelect, onDelete, isSelected }: SessionRowProps) {
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
            className="px-1 py-px font-mono text-[9px] border border-danger-500 text-danger-500 hover:bg-danger-500 hover:text-base-900 transition-colors"
          >
            YES
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(false);
            }}
            className="px-1 py-px font-mono text-[9px] border border-border-subtle text-text-muted hover:bg-base-700 transition-colors"
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
          className="shrink-0 px-1 py-px font-mono text-[9px] border border-border-subtle text-text-muted hover:border-danger-500 hover:text-danger-500 transition-colors"
        >
          DEL
        </button>
      )}
    </button>
  );
}
