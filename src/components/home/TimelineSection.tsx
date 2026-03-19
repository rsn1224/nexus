import { memo, useMemo } from 'react';
import { homePageSuggestions } from '../../lib/localAi';
import { useHardwareData } from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { useStorageStore } from '../../stores/useStorageStore';
import AiPanel from '../shared/AiPanel';
import OpsCard from './OpsCard';
import PerformanceTimelineCard from './PerformanceTimelineCard';
import RecentGamesCard from './RecentGamesCard';

const TimelineSection = memo(function TimelineSection() {
  const snap = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );
  const storageInfo = useStorageStore((s) => s.storageInfo);
  const { info: hwInfo } = useHardwareData();

  const suggestions = useMemo(
    () => homePageSuggestions(snap, storageInfo?.drives ?? [], hwInfo),
    [snap, storageInfo, hwInfo],
  );

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
      {/* 上段: AI提案を最上部・横幅フル → 最も目立つ位置に */}
      <AiPanel suggestions={suggestions} />

      {/* 中段: タイムライン(大) + 右カラム(OpsCard + RecentGames 縦積み) */}
      <div className="flex-1 grid grid-cols-[1fr_260px] gap-2 min-h-0">
        <PerformanceTimelineCard />
        <div className="flex flex-col gap-2 overflow-hidden">
          <OpsCard />
          <RecentGamesCard />
        </div>
      </div>
    </div>
  );
});

export default TimelineSection;
