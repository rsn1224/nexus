import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useBoostStore } from '../../stores/useBoostStore';
import { useOpsStore } from '../../stores/useOpsStore';
import type { SystemProcess } from '../../types';
import { Button } from '../ui';

const DEFAULT_CPU_THRESHOLD = 15;
const BOOST_DURATION_SHORT_MS = 1000;

// 保護プロセスリスト
const PROTECTED_PROCESS_NAMES = new Set([
  'system',
  'smss.exe',
  'csrss.exe',
  'wininit.exe',
  'winlogon.exe',
  'lsass.exe',
  'services.exe',
  'svchost.exe',
]);

function getProcessStatus(p: SystemProcess, threshold: number): 'target' | 'protected' | 'normal' {
  if (PROTECTED_PROCESS_NAMES.has(p.name.toLowerCase())) return 'protected';
  if (p.cpuPercent >= threshold && p.canTerminate) return 'target';
  return 'normal';
}

function formatMemory(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb}MB`;
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

interface ProcessTabProps {
  className?: string;
}

export default function ProcessTab({ className = '' }: ProcessTabProps): React.ReactElement {
  const { lastResult, isRunning, error, runBoost } = useBoostStore();
  const { processes, isLoading, fetchProcesses, lastUpdated } = useOpsStore();
  const [threshold, setThreshold] = useState(DEFAULT_CPU_THRESHOLD);

  // マウント時に自動でプロセスを取得
  useEffect(() => {
    void fetchProcesses();
  }, [fetchProcesses]);

  // ソート済みプロセスリスト
  const sortedProcesses = useMemo(
    () => [...processes].sort((a, b) => b.cpuPercent - a.cpuPercent),
    [processes],
  );

  // BOOST対象プロセス数
  const targetCount = useMemo(
    () =>
      processes.filter(
        (p) =>
          p.cpuPercent >= threshold &&
          p.canTerminate &&
          !PROTECTED_PROCESS_NAMES.has(p.name.toLowerCase()),
      ).length,
    [processes, threshold],
  );

  const handleRunBoost = async () => {
    await runBoost(threshold);
    // BOOST実行後にプロセスリストを再取得
    void fetchProcesses();
  };

  const handleRefresh = () => {
    void fetchProcesses();
  };

  const formatDuration = (durationMs: number): string => {
    if (durationMs < BOOST_DURATION_SHORT_MS) return `${durationMs}ms`;
    return `${(durationMs / BOOST_DURATION_SHORT_MS).toFixed(1)}s`;
  };

  return (
    <div className={className}>
      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 mb-4 bg-[var(--color-base-800)] border-b border-[var(--color-danger-600)] text-[var(--color-danger-500)] font-[var(--font-mono)] text-[10px] rounded">
          {error}
        </div>
      )}

      {/* Header with Threshold, Run Boost, Refresh, and Last Updated */}
      <div className="mb-4 flex items-center gap-2">
        <label
          htmlFor="threshold-input"
          className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]"
        >
          CPU閾値:
        </label>
        <input
          id="threshold-input"
          type="number"
          min="1"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-12 px-2 py-1 bg-[var(--color-base-800)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] rounded font-[var(--font-mono)] text-[11px]"
        />
        <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
          %
        </span>
        <Button
          variant="primary"
          size="md"
          onClick={handleRunBoost}
          disabled={isRunning}
          loading={isRunning}
          className="ml-auto"
        >
          ▶ RUN BOOST
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={handleRefresh}
          disabled={isLoading}
          className="ml-2"
        >
          ↺ REFRESH
        </Button>
        {lastUpdated && (
          <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] ml-2">
            LAST: {formatTime(lastUpdated)}
          </span>
        )}
      </div>

      {/* Live Processes Panel */}
      <div className="mb-6">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2 tracking-[0.12em]">
          LIVE PROCESSES ({processes.length}件 / BOOST対象: {targetCount}件)
        </div>
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">
              LOADING PROCESSES...
            </div>
          ) : processes.length === 0 ? (
            <div className="p-4 text-center font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)]">
              NO DATA — PRESS REFRESH TO LOAD
            </div>
          ) : (
            <table className="w-full border-collapse font-[var(--font-mono)] text-[10px]">
              <thead>
                <tr className="bg-[var(--color-base-700)]">
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)]">
                    NAME
                  </th>
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)] w-14">
                    CPU%
                  </th>
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)] w-18">
                    MEM
                  </th>
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)] w-20">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProcesses.map((process) => {
                  const status = getProcessStatus(process, threshold);
                  const cpuColor =
                    process.cpuPercent >= 50
                      ? 'text-[var(--color-danger-500)]'
                      : process.cpuPercent >= 20
                        ? 'text-[var(--color-accent-400)]'
                        : 'text-[var(--color-text-secondary)]';
                  return (
                    <tr key={process.pid}>
                      <td className="p-2 text-[var(--color-text-primary)] border-b border-[var(--color-border-subtle)]">
                        {process.name}
                      </td>
                      <td
                        className={`p-2 text-right border-b border-[var(--color-border-subtle)] ${cpuColor}`}
                      >
                        {process.cpuPercent.toFixed(1)}%
                      </td>
                      <td className="p-2 text-right text-[var(--color-text-primary)] border-b border-[var(--color-border-subtle)]">
                        {formatMemory(process.memMb)}
                      </td>
                      <td className="p-2 border-b border-[var(--color-border-subtle)]">
                        {status === 'target' ? (
                          <span className="inline-block px-1 py-0.5 border border-[var(--color-accent-500)] text-[var(--color-accent-500)] text-[9px] font-[var(--font-mono)]">
                            [TARGET]
                          </span>
                        ) : status === 'protected' ? (
                          <span className="inline-block px-1 py-0.5 border border-[var(--color-text-muted)] text-[var(--color-text-muted)] text-[9px] font-[var(--font-mono)]">
                            [PROT]
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">─</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Boost Results Panel */}
      {lastResult && (
        <div>
          <div className="font-[var(--font-mono)] text-[10px] font-semibold text-[var(--color-text-secondary)] mb-2">
            BOOST COMPLETE · {lastResult.actions.length} ACTIONS ·{' '}
            {formatDuration(lastResult.durationMs)}
          </div>
          <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded overflow-hidden">
            <table className="w-full border-collapse font-[var(--font-mono)] text-[10px]">
              <thead>
                <tr className="bg-[var(--color-base-700)]">
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)]">
                    PROCESS
                  </th>
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)]">
                    ACTION
                  </th>
                  <th className="p-2 text-left text-[var(--color-text-secondary)] border-b border-[var(--color-border-subtle)]">
                    STATUS
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
                      {action.isProtected ? (
                        <span className="flex items-center gap-1">
                          SKIPPED
                          <span className="inline-block px-1 py-0.5 border border-[var(--color-text-muted)] text-[var(--color-text-muted)] text-[9px] font-[var(--font-mono)]">
                            [PROT]
                          </span>
                        </span>
                      ) : (
                        action.actionType
                      )}
                    </td>
                    <td className="p-2 flex items-center gap-1.5 border-b border-[var(--color-border-subtle)]">
                      <span
                        className={
                          action.success
                            ? 'text-[var(--color-success-500)]'
                            : 'text-[var(--color-danger-500)]'
                        }
                      >
                        {action.success ? '✓ OK' : `✗ ${action.detail}`}
                      </span>
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
