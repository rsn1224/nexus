import type React from 'react';
import { memo, useEffect, useState } from 'react';
import { formatTimestamp } from '../lib/formatters';
import { useOptimizeStore } from '../stores/useOptimizeStore';
import SlidePanel from './ui/SlidePanel';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistoryPanel = memo(function HistoryPanel({
  isOpen,
  onClose,
}: HistoryPanelProps): React.ReactElement {
  const { history, fetchHistory } = useOptimizeStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) void fetchHistory();
  }, [isOpen, fetchHistory]);

  return (
    <SlidePanel isOpen={isOpen} onClose={onClose} title="HISTORY">
      {history.length === 0 ? (
        <span className="text-[11px] text-text-muted">セッション履歴なし</span>
      ) : (
        <div className="flex flex-col gap-2">
          {[...history]
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((session) => {
              const isExpanded = expandedId === session.id;
              return (
                <div key={session.id} className="bg-base-800 border border-border-subtle rounded">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-3 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-text-primary">
                        {formatTimestamp(session.timestamp)}
                      </span>
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-success-500">+{session.applied.length}</span>
                        {session.failed.length > 0 && (
                          <span className="text-danger-500">✗{session.failed.length}</span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[14px] text-text-muted">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 flex flex-col gap-1 border-t border-border-subtle pt-2">
                      {session.applied.map((item) => (
                        <div key={item.id} className="flex gap-2 text-[11px]">
                          <span className="text-success-500 shrink-0">✓</span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-text-secondary truncate">{item.id}</span>
                            <span className="text-text-muted truncate">
                              {item.before} → {item.after}
                            </span>
                          </div>
                        </div>
                      ))}
                      {session.failed.map((item) => (
                        <div key={item.id} className="flex gap-2 text-[11px]">
                          <span className="text-danger-500 shrink-0">✗</span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-text-secondary truncate">{item.id}</span>
                            <span className="text-text-muted truncate">{item.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </SlidePanel>
  );
});

export default HistoryPanel;
