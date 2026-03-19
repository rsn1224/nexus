import type React from 'react';
import { useNavStore } from '../../stores/useNavStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { Card } from '../ui';

export default function QuickActionsCard(): React.ReactElement {
  const navigateTo = useNavStore((s) => s.navigateTo);
  const subscribePulse = usePulseStore((s) => s.subscribe);
  const isListening = usePulseStore((s) => s.isListening);

  return (
    <Card title="QUICK ACTIONS" accentColor="accent">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => (isListening ? null : subscribePulse())}
          disabled={isListening}
          aria-label={isListening ? 'リソース監視中' : 'リソース監視を開始'}
          className={`w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98] border flex items-center justify-center gap-2 ${
            isListening
              ? 'bg-success-500/10 border-success-500/30 text-success-400 cursor-default'
              : 'bg-accent-500 border-accent-500 text-base-900 hover:bg-accent-400 hover:shadow-md hover:shadow-accent-500/30'
          }`}
        >
          {isListening ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
              Monitoring
            </>
          ) : (
            <>▶ Start Monitor</>
          )}
        </button>
        <button
          type="button"
          onClick={() => navigateTo('performance', { tab: 'process' })}
          aria-label="今すぐ最適化"
          className="w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98] border bg-warm-500/10 border-warm-500/30 text-warm-400 hover:bg-warm-500/20 hover:border-warm-500/50 flex items-center justify-center gap-2"
        >
          <span>⚡</span>
          Optimize Now
        </button>
      </div>
    </Card>
  );
}
