import type React from 'react';

interface TacticalAiInsightProps {
  insight: {
    title: string;
    content: string;
    type: 'critical' | 'warning' | 'info';
  };
}

export default function TacticalAiInsight({ insight }: TacticalAiInsightProps): React.ReactElement {
  const getColorClasses = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-warning-500/10 bg-warning-500/3 text-warning-500';
      case 'warning':
        return 'border-accent-500/10 bg-accent-500/3 text-accent-500';
      default:
        return 'border-text-secondary/10 bg-text-secondary/3 text-text-secondary';
    }
  };

  return (
    <div className="glass-panel border-l-4 border-l-warning-500 p-6 relative overflow-hidden">
      <div className="reflective-overlay absolute inset-0"></div>
      <div className="flex items-center gap-4 mb-10 relative z-10">
        <span className="material-symbols-outlined text-warning-500 filled-icon">psychology</span>
        <h3 className="font-black text-[10px] tracking-[0.3em] text-warning-500 uppercase">
          STITCH {/* */} {/* TACTICAL AI */}
        </h3>
      </div>
      <div className="space-y-10 relative z-10">
        <div className={`p-5 border relative ${getColorClasses(insight.type)}`}>
          <p className="text-text-primary/80 text-[11px] leading-relaxed font-light">
            <span
              className={`font-black uppercase tracking-widest ${insight.type === 'critical' ? 'text-warning-500' : insight.type === 'warning' ? 'text-accent-500' : 'text-text-secondary'}`}
            >
              [{insight.title.toUpperCase()}]
            </span>{' '}
            {insight.content}
          </p>
          <div className="absolute -top-px -right-px w-4 h-4 border-t border-r border-warning-500/40"></div>
          <div className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-warning-500/40"></div>
        </div>
        <div className="text-center">
          <button
            type="button"
            className="px-6 py-2.5 bg-warning-500/10 border border-warning-500/30 text-warning-500 font-label text-[9px] tracking-[0.3em] font-black hover:bg-warning-500/20 transition-all"
          >
            AI 分析レポートを表示
          </button>
        </div>
      </div>
    </div>
  );
}
