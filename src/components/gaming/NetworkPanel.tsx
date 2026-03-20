import { invoke } from '@tauri-apps/api/core';
import { memo, useCallback, useEffect, useState } from 'react';
import { extractErrorMessage } from '../../lib/tauri';
import type { TcpTuningState } from '../../types';

export const NetworkPanel = memo(function NetworkPanel() {
  const [state, setState] = useState<TcpTuningState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const s = await invoke<TcpTuningState>('get_tcp_tuning_state');
      setState(s);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const run = useCallback(
    async (cmd: string, args: Record<string, unknown> = {}): Promise<void> => {
      setError(null);
      try {
        await invoke(cmd, args);
        await fetch();
      } catch (err) {
        setError(extractErrorMessage(err));
      }
    },
    [fetch],
  );

  if (loading && !state) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-secondary text-xs font-mono">
        LOADING...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
      {error && (
        <div className="px-3 py-2 bg-danger-500/10 border border-danger-500/30 rounded text-xs font-mono text-danger-500">
          {error}
        </div>
      )}

      <div className="piano-surface rounded p-3 flex flex-col gap-3">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
          TCP TUNING
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-primary text-xs font-mono">NAGLE ALGORITHM</p>
            <p className="text-text-secondary text-xs font-mono mt-0.5">
              {state?.nagleDisabled ? 'DISABLED (optimal)' : 'ENABLED'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void run('set_nagle_disabled', { disabled: !state?.nagleDisabled })}
            className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
              state?.nagleDisabled
                ? 'border-success-500/40 text-success-500 hover:border-warning-500 hover:text-warning-500'
                : 'border-accent-500 text-accent-500 hover:bg-accent-500/10'
            }`}
          >
            {state?.nagleDisabled ? 'ENABLE' : 'DISABLE'}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-primary text-xs font-mono">DELAYED ACK</p>
            <p className="text-text-secondary text-xs font-mono mt-0.5">
              {state?.delayedAckDisabled ? 'DISABLED (optimal)' : 'ENABLED'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              void run('set_delayed_ack_disabled', { disabled: !state?.delayedAckDisabled })
            }
            className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
              state?.delayedAckDisabled
                ? 'border-success-500/40 text-success-500 hover:border-warning-500 hover:text-warning-500'
                : 'border-accent-500 text-accent-500 hover:bg-accent-500/10'
            }`}
          >
            {state?.delayedAckDisabled ? 'ENABLE' : 'DISABLE'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void run('apply_gaming_network_preset')}
          className="flex-1 px-3 py-2 text-xs font-mono rounded border border-accent-500 text-accent-500 hover:bg-accent-500/10 transition-colors"
        >
          GAMING PRESET
        </button>
        <button
          type="button"
          onClick={() => void run('reset_network_defaults')}
          className="flex-1 px-3 py-2 text-xs font-mono rounded border border-border-subtle text-text-secondary hover:border-warning-500 hover:text-warning-500 transition-colors"
        >
          RESET DEFAULTS
        </button>
      </div>
    </div>
  );
});
