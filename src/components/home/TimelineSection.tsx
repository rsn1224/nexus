import { memo, useMemo } from 'react';
import { homePageSuggestions } from '../../lib/localAi';
import { useHardwareData } from '../../stores/useHardwareStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { useStorageStore } from '../../stores/useStorageStore';
import AiPanel from '../shared/AiPanel';
import OpsCard from './OpsCard';
import PerformanceTimelineCard from './PerformanceTimelineCard';

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
    <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
      <PerformanceTimelineCard />
      <OpsCard />
      <AiPanel suggestions={suggestions} />
    </div>
  );
});

export default TimelineSection;
