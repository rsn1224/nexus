import type React from 'react';
import { memo } from 'react';

interface Props {
  onComplete: () => void;
}

const CompleteStep = memo(function CompleteStep({ onComplete }: Props): React.ReactElement {
  return (
    <div className="wing-enter flex flex-col items-center text-center">
      {/* Success Icon */}
      <div className="w-16 h-16 rounded-full bg-accent-500/20 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[32px] text-accent-500" aria-hidden="true">
          check_circle
        </span>
      </div>

      <h2 className="text-[14px] font-bold font-mono text-text-primary mb-3">
        INITIALIZATION COMPLETE
      </h2>

      <p className="text-[12px] font-mono text-text-secondary leading-relaxed max-w-sm mb-8">
        セットアップが完了しました。NEXUS がシステムの最適化を支援します。
      </p>

      <button
        type="button"
        onClick={onComplete}
        className="w-full py-3 bg-accent-500 text-base-900 font-black text-[12px] tracking-widest uppercase rounded-sm hover:brightness-110 transition-all"
      >
        ダッシュボードへ
      </button>
    </div>
  );
});

export default CompleteStep;
