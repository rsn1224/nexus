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
      <div className="glass-panel p-8 flex items-center justify-center text-text-secondary text-xs">
        LOADING...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="glass-panel p-8 flex flex-col items-center justify-center gap-2">
        <span className="text-text-secondary text-xs uppercase">NO SESSIONS</span>
        <span className="text-text-muted text-xs">プレイ後にセッションが記録されます</span>
      </div>
    );
  }

  return (
    <div className="glass-panel bloom-border overflow-hidden">
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-white/2 relative">
        <div className="absolute inset-y-0 left-0 w-1/4 bg-accent-500 shadow-[0_0_15px_rgba(68,214,44,0.6)] progress-flow" />
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/3 flex justify-between items-center bg-white/1">
        <div>
          <h3 className="font-black text-[10px] tracking-[0.3em] text-accent-500 uppercase flex items-center gap-3">
            <span className="material-symbols-outlined text-[16px]">history</span>
            SESSION TRANSACTION LOG / 取引履歴
          </h3>
          <p className="text-text-muted text-[8px] tracking-[0.2em] mt-1.5 uppercase font-light">
            {'PERFORMANCE DATA // VERIFIED BY CORE'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-black/60 text-text-muted text-[8px] tracking-[0.4em] uppercase font-black">
            <tr>
              <th className="px-6 py-4 border-b border-white/3">TIMESTAMP / 記録</th>
              <th className="px-6 py-4 border-b border-white/3">GAME / ゲーム</th>
              <th className="px-6 py-4 border-b border-white/3">DURATION / 期間</th>
              <th className="px-6 py-4 border-b border-white/3">FPS</th>
              <th className="px-6 py-4 border-b border-white/3 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/2">
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                isSelected={s.id === selectedId}
                confirmDelete={confirmDelete === s.id}
                onSelect={onSelect}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ─── Row sub-component ───────────────────────────────────

const SessionRow = memo(function SessionRow({
  session,
  isSelected,
  confirmDelete,
  onSelect,
  onDeleteClick,
}: {
  session: SessionListItem;
  isSelected: boolean;
  confirmDelete: boolean;
  onSelect: (id: string) => void;
  onDeleteClick: (id: string, e: React.MouseEvent) => void;
}) {
  const start = new Date(session.startedAt);
  const dateStr = `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, '0')}.${String(start.getDate()).padStart(2, '0')}`;
  const timeStr = start.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const endMs = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  const durationMin = Math.round((endMs - start.getTime()) / 60_000);
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  const durationStr = hours > 0 ? `${hours}H ${String(mins).padStart(2, '0')}M` : `${mins}M`;

  return (
    <tr
      className={`hover:bg-accent-500/5 transition-all cursor-pointer h-16 ${isSelected ? 'bg-accent-500/10' : ''}`}
      onClick={() => onSelect(session.id)}
    >
      <td className="px-6 py-3 text-[9px] tracking-[0.2em] text-text-secondary">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-accent-500 rounded-full pulse-node" />
          <span className="font-data">{`${dateStr} // ${timeStr}`}</span>
        </div>
      </td>
      <td className="px-6 py-3 text-[10px] font-black text-accent-500 tracking-tighter font-data">
        {session.gameName}
      </td>
      <td className="px-6 py-3 text-[9px] text-text-muted tracking-widest font-light font-data">
        {durationStr}
      </td>
      <td className="px-6 py-3">
        <span className="text-accent-500 font-black text-[10px] font-data">
          {session.summary.avgFps.toFixed(0)} FPS
        </span>
      </td>
      <td className="px-6 py-3 text-right">
        <button
          type="button"
          onClick={(e) => onDeleteClick(session.id, e)}
          className={`text-[8px] px-3 py-1.5 border font-black uppercase tracking-[0.3em] transition-all font-data ${
            confirmDelete
              ? 'border-danger-500/40 text-danger-500 bg-danger-500/10'
              : 'border-white/10 text-text-muted hover:border-danger-500/40 hover:text-danger-500'
          }`}
        >
          {confirmDelete ? 'CONFIRM?' : 'DELETE'}
        </button>
      </td>
    </tr>
  );
});
