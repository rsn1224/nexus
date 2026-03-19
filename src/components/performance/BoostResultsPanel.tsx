import type React from 'react';
import { formatDurationMs } from '../../lib/formatters';
import type { BoostResult } from '../../types';

interface BoostResultsPanelProps {
  lastResult: BoostResult;
}

export default function BoostResultsPanel({
  lastResult,
}: BoostResultsPanelProps): React.ReactElement {
  return (
    <div>
      {lastResult.isSimulation && (
        <div className="text-[9px] text-text-muted bg-base-800 border border-border-subtle rounded-[3px] px-2 py-1 mb-2">
          ⚠ シミュレーションモード — 実際のプロセス最適化は未実装です
        </div>
      )}
      <div className="text-[10px] font-semibold text-text-secondary mb-2">
        BOOST COMPLETE · {lastResult.actions.length} ACTIONS ·{' '}
        {formatDurationMs(lastResult.durationMs)}
      </div>
      <div className="bg-base-800 border border-border-subtle rounded overflow-hidden">
        <table className="w-full border-collapse font-mono text-[10px]">
          <thead>
            <tr className="bg-base-700">
              <th className="p-2 text-left text-text-secondary border-b border-border-subtle">
                PROCESS
              </th>
              <th className="p-2 text-left text-text-secondary border-b border-border-subtle">
                ACTION
              </th>
              <th className="p-2 text-left text-text-secondary border-b border-border-subtle">
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {lastResult.actions.map((action) => (
              <tr key={action.label}>
                <td className="p-2 text-text-primary border-b border-border-subtle">
                  {action.label}
                </td>
                <td className="p-2 text-text-primary border-b border-border-subtle">
                  {action.isProtected ? (
                    <span className="flex items-center gap-1">
                      SKIPPED
                      <span className="inline-block px-1 py-0.5 border border-text-muted text-text-muted text-[9px]">
                        [PROT]
                      </span>
                    </span>
                  ) : (
                    action.actionType
                  )}
                </td>
                <td className="p-2 flex items-center gap-1.5 border-b border-border-subtle">
                  <span className={action.success ? 'text-success-500' : 'text-danger-500'}>
                    {action.success ? '✓ OK' : `✗ ${action.detail}`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
