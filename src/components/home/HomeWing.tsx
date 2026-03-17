import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { homePageSuggestions } from '../../lib/localAi';
import { useHardwareStore } from '../../stores/useHardwareStore';
import { useLauncherStore } from '../../stores/useLauncherStore';
import { useLogStore } from '../../stores/useLogStore';
import { useNavStore } from '../../stores/useNavStore';
import { useOpsStore } from '../../stores/useOpsStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { useStorageStore } from '../../stores/useStorageStore';
import type { SystemProcess } from '../../types';
import AiPanel from '../shared/AiPanel';
import { Button, Card, StatusBadge } from '../ui';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OptimizationHistory {
  timestamp: number;
  action: string;
  result: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTopCpuProcesses(processes: SystemProcess[], limit: number = 3): SystemProcess[] {
  return [...processes].sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, limit);
}

function formatNetSpeed(kb: number): string {
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB/s`;
  }
  return `${kb.toFixed(0)} KB/s`;
}

function calcScore(
  cpuPercent: number | null,
  memUsed: number | null,
  memTotal: number | null,
): number | null {
  if (cpuPercent === null || memUsed === null || memTotal === null) return null;
  const score = Math.round(100 - cpuPercent * 0.5 - (memUsed / memTotal) * 30);
  return Math.max(0, Math.min(100, score));
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

// ─── HomeWing ────────────────────────────────────────────────────────────────

export default function HomeWing(): React.ReactElement {
  // Store data
  const processes = useOpsStore((s) => s.processes);
  const fetchProcesses = useOpsStore((s) => s.fetchProcesses);

  const latestSnapshot = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );

  const cpuPercent = latestSnapshot?.cpuPercent ?? null;
  const memUsed = latestSnapshot?.memUsedMb ?? null;
  const memTotal = latestSnapshot?.memTotalMb ?? null;
  const diskRead = latestSnapshot?.diskReadKb ?? null;
  const diskWrite = latestSnapshot?.diskWriteKb ?? null;
  const netRecv = latestSnapshot?.netRecvKb ?? null;
  const netSent = latestSnapshot?.netSentKb ?? null;
  const isPolling = usePulseStore((s) => s.isPolling);
  const startPolling = usePulseStore((s) => s.startPolling);

  const games = useLauncherStore((s) => s.games);
  const navigate = useNavStore((s) => s.navigate);
  const { logs } = useLogStore();

  // Storage and Hardware stores
  const fetchStorageInfo = useStorageStore((s) => s.fetchStorageInfo);
  const storageInfo = useStorageStore((s) => s.storageInfo);
  const fetchHardware = useHardwareStore((s) => s.fetchHardware);
  const hwInfo = useHardwareStore((s) => s.info);

  // Optimization history state
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistory[]>([]);

  useEffect(() => {
    // Auto-fetch data on mount
    void fetchProcesses();
    void fetchStorageInfo();
    void fetchHardware();
    // Auto-start pulse polling
    if (!isPolling) {
      startPolling();
    }

    // Load optimization history from localStorage
    const saved = localStorage.getItem('nexus:home:history');
    if (saved) {
      try {
        setOptimizationHistory(JSON.parse(saved));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [fetchProcesses, fetchStorageInfo, fetchHardware, isPolling, startPolling]);

  // Update optimization history when logs change
  useEffect(() => {
    const recentLogs = logs.slice(-5).reverse();
    const newHistory = recentLogs
      .filter((log) => log.message.includes('BOOST') || log.message.includes('OPTIMIZATION'))
      .map((log) => ({
        timestamp: new Date(log.timestamp).getTime(),
        action: log.message,
        result: log.level === 'Error' ? 'FAILED' : 'SUCCESS',
      }));

    if (newHistory.length > 0) {
      setOptimizationHistory((prev) => {
        const updated = [...prev, ...newHistory].slice(-10);
        localStorage.setItem('nexus:home:history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [logs]);

  const topProcesses = useMemo(() => getTopCpuProcesses(processes, 3), [processes]);

  const suggestions = useMemo(
    () => homePageSuggestions(latestSnapshot ?? null, storageInfo?.drives ?? [], hwInfo),
    [latestSnapshot, storageInfo, hwInfo],
  );

  const activeProcessCount = useMemo(
    () => processes.filter((p: SystemProcess) => p.cpuPercent > 1).length,
    [processes],
  );

  const gameScore = useMemo(
    () => calcScore(cpuPercent, memUsed, memTotal),
    [cpuPercent, memUsed, memTotal],
  );

  const highCpuProcesses = useMemo(
    () => processes.filter((p) => p.cpuPercent >= 80).slice(0, 3),
    [processes],
  );

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-5">
        <div className="font-[var(--font-mono)] text-xs font-bold text-[var(--color-accent-500)] tracking-[0.15em] mb-1">
          ▶ HOME / OVERVIEW
        </div>
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
          SYSTEM DASHBOARD
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* OPS Card */}
        <Card title="プロセス管理">
          <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
            <div className="mb-1">
              アクティブ:{' '}
              <span className="text-[var(--color-accent-500)]">{activeProcessCount}</span>
            </div>
            {topProcesses.length > 0 && (
              <div className="text-[10px] text-[var(--color-text-muted)]">
                CPU上位:
                {topProcesses.map((p: SystemProcess) => (
                  <div key={p.pid} className="ml-2">
                    {p.name} ({p.cpuPercent.toFixed(1)}%)
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* PULSE Card */}
        <Card title="システム監視">
          <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
            <div className="mb-1">
              CPU: <StatusBadge value={cpuPercent} unit="%" thresholds={{ warn: 50, danger: 80 }} />
            </div>
            <div>
              RAM:{' '}
              <span className="text-[var(--color-text-primary)]">
                {memUsed !== null && memTotal !== null
                  ? `${memUsed.toFixed(0)} / ${memTotal.toFixed(0)} MB`
                  : '--'}
              </span>
            </div>
          </div>
        </Card>

        {/* LAUNCHER Card */}
        <Card title="ゲーム起動">
          <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
            <div className="mb-1">
              ゲーム数: <span className="text-[var(--color-accent-500)]">{games.length}</span>
            </div>
            {games.length > 0 && (
              <div className="text-[10px] text-[var(--color-text-muted)]">
                Recent:{' '}
                {games
                  .slice(0, 4)
                  .map((g) => g.name)
                  .join(', ')}
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions Card */}
        <Card title="クイックアクション">
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => (isPolling ? null : startPolling())}
              disabled={isPolling}
              loading={isPolling}
            >
              {isPolling ? '■ 監視中' : '▶ 監視開始'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate?.('boost')}>
              ⚡ 今すぐ最適化
            </Button>
          </div>
        </Card>
      </div>

      {/* System Status Card */}
      <Card title="システムステータス" className="mt-4">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
          <div>
            CPU{'     '}
            <span className="text-[var(--color-accent-500)]">
              {cpuPercent !== null ? `${cpuPercent.toFixed(1)}%` : '--'}
            </span>
          </div>
          <div>
            MEM{'     '}
            <span className="text-[var(--color-accent-500)]">
              {memUsed !== null && memTotal !== null
                ? `${memUsed.toFixed(0)} / ${memTotal.toFixed(0)} MB (${(
                    (memUsed / memTotal) * 100
                  ).toFixed(0)}%)`
                : '--'}
            </span>
          </div>
          <div>
            DISK R{'  '}
            <span className="text-[var(--color-accent-500)]">
              {diskRead !== null ? `${diskRead.toFixed(0)} KB/s` : '--'}
            </span>
          </div>
          <div>
            DISK W{'  '}
            <span className="text-[var(--color-accent-500)]">
              {diskWrite !== null ? `${diskWrite.toFixed(0)} KB/s` : '--'}
            </span>
          </div>
        </div>
      </Card>

      {/* Storage Card */}
      <Card title="ストレージ" className="mt-4">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
          {storageInfo?.drives && storageInfo.drives.length > 0 ? (
            storageInfo.drives.map((drive) => (
              <div key={drive.name}>
                {drive.name}
                {'  '}
                <span className="text-[var(--color-accent-500)]">
                  {((drive.usedBytes / drive.sizeBytes) * 100).toFixed(0)}% (
                  {(drive.availableBytes / (1024 * 1024 * 1024)).toFixed(0)} GB 空き)
                </span>
              </div>
            ))
          ) : (
            <div>
              <span className="text-[var(--color-accent-500)]">読み込み中...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Hardware Card */}
      <Card title="ハードウェア" className="mt-4">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
          {hwInfo ? (
            <>
              <div>
                CPU{'     '}
                <span className="text-[var(--color-accent-500)]">{hwInfo.cpuName}</span>
              </div>
              {hwInfo.cpuTempC !== null && (
                <div>
                  TEMP{'    '}
                  <span className="text-[var(--color-accent-500)]">
                    {hwInfo.cpuTempC.toFixed(1)}°C
                  </span>
                </div>
              )}
              <div>
                GPU{'     '}
                <span
                  className={
                    hwInfo.gpuName
                      ? 'text-[var(--color-accent-500)]'
                      : 'text-[var(--color-text-muted)]'
                  }
                >
                  {hwInfo.gpuName ?? 'N/A'}
                </span>
              </div>
              <div>
                VRAM{'    '}
                <span
                  className={
                    hwInfo.gpuVramTotalMb != null
                      ? 'text-[var(--color-accent-500)]'
                      : 'text-[var(--color-text-muted)]'
                  }
                >
                  {hwInfo.gpuVramTotalMb != null ? `${hwInfo.gpuVramTotalMb} MB` : 'N/A'}
                </span>
              </div>
            </>
          ) : (
            <div>
              <span className="text-[var(--color-accent-500)]">読み込み中...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Network Speed Card */}
      <Card title="ネットワーク" className="mt-4">
        <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)] flex flex-col gap-1">
          <div>
            DOWN{'    '}
            <span className="text-[var(--color-accent-500)]">
              {netRecv !== null ? formatNetSpeed(netRecv) : '--'}
            </span>
          </div>
          <div>
            UP{'      '}
            <span className="text-[var(--color-accent-500)]">
              {netSent !== null ? formatNetSpeed(netSent) : '--'}
            </span>
          </div>
        </div>
      </Card>

      {/* Game Score */}
      <Card title="ゲームスコア" className="mt-4">
        <div className="font-[var(--font-mono)] text-2xl font-bold text-[var(--color-accent-500)] tracking-[0.05em]">
          {gameScore !== null ? `${gameScore} / 100` : '-- / 100'}
        </div>
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mt-1">
          {gameScore !== null && gameScore >= 80
            ? 'EXCELLENT'
            : gameScore !== null && gameScore >= 60
              ? 'GOOD'
              : gameScore !== null
                ? 'POOR'
                : '--'}
        </div>
      </Card>

      {/* Optimization History */}
      <Card title="最適化履歴" className="mt-4">
        {optimizationHistory.length > 0 ? (
          <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
            {optimizationHistory.map((item) => (
              <div
                key={`${item.timestamp}-${item.action}`}
                className="mb-1 flex justify-between items-center"
              >
                <span>● {item.action.split(' ').slice(0, 2).join(' ')}</span>
                <span
                  className={`text-[10px] ${item.result === 'SUCCESS' ? 'text-[var(--color-success-500)]' : 'text-[var(--color-danger-500)]'}`}
                >
                  {formatTime(item.timestamp)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] text-center py-5">
            NO HISTORY YET
          </div>
        )}
      </Card>

      {/* Alerts */}
      <Card title="アラート" className="mt-4">
        {highCpuProcesses.length > 0 ? (
          <div className="font-[var(--font-mono)] text-xs text-[var(--color-danger-500)]">
            {highCpuProcesses.map((process) => (
              <div key={process.pid} className="mb-1 flex justify-between items-center">
                <span>
                  ⚠ CPU HIGH ({process.cpuPercent.toFixed(1)}%) — {process.name}
                </span>
                <Button variant="secondary" size="sm" onClick={() => navigate?.('boost')}>
                  → BOOST
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-success-500)] text-center py-5">
            ● SYSTEM NOMINAL
          </div>
        )}
      </Card>
      <AiPanel suggestions={suggestions} />
    </div>
  );
}
