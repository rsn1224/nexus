import type React from 'react';
import { useEffect } from 'react';
import { useNetworkTuningActions, useNetworkTuningState } from '../../stores/useNetworkTuningStore';
import type { TcpAutoTuningLevel } from '../../types';
import { Button, Card } from '../ui';

const AUTO_TUNING_LABELS: Record<TcpAutoTuningLevel, string> = {
  normal: 'NORMAL（推奨）',
  disabled: 'DISABLED',
  highlyRestricted: 'HIGHLY RESTRICTED',
  restricted: 'RESTRICTED',
  experimental: 'EXPERIMENTAL',
};

interface ToggleRowProps {
  label: string;
  description: string;
  active: boolean;
  disabled: boolean;
  onEnable: () => void;
  onDisable: () => void;
}

function ToggleRow({
  label,
  description,
  active,
  disabled,
  onEnable,
  onDisable,
}: ToggleRowProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border-subtle last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={active ? 'text-accent-500' : 'text-text-muted'}>
            {active ? '●' : '○'}
          </span>
          <span className="text-[11px] font-semibold text-text-primary">{label}</span>
        </div>
        <p className="text-[9px] text-text-muted mt-0.5 ml-4">{description}</p>
      </div>
      <div className="shrink-0">
        {active ? (
          <Button variant="ghost" size="sm" onClick={onDisable} disabled={disabled}>
            ↩ 元に戻す
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={onEnable} disabled={disabled}>
            ▶ 適用
          </Button>
        )}
      </div>
    </div>
  );
}

export default function TcpTuningCard(): React.ReactElement {
  const { tcpState, isLoading, isApplying, error } = useNetworkTuningState();
  const {
    fetchTcpState,
    setNagleDisabled,
    setDelayedAckDisabled,
    setNetworkThrottling,
    setQosReservedBandwidth,
    setTcpAutoTuning,
    applyGamingPreset,
    resetDefaults,
  } = useNetworkTuningActions();

  useEffect(() => {
    void fetchTcpState();
  }, [fetchTcpState]);

  const presetAction = (
    <div className="flex gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => void applyGamingPreset()}
        disabled={isApplying || isLoading}
        loading={isApplying}
      >
        {isApplying ? 'APPLYING...' : '▶ ゲーミングプリセット'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void resetDefaults()}
        disabled={isApplying || isLoading}
      >
        ↩ リセット
      </Button>
    </div>
  );

  return (
    <Card title="TCP チューニング" action={presetAction}>
      {error && <p className="text-[10px] text-danger-400 px-2 pt-2">{error}</p>}
      {isLoading || tcpState === null ? (
        <p className="text-[10px] text-text-muted p-2">読み込み中...</p>
      ) : (
        <div className="flex flex-col">
          <ToggleRow
            label="NAGLE アルゴリズム無効化"
            description="小パケットを即時送信 — ゲーム入力遅延を低減"
            active={tcpState.nagleDisabled}
            disabled={isApplying}
            onEnable={() => void setNagleDisabled(true)}
            onDisable={() => void setNagleDisabled(false)}
          />
          <ToggleRow
            label="DELAYED ACK 無効化"
            description="ACK を即時送信 — ラウンドトリップタイムを短縮"
            active={tcpState.delayedAckDisabled}
            disabled={isApplying}
            onEnable={() => void setDelayedAckDisabled(true)}
            onDisable={() => void setDelayedAckDisabled(false)}
          />
          <ToggleRow
            label="NETWORK THROTTLING 無制限"
            description={`現在: ${tcpState.networkThrottlingIndex === -1 ? '無制限' : `${tcpState.networkThrottlingIndex}`} — -1 でマルチメディアスロットリング解除`}
            active={tcpState.networkThrottlingIndex === -1}
            disabled={isApplying}
            onEnable={() => void setNetworkThrottling(-1)}
            onDisable={() => void setNetworkThrottling(10)}
          />
          <ToggleRow
            label="QOS 予約帯域幅 0%"
            description={`現在: ${tcpState.qosReservedBandwidthPct}% — デフォルト 20% の帯域予約を解放`}
            active={tcpState.qosReservedBandwidthPct === 0}
            disabled={isApplying}
            onEnable={() => void setQosReservedBandwidth(0)}
            onDisable={() => void setQosReservedBandwidth(20)}
          />
          <div className="flex items-start justify-between gap-3 py-2">
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-text-primary">TCP AUTO-TUNING</span>
              <p className="text-[9px] text-text-muted mt-0.5">受信バッファの自動調整レベル</p>
            </div>
            <select
              value={tcpState.tcpAutoTuning}
              onChange={(e) => void setTcpAutoTuning(e.target.value as TcpAutoTuningLevel)}
              disabled={isApplying}
              className="bg-base-900 border border-border-subtle font-mono text-[10px] text-text-primary px-2 py-1 outline-none focus:border-accent-500"
              aria-label="TCP Auto-Tuning レベル"
            >
              {(Object.entries(AUTO_TUNING_LABELS) as [TcpAutoTuningLevel, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      )}
    </Card>
  );
}
