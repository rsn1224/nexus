import type React from 'react';
import { useEffect, useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { Card } from '../ui';
import EmptyState from '../ui/EmptyState';
import SessionCompareView from './SessionCompareView';
import SessionDetailView from './SessionDetailView';
import SessionRow from './SessionRow';

type Tab = 'list' | 'detail' | 'compare';

const PerformanceTimelineCard: React.FC = () => {
  const {
    sessionList,
    selectedSession,
    isLoading,
    error,
    fetchSessions,
    getSession,
    deleteSession,
  } = useSessionStore();

  const [activeTab, setActiveTab] = useState<Tab>('list');

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSelect = (id: string) => {
    getSession(id);
    setActiveTab('detail');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'list', label: 'SESSIONS' },
    { id: 'detail', label: 'DETAIL' },
    { id: 'compare', label: 'COMPARE' },
  ];

  return (
    <Card title="PERFORMANCE TIMELINE" className="mt-4">
      <div className="flex gap-0 mb-3 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-label={`${tab.label}タブを表示`}
            className={`px-3 py-1 text-xs border-b-2 -mb-[2px] transition-colors ${
              activeTab === tab.id
                ? 'border-accent-500 text-accent-500'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-2 text-xs text-danger-500">ERROR: {error}</div>}

      {activeTab === 'list' && (
        <div>
          {isLoading && sessionList.length === 0 ? (
            <div className="flex items-center justify-center h-[60px] text-xs text-text-muted">
              LOADING...
            </div>
          ) : sessionList.length === 0 ? (
            <EmptyState
              message="NO SESSIONS RECORDED"
              action="START GAMING TO RECORD PERFORMANCE"
            />
          ) : (
            <ul className="flex flex-col max-h-[200px] overflow-y-auto list-none p-0 m-0">
              {sessionList.map((s) => (
                <li key={s.id}>
                  <SessionRow
                    session={s}
                    onSelect={handleSelect}
                    onDelete={(id) => deleteSession(id)}
                    isSelected={selectedSession?.id === s.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'detail' && <SessionDetailView />}
      {activeTab === 'compare' && <SessionCompareView sessions={sessionList} />}
    </Card>
  );
};

export default PerformanceTimelineCard;
