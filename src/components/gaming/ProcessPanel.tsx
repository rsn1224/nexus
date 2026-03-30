import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import log from '../../lib/logger';
import { extractErrorMessage } from '../../lib/tauri';
import type { SystemProcess } from '../../types';

export const ProcessPanel = memo(function ProcessPanel() {
  const { t } = useTranslation('tactics');
  const [processes, setProcesses] = useState<SystemProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmKill, setConfirmKill] = useState<number | null>(null);
  const killTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchProcesses = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const list = await invoke<SystemProcess[]>('list_processes');
      setProcesses(list.sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, 20));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProcesses();
  }, [fetchProcesses]);

  const handleKill = useCallback(
    (pid: number): void => {
      if (confirmKill === pid) {
        if (killTimerRef.current) clearTimeout(killTimerRef.current);
        setConfirmKill(null);
        invoke('kill_process', { pid })
          .then(() => fetchProcesses())
          .catch((err) => {
            log.error({ err }, 'process: kill failed');
            setError(extractErrorMessage(err));
          });
      } else {
        setConfirmKill(pid);
        killTimerRef.current = setTimeout(() => setConfirmKill(null), 3000);
      }
    },
    [confirmKill, fetchProcesses],
  );

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
          {t('process.topProcesses')}
        </p>
        <button
          type="button"
          onClick={() => void fetchProcesses()}
          disabled={loading}
          className="text-xs font-mono text-accent-500 hover:text-text-primary transition-colors disabled:opacity-40"
        >
          {t('process.refresh')}
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-danger-500/10 border border-danger-500/30 rounded text-xs font-mono text-danger-500">
          {error}
        </div>
      )}

      <div className="piano-surface rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_4rem_5rem_5rem] gap-2 px-3 py-1.5 border-b border-border-subtle">
          {(
            [
              t('process.processHeader'),
              t('process.cpuHeader'),
              t('process.memHeader'),
              '',
            ] as const
          ).map((h) => (
            <span key={h} className="text-text-secondary text-xs font-mono uppercase">
              {h}
            </span>
          ))}
        </div>
        {processes.map((p) => (
          <div
            key={p.pid}
            className="grid grid-cols-[1fr_4rem_5rem_5rem] gap-2 px-3 py-1.5 border-b border-border-subtle/50 hover:bg-base-700/30 transition-colors"
          >
            <span className="text-text-primary text-xs font-mono truncate">{p.name}</span>
            <span
              className={`text-xs font-mono ${p.cpuPercent >= 15 ? 'text-warning-500' : 'text-text-secondary'}`}
            >
              {p.cpuPercent.toFixed(1)}%
            </span>
            <span className="text-text-secondary text-xs font-mono">{p.memMb.toFixed(0)}</span>
            <button
              type="button"
              onClick={() => handleKill(p.pid)}
              className={`text-xs font-mono rounded px-1.5 py-0.5 border transition-colors ${
                confirmKill === p.pid
                  ? 'border-danger-500 bg-danger-500/10 text-danger-500'
                  : 'border-border-subtle text-text-secondary hover:border-danger-500/50 hover:text-danger-500'
              }`}
            >
              {confirmKill === p.pid ? t('process.confirmKill') : t('process.kill')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});
