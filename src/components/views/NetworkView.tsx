import { Network, RefreshCw } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect } from 'react';
import { commands } from '../../lib/tauri-commands';
import { useNetworkStore } from '../../stores/useNetworkStore';
import Button from '../ui/Button';
import ErrorBanner from '../ui/ErrorBanner';
import SectionLabel from '../ui/SectionLabel';
import { Toggle } from '../ui/Toggle';

function SettingRow({
  label,
  description,
  enabled,
  onToggle,
  loading,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  loading: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-text-primary">{label}</span>
        <span className="text-[10px] text-text-muted">{description}</span>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} disabled={loading} />
    </div>
  );
}

const NetworkView = memo(function NetworkView(): React.ReactElement {
  const {
    tuningState,
    isLoading,
    error,
    fetchTuningState,
    applyPreset,
    resetDefaults,
    clearError,
  } = useNetworkStore();

  useEffect(() => {
    void fetchTuningState();
  }, [fetchTuningState]);

  const handleToggleNagle = useCallback(async () => {
    if (!tuningState) return;
    await commands.setNagleDisabled(!tuningState.nagleDisabled);
    void fetchTuningState();
  }, [tuningState, fetchTuningState]);

  const handleToggleDelayedAck = useCallback(async () => {
    if (!tuningState) return;
    await commands.setDelayedAckDisabled(!tuningState.delayedAckDisabled);
    void fetchTuningState();
  }, [tuningState, fetchTuningState]);

  const handleToggleThrottling = useCallback(async () => {
    if (!tuningState) return;
    await commands.setNetworkThrottling(tuningState.networkThrottlingIndex === 0 ? -1 : 0);
    void fetchTuningState();
  }, [tuningState, fetchTuningState]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-accent-500" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary leading-none">
            Network Optimization
          </h2>
        </div>
        <Button variant="ghost" onClick={() => void fetchTuningState()} loading={isLoading}>
          <RefreshCw size={12} />
          <span className="ml-1">更新</span>
        </Button>
      </div>

      {error && <ErrorBanner message={error} variant="error" onDismiss={clearError} />}

      {isLoading && !tuningState ? (
        <span className="text-[11px] text-text-muted">読み込み中...</span>
      ) : tuningState ? (
        <div className="grid grid-cols-2 gap-4">
          {/* 左列: TCP トグル */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-1">
            <SectionLabel label="TCP チューニング" />
            <SettingRow
              label="Nagle アルゴリズム 無効化"
              description="小パケットを即時送信。ゲームの遅延を削減"
              enabled={tuningState.nagleDisabled}
              onToggle={() => void handleToggleNagle()}
              loading={isLoading}
            />
            <SettingRow
              label="Delayed ACK 無効化"
              description="ACK 応答を即時送信。レイテンシを改善"
              enabled={tuningState.delayedAckDisabled}
              onToggle={() => void handleToggleDelayedAck()}
              loading={isLoading}
            />
            <SettingRow
              label="Network Throttling 無効化"
              description="マルチメディア向けスロットリングを解除"
              enabled={tuningState.networkThrottlingIndex === 0}
              onToggle={() => void handleToggleThrottling()}
              loading={isLoading}
            />
          </div>

          {/* 右列: プリセット + 現在の設定 */}
          <div className="flex flex-col gap-3">
            <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-2">
              <SectionLabel label="プリセット" />
              <Button variant="primary" onClick={() => void applyPreset()} loading={isLoading}>
                ゲーミングプリセット適用
              </Button>
              <Button variant="ghost" onClick={() => void resetDefaults()} loading={isLoading}>
                デフォルトに戻す
              </Button>
            </div>
            <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-1.5">
              <SectionLabel label="現在の設定" />
              <div className="flex items-center justify-between py-1">
                <span className="text-[10px] text-text-muted">TCP Auto-Tuning</span>
                <span className="text-[11px] font-mono text-text-primary">
                  {tuningState.tcpAutoTuning}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-border-subtle">
                <span className="text-[10px] text-text-muted">QoS 帯域予約</span>
                <span className="text-[11px] font-mono text-text-primary">
                  {tuningState.qosReservedBandwidthPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default NetworkView;
