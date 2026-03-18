import type React from 'react';
import { useState } from 'react';
import { useNetworkTuningActions, useNetworkTuningState } from '../../stores/useNetworkTuningStore';
import { Button, Card } from '../ui';

const PRESET_TARGETS = [
  { label: 'Google DNS', value: '8.8.8.8' },
  { label: 'Cloudflare', value: '1.1.1.1' },
  { label: 'Quad9', value: '9.9.9.9' },
];

const DEFAULT_COUNT = 10;

function QualityBadge({
  value,
  unit,
  label,
  warn,
  danger,
}: {
  value: number;
  unit: string;
  label: string;
  warn: number;
  danger: number;
}): React.ReactElement {
  const color =
    value >= danger ? 'text-red-400' : value >= warn ? 'text-yellow-400' : 'text-cyan-500';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`font-mono text-[16px] font-bold tabular-nums ${color}`}>
        {value.toFixed(1)}
        <span className="text-[10px] font-normal text-text-muted">{unit}</span>
      </span>
      <span className="font-mono text-[9px] text-text-muted tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}

export default function NetworkQualityCard(): React.ReactElement {
  const { qualitySnapshot, isMeasuring, error } = useNetworkTuningState();
  const { measureNetworkQuality } = useNetworkTuningActions();

  const [target, setTarget] = useState(PRESET_TARGETS[0]?.value ?? '8.8.8.8');
  const [customTarget, setCustomTarget] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const effectiveTarget = useCustom ? customTarget.trim() : target;

  const handleMeasure = () => {
    if (!effectiveTarget) return;
    void measureNetworkQuality(effectiveTarget, DEFAULT_COUNT);
  };

  return (
    <Card title="ネットワーク品質測定">
      <div className="flex flex-col gap-3">
        {/* ターゲット選択 */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={useCustom ? '__custom__' : target}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setUseCustom(true);
              } else {
                setUseCustom(false);
                setTarget(e.target.value);
              }
            }}
            disabled={isMeasuring}
            className="bg-base-900 border border-border-subtle font-mono text-[10px] text-text-primary px-2 py-1 outline-none focus:border-cyan-500"
            aria-label="Ping ターゲット"
          >
            {PRESET_TARGETS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} ({t.value})
              </option>
            ))}
            <option value="__custom__">カスタム...</option>
          </select>

          {useCustom && (
            <input
              type="text"
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
              placeholder="IP アドレス / ドメイン"
              disabled={isMeasuring}
              className="flex-1 bg-base-900 border border-border-subtle font-mono text-[10px] text-text-primary px-2 py-1 outline-none focus:border-cyan-500"
              aria-label="カスタム Ping ターゲット"
            />
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleMeasure}
            disabled={isMeasuring || !effectiveTarget}
            loading={isMeasuring}
          >
            {isMeasuring ? `PINGING (${DEFAULT_COUNT}回)...` : '▶ 測定'}
          </Button>
        </div>

        {/* 結果表示 */}
        {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}

        {qualitySnapshot && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-around py-2 bg-base-900 border border-border-subtle rounded">
              <QualityBadge
                value={qualitySnapshot.avgLatencyMs}
                unit="ms"
                label="LATENCY"
                warn={50}
                danger={100}
              />
              <QualityBadge
                value={qualitySnapshot.jitterMs}
                unit="ms"
                label="JITTER"
                warn={10}
                danger={30}
              />
              <QualityBadge
                value={qualitySnapshot.packetLossPct}
                unit="%"
                label="LOSS"
                warn={1}
                danger={5}
              />
            </div>
            <div className="flex justify-between font-mono text-[9px] text-text-muted">
              <span>TARGET: {qualitySnapshot.target}</span>
              <span>SAMPLES: {qualitySnapshot.sampleCount}</span>
            </div>
          </div>
        )}

        {!qualitySnapshot && !isMeasuring && (
          <p className="font-mono text-[10px] text-text-muted text-center py-2">
            ▶ 測定 を押して Jitter / パケットロスを計測
          </p>
        )}
      </div>
    </Card>
  );
}
