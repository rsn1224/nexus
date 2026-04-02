import type React from 'react';
import { memo } from 'react';
import { useOptimizeStore } from '../../stores/useOptimizeStore';
import { useUiStore } from '../../stores/useUiStore';
import SlidePanel from '../ui/SlidePanel';

const HistoryPanel = memo(function HistoryPanel(): React.ReactElement {
  const { isHistoryOpen, closeAll } = useUiStore();
  const history = useOptimizeStore((s) => s.history);

  return (
    <SlidePanel isOpen={isHistoryOpen} onClose={closeAll} title="History">
      {history.length === 0 ? (
        <span className="text-[11px] text-text-muted">履歴がありません</span>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((session) => (
            <div
              key={session.id}
              className="bg-base-800 border border-border-subtle rounded px-3 py-2 flex flex-col gap-1"
            >
              <span className="text-[10px] text-text-muted">
                {new Date(session.timestamp * 1000).toLocaleString('ja-JP')}
              </span>
              <span className="text-[11px] text-text-secondary font-semibold">
                {session.applied.length} 件適用
                {session.failed.length > 0 && (
                  <span className="text-danger-500 ml-2">{session.failed.length} 件失敗</span>
                )}
              </span>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {session.applied.map((item) => (
                  <span key={item.id} className="text-[10px] text-text-muted">
                    {item.id}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SlidePanel>
  );
});

export default HistoryPanel;
