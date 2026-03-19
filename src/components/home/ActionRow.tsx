import { memo, useEffect } from 'react';
import { useOpsStore } from '../../stores/useOpsStore';
import BottleneckCard from './BottleneckCard';
import FrameTimeCard from './FrameTimeCard';
import QuickActionsCard from './QuickActionsCard';

const ActionRow = memo(function ActionRow() {
  const subscribe = useOpsStore((s) => s.subscribe);

  useEffect(() => {
    subscribe();
  }, [subscribe]);

  return (
    <div className="h-52 shrink-0 flex gap-2 px-3 py-2 border-b border-border-subtle overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <FrameTimeCard />
      </div>
      <div className="flex-1 overflow-hidden">
        <BottleneckCard />
      </div>
      <div className="w-44 shrink-0 overflow-hidden">
        <QuickActionsCard />
      </div>
    </div>
  );
});

export default ActionRow;
