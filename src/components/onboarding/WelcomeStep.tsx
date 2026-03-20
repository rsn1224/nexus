import type React from 'react';
import { memo } from 'react';

interface Props {
  onNext: () => void;
  onSkip: () => void;
}

const WelcomeStep = memo(function WelcomeStep({ onNext, onSkip }: Props): React.ReactElement {
  return (
    <div className="wing-enter flex flex-col items-center text-center">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tighter text-accent-500 drop-shadow-[0_0_12px_rgba(68,214,44,0.5)]">
          NEXUS
        </h1>
        <span className="text-[10px] font-black tracking-[0.4em] text-accent-500/60">V2</span>
      </div>

      {/* Intro */}
      <h2 className="text-[14px] font-bold font-mono text-text-primary mb-3">
        SYSTEM INITIALIZATION
      </h2>
      <p className="text-[12px] font-mono text-text-secondary leading-relaxed max-w-sm mb-8">
        NEXUS はあなたのゲーミング PC を分析し、最適な設定を提案します。 セットアップは 30
        秒で完了します。
      </p>

      {/* CTA */}
      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 bg-accent-500 text-base-900 font-black text-[12px] tracking-widest uppercase rounded-sm hover:brightness-110 transition-all"
      >
        始める
      </button>

      {/* Skip */}
      <button
        type="button"
        onClick={onSkip}
        className="mt-4 text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors uppercase tracking-widest"
      >
        スキップ
      </button>
    </div>
  );
});

export default WelcomeStep;
