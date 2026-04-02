import { Layers, RefreshCw } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect } from 'react';
import { useMemoryStore } from '../../stores/useMemoryStore';
import Button from '../ui/Button';
import ErrorBanner from '../ui/ErrorBanner';
import SectionLabel from '../ui/SectionLabel';
import { Toggle } from '../ui/Toggle';

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const MemoryView = memo(function MemoryView(): React.ReactElement {
  const {
    config,
    lastResult,
    isLoading,
    isCleaning,
    error,
    fetchConfig,
    updateConfig,
    runCleanup,
    clearError,
  } = useMemoryStore();

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const handleToggleAuto = useCallback(() => {
    if (!config) return;
    void updateConfig({ ...config, enabled: !config.enabled });
  }, [config, updateConfig]);

  const handleIntervalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!config) return;
      const v = Number(e.target.value);
      if (!Number.isNaN(v) && v >= 30) void updateConfig({ ...config, intervalSeconds: v });
    },
    [config, updateConfig],
  );

  const handleThresholdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!config) return;
      const v = Number(e.target.value);
      if (!Number.isNaN(v) && v >= 128) void updateConfig({ ...config, thresholdMb: v });
    },
    [config, updateConfig],
  );

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-500" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary leading-none">
            Memory Management
          </h2>
        </div>
        <Button variant="ghost" onClick={() => void fetchConfig()} loading={isLoading}>
          <RefreshCw size={12} />
          <span className="ml-1">更新</span>
        </Button>
      </div>

      {error && <ErrorBanner message={error} variant="error" onDismiss={clearError} />}

      {isLoading && !config ? (
        <span className="text-[11px] text-text-muted">読み込み中...</span>
      ) : (
        <div className="flex flex-col gap-4">
          {/* 手動クリーンアップ */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-3">
            <SectionLabel label="手動クリーンアップ" />
            <Button variant="primary" onClick={() => void runCleanup()} loading={isCleaning}>
              今すぐクリーンアップ
            </Button>
            {lastResult && (
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted">最終実行</span>
                  <span className="text-[11px] text-text-primary font-mono">
                    {formatTimestamp(lastResult.timestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted">解放量</span>
                  <span
                    className={`text-[11px] font-mono ${lastResult.success ? 'text-success-500' : 'text-danger-500'}`}
                  >
                    {lastResult.success && lastResult.freedMb !== null
                      ? `${lastResult.freedMb} MB`
                      : (lastResult.error ?? '失敗')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 自動クリーンアップ */}
          {config && (
            <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <SectionLabel label="自動クリーンアップ" />
                <Toggle enabled={config.enabled} onToggle={handleToggleAuto} disabled={isLoading} />
              </div>
              <div
                className={`flex flex-col gap-2 ${config.enabled ? '' : 'opacity-40 pointer-events-none'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-primary">実行間隔</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={30}
                      value={config.intervalSeconds}
                      onChange={handleIntervalChange}
                      className="w-16 bg-base-700 border border-border-subtle rounded px-2 py-1 text-[11px] text-text-primary font-mono text-right"
                    />
                    <span className="text-[10px] text-text-muted">秒</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-primary">実行閾値</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={128}
                      value={config.thresholdMb}
                      onChange={handleThresholdChange}
                      className="w-16 bg-base-700 border border-border-subtle rounded px-2 py-1 text-[11px] text-text-primary font-mono text-right"
                    />
                    <span className="text-[10px] text-text-muted">MB</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default MemoryView;
