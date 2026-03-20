import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useState } from 'react';
import { extractErrorMessage } from '../../lib/tauri';
import { usePulseStore } from '../../stores/usePulseStore';

export const MemoryPanel = memo(function MemoryPanel() {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastClean, setLastClean] = useState<number | null>(null);

  const snapshots = usePulseStore((s) => s.snapshots);
  const latest = snapshots[snapshots.length - 1];
  const memUsedGb = latest ? (latest.memUsedMb / 1024).toFixed(1) : '—';
  const memTotalGb = latest ? (latest.memTotalMb / 1024).toFixed(1) : '—';
  const memPct = latest ? Math.round((latest.memUsedMb / latest.memTotalMb) * 100) : 0;

  const runCleanup = useCallback(async (): Promise<void> => {
    setApplying(true);
    setError(null);
    try {
      await invoke('manual_memory_cleanup');
      setLastClean(Date.now());
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setApplying(false);
    }
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
      <div className="piano-surface rounded p-4 flex flex-col gap-3">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
          MEMORY USAGE
        </p>
        <div className="flex items-end gap-2">
          <span className="text-text-primary text-2xl font-mono font-bold">{memUsedGb}</span>
          <span className="text-text-secondary text-sm font-mono mb-0.5">/ {memTotalGb} GB</span>
          <span
            className={`text-sm font-mono mb-0.5 ml-auto ${memPct >= 80 ? 'text-warning-500' : 'text-text-secondary'}`}
          >
            {memPct}%
          </span>
        </div>
        <div className="h-1.5 bg-base-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${memPct >= 80 ? 'bg-warning-500' : 'bg-accent-500'}`}
            style={{ width: `${memPct}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 bg-danger-500/10 border border-danger-500/30 rounded text-xs font-mono text-danger-500">
          {error}
        </div>
      )}

      {lastClean && (
        <div className="px-3 py-2 bg-success-500/10 border border-success-500/30 rounded text-xs font-mono text-success-500">
          CLEANED AT {new Date(lastClean).toLocaleTimeString()}
        </div>
      )}

      <button
        type="button"
        onClick={() => void runCleanup()}
        disabled={applying}
        className="px-4 py-2 text-xs font-mono rounded border border-accent-500 text-accent-500 bg-accent-500/10 hover:bg-accent-500/20 transition-colors disabled:opacity-40"
      >
        {applying ? 'CLEANING...' : 'CLEAN MEMORY ▶'}
      </button>
    </div>
  );
});
