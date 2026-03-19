import type React from 'react';
import { useState } from 'react';
import { useProcessSort } from '../../hooks/useProcessSort';
import { formatTime } from '../../lib/formatters';
import { useBoostStore } from '../../stores/useBoostStore';
import { useOpsStore } from '../../stores/useOpsStore';
import { Button } from '../ui';
import Input from '../ui/Input';
import BoostResultsPanel from './BoostResultsPanel';
import KillConfirmModal from './KillConfirmModal';
import ProcessTable from './ProcessTable';

const DEFAULT_CPU_THRESHOLD = 15;

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

  const handleRowClick = (pid: number) => {
    setSelectedPid(selectedPid === pid ? null : pid);
  };

  const handleKillRequest = (pid: number, name: string) => {
    setKillTarget({ pid, name });
    setKillModalOpen(true);
  };

  const handleKillConfirm = async () => {
    if (killTarget) {
      await killProcess(killTarget.pid);
      setKillModalOpen(false);
      setKillTarget(null);
      setSelectedPid(null);
    }
  };

  const handlePriority = async (pid: number, priority: 'high' | 'normal' | 'idle') => {
    await setProcessPriority(pid, priority);
  };

  const handleRunBoost = async () => {
    await runBoost(threshold);
  };

  return (
    <div className={className}>
      {error && (
        <div className="px-4 py-2 mb-4 bg-base-800 border-b border-danger-600 text-danger-500 text-xs rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-4 space-y-3">
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
          <span className="text-xs text-text-muted">
            AUTO-UPDATING · LAST: {formatTime(lastUpdated)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="threshold-input" className="text-xs text-text-secondary">
            CPU閾値:
          </label>
          <input
            id="threshold-input"
            type="number"
            min="1"
            max="100"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-12 px-2 py-1 bg-base-800 text-text-primary border border-border-subtle rounded-lg font-mono text-xs"
          />
          <span className="text-xs text-text-secondary">%</span>
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

      {lastResult && <BoostResultsPanel lastResult={lastResult} />}

      <KillConfirmModal
        isOpen={killModalOpen}
        killTarget={killTarget}
        onClose={() => setKillModalOpen(false)}
        onConfirm={handleKillConfirm}
      />
    </div>
  );
}
