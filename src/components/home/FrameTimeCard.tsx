import { useEffect, useRef, useState } from 'react';
import { useFrameTimeActions, useFrameTimeState } from '../../stores/useFrameTimeStore';
import { useOpsStore } from '../../stores/useOpsStore';
import type { SystemProcess } from '../../types';
import { ErrorBanner, LoadingState } from '../ui';
import FrameTimeGraph from './FrameTimeGraph';

export default function FrameTimeCard() {
  const { monitorState, snapshot, isLoading, error } = useFrameTimeState();
  const { startMonitor, stopMonitor, getStatus, setupListeners } = useFrameTimeActions();
  const processes = useOpsStore((s) => s.processes);
  const unlistenRef = useRef<(() => void) | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');

  // CPU使用率があるプロセスにフィルタリング
  const availableProcesses = processes.filter((p: SystemProcess) => p.cpuPercent > 0);
  const selectedProcess = availableProcesses.find(
    (p: SystemProcess) => p.pid.toString() === selectedProcessId,
  );

  useEffect(() => {
    // 初期化: 現在の状態を取得
    getStatus();

    // イベントリスナーをセットアップ
    (async () => {
      const unlisten = await setupListeners();
      unlistenRef.current = unlisten;
    })();

    // クリーンアップ
    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [getStatus, setupListeners]);

  const handleStart = () => {
    if (selectedProcess) {
      startMonitor(selectedProcess.pid, selectedProcess.name);
    }
  };

  const handleStop = () => {
    stopMonitor();
  };

  if (monitorState.type === 'error') {
    return <ErrorBanner message={`FRAME TIME ERROR: ${monitorState.message}`} variant="error" />;
  }

  if (isLoading && monitorState.type === 'stopped') {
    return <LoadingState message="INITIALIZING..." height="h-[120px]" />;
  }

  return (
    <div className="p-4 bg-base-800 border border-border-subtle font-(--font-mono) text-[12px] text-text-primary">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-3">
        <div className="font-bold text-[11px] text-(--color-accent-500)">FRAME TIME</div>
        <div
          className={`text-[9px] ${
            monitorState.type === 'running' ? 'text-success-500' : 'text-text-muted'
          }`}
        >
          {monitorState.type === 'running' ? 'MONITORING' : 'STOPPED'}
        </div>
      </div>

      {/* プロセス情報 */}
      {monitorState.type === 'running' && (
        <div className="mb-3 text-[10px] text-text-secondary">
          <div>PID: {monitorState.pid}</div>
          <div>PROCESS: {monitorState.processName}</div>
        </div>
      )}

      {/* プロセス選択 */}
      {monitorState.type === 'stopped' && (
        <div className="mb-3">
          <div className="text-[9px] text-text-muted mb-1">監視対象プロセス:</div>
          <select
            value={selectedProcessId}
            onChange={(e) => setSelectedProcessId(e.target.value)}
            className="w-full px-2 py-1 text-[10px] bg-base-700 border border-border-subtle rounded text-text-primary font-(--font-mono)"
          >
            <option value="">プロセスを選択...</option>
            {availableProcesses.map((process: SystemProcess) => (
              <option key={process.pid} value={process.pid.toString()}>
                {process.name} (PID: {process.pid}, CPU: {process.cpuPercent.toFixed(1)}%)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* FPS 指標 */}
      {snapshot && (
        <div className="mb-3">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <div className="text-[9px] text-text-muted">AVG FPS</div>
              <div className="text-[14px] font-bold text-(--color-accent-500)">
                {snapshot.avgFps.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-text-muted">1% LOW</div>
              <div className="text-[14px] font-bold text-(--color-accent-400)">
                {snapshot.pct1Low.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-text-muted">0.1% LOW</div>
              <div className="text-[14px] font-bold text-danger-500">
                {snapshot.pct01Low.toFixed(1)}
              </div>
            </div>
          </div>
          <div className="flex justify-between text-[9px]">
            <div className="text-text-muted">
              STUTTERS:{' '}
              <span className={snapshot.stutterCount > 0 ? 'text-danger-500' : 'text-success-500'}>
                {snapshot.stutterCount}
              </span>
            </div>
            <div className="text-text-muted">LAST: {snapshot.lastFrameTimeMs.toFixed(1)} ms</div>
          </div>
        </div>
      )}

      {/* グラフ */}
      {snapshot && snapshot.frameTimes.length > 0 && (
        <div className="mb-3">
          <FrameTimeGraph frameTimes={snapshot.frameTimes} />
        </div>
      )}

      {/* コントロールボタン */}
      <div className="flex gap-2">
        {monitorState.type === 'stopped' ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={isLoading || !selectedProcess}
            className={`flex-1 px-3 py-[6px] font-(--font-mono) text-[10px] font-bold border ${
              isLoading || !selectedProcess
                ? 'bg-base-800 text-text-muted cursor-not-allowed border-border-subtle'
                : 'bg-(--color-accent-500) text-base-900 cursor-pointer border-(--color-accent-500) hover:bg-(--color-accent-600)'
            }`}
          >
            {isLoading ? 'STARTING...' : 'START'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            disabled={isLoading}
            className={`flex-1 px-3 py-[6px] font-(--font-mono) text-[10px] font-bold border ${
              isLoading
                ? 'bg-base-800 text-text-muted cursor-not-allowed border-border-subtle'
                : 'bg-danger-500 text-base-900 cursor-pointer border-danger-500 hover:bg-danger-600'
            }`}
          >
            {isLoading ? 'STOPPING...' : 'STOP'}
          </button>
        )}
      </div>

      {/* エラー表示 */}
      {error && <div className="mt-2 text-[9px] text-danger-500">{error}</div>}
    </div>
  );
}
