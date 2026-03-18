import React, { useMemo, useState } from 'react';
import { useBoostStore } from '../../stores/useBoostStore';
import { useOpsStore } from '../../stores/useOpsStore';
import type { SystemProcess } from '../../types';
import { Button } from '../ui';
import Input from '../ui/Input';
import Modal, { ModalActions } from '../ui/Modal';

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

function formatDiskIO(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB/s` : `${kb.toFixed(1)}KB/s`;
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
  const { processes, isLoading, lastUpdated, killProcess, setProcessPriority } = useOpsStore();
  const [threshold, setThreshold] = useState(DEFAULT_CPU_THRESHOLD);
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'cpu' | 'mem' | 'diskRead' | 'diskWrite'>('cpu');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [killModalOpen, setKillModalOpen] = useState(false);
  const [killTarget, setKillTarget] = useState<{ pid: number; name: string } | null>(null);

  // フィルタ済みプロセスリスト
  const filteredProcesses = useMemo(
    () =>
      processes.filter(
        (p) => filterText === '' || p.name.toLowerCase().includes(filterText.toLowerCase()),
      ),
    [processes, filterText],
  );

  // ソート済みプロセスリスト
  const sortedProcesses = useMemo(() => {
    const sorted = [...filteredProcesses];
    sorted.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortKey) {
        case 'name': {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          return sortDirection === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
        }
        case 'cpu':
          aValue = a.cpuPercent;
          bValue = b.cpuPercent;
          break;
        case 'mem':
          aValue = a.memMb;
          bValue = b.memMb;
          break;
        case 'diskRead':
          aValue = a.diskReadKb;
          bValue = b.diskReadKb;
          break;
        case 'diskWrite':
          aValue = a.diskWriteKb;
          bValue = b.diskWriteKb;
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    return sorted;
  }, [filteredProcesses, sortKey, sortDirection]);

  // BOOST対象プロセス数
  const targetCount = useMemo(
    () => processes.filter((p) => p.cpuPercent >= threshold && p.canTerminate).length,
    [processes, threshold],
  );

  // ソートハンドラ
  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // プロセス選択ハンドラ
  const handleRowClick = (pid: number) => {
    setSelectedPid(selectedPid === pid ? null : pid);
  };

  // KILLリクエストハンドラ
  const handleKillRequest = (pid: number, name: string) => {
    setKillTarget({ pid, name });
    setKillModalOpen(true);
  };

  // KILL実行ハンドラ
  const handleKillConfirm = async () => {
    if (killTarget) {
      await killProcess(killTarget.pid);
      setKillModalOpen(false);
      setKillTarget(null);
      setSelectedPid(null);
    }
  };

  // 優先度変更ハンドラ
  const handlePriority = async (pid: number, priority: 'high' | 'normal' | 'idle') => {
    await setProcessPriority(pid, priority);
  };

  const handleRunBoost = async () => {
    await runBoost(threshold);
    // BOOST実行後は nexus://ops イベントで自動更新される
  };

  const handleRefresh = () => {
    // 手動更新は不要（nexus://ops イベントで自動更新）
  };

  const formatDuration = (durationMs: number): string => {
    if (durationMs < BOOST_DURATION_SHORT_MS) return `${durationMs}ms`;
    return `${(durationMs / BOOST_DURATION_SHORT_MS).toFixed(1)}s`;
  };

  return (
    <div className={className}>
      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 mb-4 bg-base-800 border-b border-danger-600 text-danger-500 font-(--font-mono) text-[10px] rounded">
          {error}
        </div>
      )}

      {/* Header with Filter, Threshold, Run Boost, Refresh, and Last Updated */}
      <div className="mb-4 space-y-3">
        {/* Filter Row */}
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="プロセス名で絞り込み..."
            value={filterText}
            onChange={setFilterText}
            size="sm"
            fullWidth={true}
            className="max-w-xs"
          />
          <div className="flex-1" />
          <Button
            variant="primary"
            size="md"
            onClick={handleRunBoost}
            disabled={isRunning}
            loading={isRunning}
          >
            ▶ RUN BOOST
          </Button>
          <Button variant="secondary" size="md" onClick={handleRefresh} disabled={isLoading}>
            ↺ REFRESH
          </Button>
          {lastUpdated && (
            <span className="font-(--font-mono) text-[10px] text-text-muted">
              LAST: {formatTime(lastUpdated)}
            </span>
          )}
        </div>

        {/* Threshold Row */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="threshold-input"
            className="font-(--font-mono) text-[11px] text-text-secondary"
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
            className="w-12 px-2 py-1 bg-base-800 text-text-primary border border-border-subtle rounded font-(--font-mono) text-[11px]"
          />
          <span className="font-(--font-mono) text-[11px] text-text-secondary">%</span>
        </div>
      </div>

      {/* Live Processes Panel */}
      <div className="mb-6">
        <div className="font-(--font-mono) text-[10px] text-text-muted mb-2 tracking-[0.12em]">
          {filterText
            ? `LIVE PROCESSES (表示 ${filteredProcesses.length} / 全 ${processes.length} 件 / BOOST対象: ${targetCount}件)`
            : `LIVE PROCESSES (${processes.length}件 / BOOST対象: ${targetCount}件)`}
        </div>
        <div className="bg-base-800 border border-border-subtle rounded overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center font-(--font-mono) text-[11px] text-text-muted">
              LOADING PROCESSES...
            </div>
          ) : processes.length === 0 ? (
            <div className="p-4 text-center font-(--font-mono) text-[11px] text-text-muted">
              NO DATA — PRESS REFRESH TO LOAD
            </div>
          ) : (
            <table className="w-full border-collapse font-(--font-mono) text-[10px]">
              <thead className="sticky top-0 bg-base-800 border-b border-border-subtle">
                <tr>
                  <th
                    className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none"
                    onClick={() => handleSort('name')}
                  >
                    NAME {sortKey === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none w-16"
                    onClick={() => handleSort('cpu')}
                  >
                    CPU% {sortKey === 'cpu' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none w-16"
                    onClick={() => handleSort('mem')}
                  >
                    MEM {sortKey === 'mem' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none w-20"
                    onClick={() => handleSort('diskRead')}
                  >
                    DISK R {sortKey === 'diskRead' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left cursor-pointer select-none w-20"
                    onClick={() => handleSort('diskWrite')}
                  >
                    DISK W {sortKey === 'diskWrite' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="px-3 py-[6px] font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-[0.12em] text-left w-20">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProcesses.map((process, index) => {
                  const status = getProcessStatus(process, threshold);
                  const cpuColor =
                    process.cpuPercent >= 50
                      ? 'text-danger-500'
                      : process.cpuPercent >= 20
                        ? 'text-accent-400'
                        : 'text-text-secondary';
                  const isSelected = selectedPid === process.pid;
                  const canTerminate = process.canTerminate;

                  return (
                    <React.Fragment key={process.pid}>
                      <tr
                        className={`cursor-pointer hover:bg-base-700 ${
                          isSelected ? 'bg-base-900/10 border-l-2 border-accent-500' : ''
                        } ${index % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                        onClick={() => handleRowClick(process.pid)}
                      >
                        <td className="px-3 py-[5px] font-(--font-mono) text-[12px] text-text-primary">
                          {process.name}
                        </td>
                        <td
                          className={`px-3 py-[5px] font-(--font-mono) text-[12px] text-right ${cpuColor}`}
                        >
                          {process.cpuPercent.toFixed(1)}%
                        </td>
                        <td className="px-3 py-[5px] font-(--font-mono) text-[12px] text-right text-text-primary">
                          {formatMemory(process.memMb)}
                        </td>
                        <td className="px-3 py-[5px] font-(--font-mono) text-[12px] text-right text-text-primary">
                          {formatDiskIO(process.diskReadKb)}
                        </td>
                        <td className="px-3 py-[5px] font-(--font-mono) text-[12px] text-right text-text-primary">
                          {formatDiskIO(process.diskWriteKb)}
                        </td>
                        <td className="px-3 py-[5px] font-(--font-mono) text-[12px]">
                          {status === 'target' ? (
                            <span className="inline-block px-1 py-0.5 border border-accent-500 text-accent-500 text-[9px] font-(--font-mono)">
                              [TARGET]
                            </span>
                          ) : status === 'protected' ? (
                            <span className="inline-block px-1 py-0.5 border border-[var(--color-text-muted)] text-text-muted text-[9px] font-(--font-mono)">
                              [PROT]
                            </span>
                          ) : (
                            <span className="text-text-muted">─</span>
                          )}
                        </td>
                      </tr>

                      {/* アクションパネル */}
                      {isSelected && (
                        <tr>
                          <td colSpan={6} className="px-3 py-2 bg-base-700">
                            <div className="flex items-center gap-2">
                              <span className="font-(--font-mono) text-[10px] text-text-muted">
                                PRIORITY:
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handlePriority(process.pid, 'high')}
                              >
                                HIGH
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handlePriority(process.pid, 'normal')}
                              >
                                NORMAL
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handlePriority(process.pid, 'idle')}
                              >
                                IDLE
                              </Button>
                              <div className="w-px h-4 bg-[var(--color-border-subtle)] mx-1" />
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleKillRequest(process.pid, process.name)}
                                disabled={!canTerminate}
                              >
                                ✕ KILL
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
          {/* Simulation Mode Warning */}
          {lastResult.isSimulation && (
            <div className="font-(--font-mono) text-[9px] text-text-muted bg-base-800 border border-border-subtle rounded-[3px] px-2 py-1 mb-2">
              ⚠ シミュレーションモード — 実際のプロセス最適化は未実装です
            </div>
          )}
          <div className="font-(--font-mono) text-[10px] font-semibold text-text-secondary mb-2">
            BOOST COMPLETE · {lastResult.actions.length} ACTIONS ·{' '}
            {formatDuration(lastResult.durationMs)}
          </div>
          <div className="bg-base-800 border border-border-subtle rounded overflow-hidden">
            <table className="w-full border-collapse font-(--font-mono) text-[10px]">
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
                          <span className="inline-block px-1 py-0.5 border border-[var(--color-text-muted)] text-text-muted text-[9px] font-(--font-mono)">
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
      )}

      {/* KILL確認モーダル */}
      <Modal
        isOpen={killModalOpen}
        onClose={() => setKillModalOpen(false)}
        title="プロセスの終了"
        size="sm"
        footer={
          <>
            <ModalActions.Close onClose={() => setKillModalOpen(false)}>
              キャンセル
            </ModalActions.Close>
            <ModalActions.Danger onConfirm={handleKillConfirm}>終了する</ModalActions.Danger>
          </>
        }
      >
        <div className="font-(--font-mono) text-[11px] text-text-primary">
          {killTarget && (
            <>
              「{killTarget.name}」(PID: {killTarget.pid}) を終了しますか？
              <br />
              <br />
              この操作は取り消せません。
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
