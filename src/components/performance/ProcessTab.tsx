import type React from 'react';
import { useState } from 'react';
import { useProcessSort } from '../../hooks/useProcessSort';
import { useBoostStore } from '../../stores/useBoostStore';
import { useOpsStore } from '../../stores/useOpsStore';
import { Button } from '../ui';
import Input from '../ui/Input';
import Modal, { ModalActions } from '../ui/Modal';
import ProcessTable from './ProcessTable';

const DEFAULT_CPU_THRESHOLD = 15;
const BOOST_DURATION_SHORT_MS = 1000;

interface ProcessTabProps {
  className?: string;
}

export default function ProcessTab({ className = '' }: ProcessTabProps): React.ReactElement {
  const { lastResult, isRunning, error, runBoost } = useBoostStore();
  const { processes, isLoading, lastUpdated, killProcess, setProcessPriority } = useOpsStore();
  const [threshold, setThreshold] = useState(DEFAULT_CPU_THRESHOLD);
  const [filterText, setFilterText] = useState('');
  const [selectedPid, setSelectedPid] = useState<number | null>(null);

  const { filteredProcesses, sortedProcesses, targetCount, sortKey, sortDirection, handleSort } =
    useProcessSort(processes, threshold, filterText);
  const [killModalOpen, setKillModalOpen] = useState(false);
  const [killTarget, setKillTarget] = useState<{ pid: number; name: string } | null>(null);

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

  // 時間フォーマット関数
  const formatTime = (timestamp: number | null) => {
    if (timestamp == null) return '--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (durationMs: number): string => {
    if (durationMs < BOOST_DURATION_SHORT_MS) return `${durationMs}ms`;
    return `${(durationMs / BOOST_DURATION_SHORT_MS).toFixed(1)}s`;
  };

  return (
    <div className={className}>
      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 mb-4 bg-base-800 border-b border-danger-600 text-danger-500 font-mono text-[10px] rounded">
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
          <span className="font-mono text-[10px] text-text-muted">
            AUTO-UPDATING · LAST: {formatTime(lastUpdated)}
          </span>
        </div>

        {/* Threshold Row */}
        <div className="flex items-center gap-2">
          <label htmlFor="threshold-input" className="font-mono text-[11px] text-text-secondary">
            CPU閾値:
          </label>
          <input
            id="threshold-input"
            type="number"
            min="1"
            max="100"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-12 px-2 py-1 bg-base-800 text-text-primary border border-border-subtle rounded font-mono text-[11px]"
          />
          <span className="font-mono text-[11px] text-text-secondary">%</span>
        </div>
      </div>

      <ProcessTable
        processes={processes}
        filteredProcesses={filteredProcesses}
        sortedProcesses={sortedProcesses}
        filterText={filterText}
        targetCount={targetCount}
        threshold={threshold}
        isLoading={isLoading}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        selectedPid={selectedPid}
        onRowClick={handleRowClick}
        onPriority={handlePriority}
        onKillRequest={handleKillRequest}
      />

      {/* Boost Results Panel */}
      {lastResult && (
        <div>
          {/* Simulation Mode Warning */}
          {lastResult.isSimulation && (
            <div className="font-mono text-[9px] text-text-muted bg-base-800 border border-border-subtle rounded-[3px] px-2 py-1 mb-2">
              ⚠ シミュレーションモード — 実際のプロセス最適化は未実装です
            </div>
          )}
          <div className="font-mono text-[10px] font-semibold text-text-secondary mb-2">
            BOOST COMPLETE · {lastResult.actions.length} ACTIONS ·{' '}
            {formatDuration(lastResult.durationMs)}
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
                          <span className="inline-block px-1 py-0.5 border border-text-muted text-text-muted text-[9px] font-mono">
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
        <div className="font-mono text-[11px] text-text-primary">
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
