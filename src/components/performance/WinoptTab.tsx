import React from 'react';
import { useWinoptStore } from '../../stores/useWinoptStore';
import { Button, LoadingState } from '../ui';
import CoreParkingCard from './CoreParkingCard';
import TimerSection from './TimerSection';

interface WinoptTabProps {
  className?: string;
}

export default function WinoptTab({ className = '' }: WinoptTabProps): React.ReactElement {
  const { winSettings, isLoading, activeId, fetchWinSettings, applyWin, revertWin } =
    useWinoptStore();

  React.useEffect(() => {
    void fetchWinSettings();
  }, [fetchWinSettings]);

  return (
    <div className={className}>
      {isLoading ? (
        <LoadingState message="読み込み中..." />
      ) : (
        <div className="flex flex-col gap-3">
          {winSettings.map((setting) => (
            <div
              key={setting.id}
              className="p-3 bg-base-800 border border-border-subtle rounded flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={setting.isOptimized ? 'text-accent-500' : 'text-text-muted'}>
                    {setting.isOptimized ? '●' : '○'}
                  </span>
                  <div className="font-mono text-[11px] font-semibold text-text-primary">
                    {setting.label}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-text-secondary leading-[1.4]">
                  {setting.description}
                </div>
              </div>
              <div className="ml-3">
                {setting.isOptimized && setting.canRevert ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void revertWin(setting.id)}
                    disabled={activeId === setting.id}
                    loading={activeId === setting.id}
                  >
                    {activeId === setting.id ? 'RUNNING...' : '↩ 元に戻す'}
                  </Button>
                ) : setting.isOptimized ? (
                  <span className="font-mono text-[9px] text-text-muted px-2 py-1">-</span>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void applyWin(setting.id)}
                    disabled={activeId === setting.id}
                    loading={activeId === setting.id}
                  >
                    {activeId === setting.id ? 'RUNNING...' : '▶ 適用'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <TimerSection />
      <CoreParkingCard />
    </div>
  );
}
