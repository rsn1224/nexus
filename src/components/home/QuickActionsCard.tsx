import type React from 'react';
import { useNavStore } from '../../stores/useNavStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { Button, Card } from '../ui';

export default function QuickActionsCard(): React.ReactElement {
  const navigate = useNavStore((s) => s.navigate);
  const subscribePulse = usePulseStore((s) => s.subscribe);
  const isListening = usePulseStore((s) => s.isListening);

  return (
    <Card title="クイックアクション">
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => (isListening ? null : subscribePulse())}
          disabled={isListening}
          loading={isListening}
        >
          {isListening ? '■ 監視中' : '▶ 監視開始'}
        </Button>
        <Button variant="primary" size="sm" onClick={() => navigate('performance')}>
          ⚡ 今すぐ最適化
        </Button>
      </div>
    </Card>
  );
}
