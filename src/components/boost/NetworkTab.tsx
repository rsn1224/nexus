import React from 'react';
import { useWinoptStore } from '../../stores/useWinoptStore';
import { Button, LoadingState } from '../ui';

interface NetworkTabProps {
  className?: string;
}

export default function NetworkTab({ className = '' }: NetworkTabProps): React.ReactElement {
  const {
    netSettings,
    isLoading,
    activeId,
    flushDnsResult,
    fetchNetSettings,
    applyNet,
    revertNet,
    flushDns,
  } = useWinoptStore();

  React.useEffect(() => {
    void fetchNetSettings();
  }, [fetchNetSettings]);

  return (
    <div className={className}>
      {/* DNS Cache Flush Button */}
      <div className="mb-4 p-3 bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded">
        <Button
          variant="primary"
          size="sm"
          onClick={() => void flushDns()}
          disabled={activeId === 'flush_dns'}
          loading={activeId === 'flush_dns'}
          className="mb-2"
        >
          {activeId === 'flush_dns' ? 'RUNNING...' : '▶ DNSキャッシュをクリア'}
        </Button>
        {flushDnsResult && (
          <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)]">
            最後の実行結果: {flushDnsResult}
          </div>
        )}
      </div>

      {/* Network Settings */}
      {isLoading ? (
        <LoadingState message="読み込み中..." />
      ) : (
        <div className="flex flex-col gap-3">
          {netSettings.map((setting) => (
            <div
              key={setting.id}
              className="p-3 bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={
                      setting.isOptimized
                        ? 'text-[var(--color-cyan-500)]'
                        : 'text-[var(--color-text-muted)]'
                    }
                  >
                    {setting.isOptimized ? '●' : '○'}
                  </span>
                  <div className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-primary)]">
                    {setting.label}
                  </div>
                </div>
                <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)] leading-[1.4]">
                  {setting.description}
                </div>
              </div>
              <div className="ml-3">
                {setting.isOptimized && setting.canRevert ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void revertNet(setting.id)}
                    disabled={activeId === setting.id}
                    loading={activeId === setting.id}
                  >
                    {activeId === setting.id ? 'RUNNING...' : '↩ 元に戻す'}
                  </Button>
                ) : setting.isOptimized ? (
                  <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] px-2 py-1">
                    -
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void applyNet(setting.id)}
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
    </div>
  );
}
