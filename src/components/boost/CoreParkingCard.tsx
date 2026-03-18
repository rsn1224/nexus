import type React from 'react';
import { useEffect } from 'react';
import { useGameProfileActions, useGameProfileState } from '../../stores/useGameProfileStore';
import { Button, Card } from '../ui';

export default function CoreParkingCard(): React.ReactElement {
  const { coreParkingState, isApplying } = useGameProfileState();
  const { fetchCoreParking, applyCoreParking } = useGameProfileActions();

  useEffect(() => {
    void fetchCoreParking();
  }, [fetchCoreParking]);

  const acPercent = coreParkingState?.minCoresPercentAc ?? null;
  const isParkingDisabled = acPercent === 100;

  const handleEnable = () => void applyCoreParking(0);
  const handleDisable = () => void applyCoreParking(100);

  return (
    <Card title="CORE PARKING">
      <div className="flex flex-col gap-3 p-3">
        <div className="font-mono text-[10px] text-text-secondary leading-[1.4]">
          コアパーキングを無効化すると、すべての CPU コアが常時稼働状態になります。
          ゲーム中の突発的な負荷スパイクに対する応答性が向上しますが、アイドル時の消費電力が増加します。
        </div>

        {coreParkingState === null ? (
          <div className="font-mono text-[10px] text-text-muted">読み込み中...</div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-text-muted">AC 電源時の最小コア率</span>
              <span className="font-mono text-[11px] text-text-primary">{acPercent}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-text-muted">現在の状態</span>
              <span
                className={`font-mono text-[11px] font-semibold ${isParkingDisabled ? 'text-accent-500' : 'text-text-muted'}`}
              >
                {isParkingDisabled ? '● 無効（全コア稼働）' : '○ 有効（パーキング中）'}
              </span>
            </div>
            <div className="flex gap-2 mt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={handleDisable}
                disabled={isParkingDisabled || isApplying}
                loading={isApplying}
              >
                {isApplying ? 'APPLYING...' : 'パーキング無効化'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEnable}
                disabled={!isParkingDisabled || isApplying}
                loading={isApplying}
              >
                {isApplying ? 'APPLYING...' : '↩ 元に戻す'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
