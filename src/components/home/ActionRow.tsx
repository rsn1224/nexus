import { memo, useEffect } from 'react';
import { useOpsStore } from '../../stores/useOpsStore';
import BottleneckCard from './BottleneckCard';
import FrameTimeCard from './FrameTimeCard';
import QuickActionsCard from './QuickActionsCard';

const ActionRow = memo(function ActionRow() {
  const subscribe = useOpsStore((s) => s.subscribe);

  useEffect(() => {
    subscribe();
    return () => {
      useOpsStore.getState().unsubscribe();
    };
  }, [subscribe]);

  return (
    <div className="shrink-0 grid grid-cols-[1fr_1fr_160px] gap-2 px-3 py-2 border-b border-border-subtle">
      <div className="overflow-hidden">
        <FrameTimeCard />
      </div>
      <div className="overflow-hidden">
        <BottleneckCard />
      </div>
      <div className="overflow-hidden">
        <QuickActionsCard />
      </div>
    </div>
  );
});

export default ActionRow;
