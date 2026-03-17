import type React from 'react';
import { useMemo } from 'react';
import { calcScore, getScoreRank } from '../../lib/score';
import { useHardwareData } from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { Card, StatusBadge } from '../ui';

export default function GameScoreCard(): React.ReactElement {
  const latestSnapshot = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );

  const cpuPercent = latestSnapshot?.cpuPercent ?? null;
  const memUsed = latestSnapshot?.memUsedMb ?? null;
  const memTotal = latestSnapshot?.memTotalMb ?? null;

  const { info: hwInfo, diskUsagePercent } = useHardwareData();
  const gpuUsage = hwInfo?.gpuUsagePercent ?? null;

  const gameScore = useMemo(
    () =>
      calcScore({
        cpuPercent,
        memUsedGb: memUsed,
        memTotalGb: memTotal,
        diskUsagePercent,
        gpuUsagePercent: gpuUsage,
      }),
    [cpuPercent, memUsed, memTotal, diskUsagePercent, gpuUsage],
  );

  const scoreRank = useMemo(() => getScoreRank(gameScore ?? 0), [gameScore]);

  return (
    <Card title="ゲームスコア" className="mt-4">
      <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span>総合評価</span>
            <span
              className={`font-bold text-[${scoreRank.color.replace('text-', 'var(--color-')}]`}
            >
              {scoreRank.label}
            </span>
          </div>
          <div className="w-full bg-[var(--color-base-700)] rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${gameScore ?? 0}%`,
                backgroundColor: scoreRank.color
                  .replace('text-', 'var(--color-')
                  .replace('-500', '-500)'),
              }}
            />
          </div>
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)]">
          <div className="flex justify-between">
            <span>CPU</span>
            <StatusBadge value={cpuPercent} unit="%" thresholds={{ warn: 50, danger: 80 }} />
          </div>
          <div className="flex justify-between">
            <span>GPU</span>
            <StatusBadge value={gpuUsage} unit="%" thresholds={{ warn: 70, danger: 90 }} />
          </div>
          <div className="flex justify-between">
            <span>RAM</span>
            <span className="text-[var(--color-text-primary)]">
              {memUsed !== null && memTotal !== null
                ? `${((memUsed / memTotal) * 100).toFixed(0)}%`
                : '--'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
