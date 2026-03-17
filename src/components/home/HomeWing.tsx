import type React from 'react';
import { useEffect, useState } from 'react';
import { useEventSubscription } from '../../hooks/useInitialData';
import { homePageSuggestions } from '../../lib/localAi';
import { useHardwareData } from '../../stores/useHardwareStore';
import { useLogStore } from '../../stores/useLogStore';
import { useNavStore } from '../../stores/useNavStore';
import { useOpsStore } from '../../stores/useOpsStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { useStorageStore } from '../../stores/useStorageStore';
import type { SystemProcess } from '../../types';
import AiPanel from '../shared/AiPanel';
import { Button, Card } from '../ui';
import GameScoreCard from './GameScoreCard';
import LauncherCard from './LauncherCard';
import OpsCard from './OpsCard';
import PulseCard from './PulseCard';
import QuickActionsCard from './QuickActionsCard';
import SystemStatusCard from './SystemStatusCard';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OptimizationHistory {
  timestamp: number;
  action: string;
  result: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

// ─── HomeWing ────────────────────────────────────────────────────────────────

const HomeWing = function HomeWing(): React.ReactElement {
  // Store data - using existing store methods
  const subscribeOps = useOpsStore((s) => s.subscribe);
  const subscribePulse = usePulseStore((s) => s.subscribe);
  const processes = useOpsStore((s) => s.processes);
  const navigate = useNavStore((s) => s.navigate);
  const { logs } = useLogStore();

  // Storage and Hardware stores
  const storageInfo = useStorageStore((s) => s.storageInfo);
  const { info: hwInfo } = useHardwareData();

  // Optimization history state
  const [optimizationHistory, setOptimizationHistory] = useState<OptimizationHistory[]>([]);

  // イベントリスナー登録と初期データ読み込み
  useEventSubscription(() => {
    // イベントリスナーを登録（BE からのプッシュを受信）
    subscribePulse();
    subscribeOps();

    // Load optimization history from localStorage
    const saved = localStorage.getItem('nexus:home:history');
    if (saved) {
      try {
        setOptimizationHistory(JSON.parse(saved));
      } catch {
        // Ignore invalid JSON
      }
    }

    // クリーンアップ関数（不要だが型合わせ）
    return undefined;
  }, [subscribePulse, subscribeOps]);

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

  const highCpuProcesses = processes.filter((p: SystemProcess) => p.cpuPercent >= 80).slice(0, 3);

  const suggestions = homePageSuggestions(null, storageInfo?.drives ?? [], hwInfo);

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
        <OpsCard />

        {/* PULSE Card */}
        <PulseCard />

        {/* LAUNCHER Card */}
        <LauncherCard />

        {/* Quick Actions Card */}
        <QuickActionsCard />
      </div>

      {/* System Status Card */}
      <SystemStatusCard />

      {/* Game Score Card */}
      <GameScoreCard />

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
            <div className="text-[var(--color-text-muted)]">情報がありません</div>
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
            <div className="text-[var(--color-text-muted)]">情報がありません</div>
          )}
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
            {highCpuProcesses.map((process: SystemProcess) => (
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

      {/* AI Suggestions */}
      <AiPanel suggestions={suggestions} />
    </div>
  );
};

export default HomeWing;
