import type React from 'react';
import { useState } from 'react';
import { useBoostStore } from '../../stores/useBoostStore';
import { Button } from '../ui';

const DEFAULT_CPU_THRESHOLD = 15;
const BOOST_DURATION_SHORT_MS = 1000;

interface ProcessTabProps {
  className?: string;
}

export default function ProcessTab({ className = '' }: ProcessTabProps): React.ReactElement {
  const { lastResult, isRunning, error, runBoost } = useBoostStore();
  const [threshold, setThreshold] = useState(DEFAULT_CPU_THRESHOLD);

  const handleRunBoost = async () => {
    await runBoost(threshold);
  };

  const formatDuration = (durationMs: number): string => {
    if (durationMs < BOOST_DURATION_SHORT_MS) return `${durationMs}ms`;
    return `${(durationMs / BOOST_DURATION_SHORT_MS).toFixed(1)}s`;
  };

  return (
    <div className={className}>
      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 mb-4 bg-red-500/10 border-b border-red-600 text-red-500 font-[var(--font-mono)] text-[10px] rounded">
          {error}
        </div>
      )}

      {/* Threshold Input */}
      <div className="mb-4 flex items-center gap-2">
        <label
          htmlFor="threshold-input"
          className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]"
        >
          CPU閾値 (%):
        </label>
        <input
          id="threshold-input"
          type="number"
          min="1"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-[60px] px-2 py-1 bg-[var(--color-base-800)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] rounded font-[var(--font-mono)] text-[11px]"
        />
      </div>

      {/* Run Boost Button */}
      <Button
        variant="primary"
        size="md"
        onClick={handleRunBoost}
        disabled={isRunning}
        loading={isRunning}
        className="mb-4"
      >
        ▶ RUN BOOST
      </Button>

      {/* Results Table */}
      {lastResult && (
        <div>
          <div className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-text-secondary)] mb-2">
            結果 ({formatDuration(lastResult.durationMs)})
          </div>
          <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded overflow-hidden">
            <table className="w-full border-collapse font-[var(--font-mono)] text-[10px]">
              <thead>
                <tr className="bg-[var(--color-base-700)]">
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)]">
                    ラベル
                  </th>
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)]">
                    アクション
                  </th>
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)]">
                    結果
                  </th>
                </tr>
              </thead>
              <tbody>
                {lastResult.actions.map((action) => (
                  <tr key={action.label}>
                    <td className="p-2 text-[var(--color-text-primary)] border-b border-[var(--color-border-subtle)]">
                      {action.label}
                    </td>
                    <td className="p-2 text-[var(--color-text-primary)] border-b border-[var(--color-border-subtle)]">
                      {action.actionType}
                    </td>
                    <td className="p-2 flex items-center gap-1.5 border-b border-[var(--color-border-subtle)]">
                      <span
                        className={
                          action.success
                            ? 'text-[var(--color-success-500)]'
                            : 'text-[var(--color-danger-500)]'
                        }
                      >
                        {action.success ? '✓' : '✗'}
                      </span>
                      {action.isProtected && (
                        <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
                          保護
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
