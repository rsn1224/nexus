import { memo } from 'react';
import type { Suggestion } from '../../types/v2';

interface Props {
  suggestions: Suggestion[];
}

export const AiAdvisorLog = memo(function AiAdvisorLog({ suggestions }: Props) {
  const topSuggestions = suggestions.filter((s) => !s.isApplied).slice(0, 3);
  const timestamp = new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <span className="text-text-secondary text-[10px] tracking-widest opacity-70 block">
          AI アドバイザー
        </span>
        <h2 className="text-xs font-black tracking-widest text-text-secondary uppercase">
          Stitch_Interaction_Log
        </h2>
      </div>

      <div className="piano-surface flex-1 p-4 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-info-500/20" />
        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {topSuggestions.length > 0 ? (
            topSuggestions.map((s, i) => {
              const isWarn = s.priority === 'critical';
              const dotColor = isWarn ? 'bg-warning-500' : 'bg-info-500';
              const textColor = isWarn ? 'text-warning-500' : 'text-info-500';
              const borderColor = isWarn ? 'border-warning-500/30' : 'border-info-500/30';

              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${dotColor} ${i === 0 ? 'pulse-node' : ''}`}
                    />
                    <span className={`text-[9px] ${textColor} font-black uppercase`}>
                      {'Stitch // '}
                      {timestamp}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] text-text-primary leading-relaxed border-l ${borderColor} pl-3`}
                  >
                    <span className="text-text-secondary text-[10px] tracking-widest opacity-50 block mb-1">
                      {s.reason}
                    </span>
                    {s.title} — {s.impact}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-info-500 pulse-node" />
                <span className="text-[9px] text-info-500 font-black uppercase">
                  {'Stitch // '}
                  {timestamp}
                </span>
              </div>
              <p className="text-[11px] text-text-primary leading-relaxed border-l border-info-500/30 pl-3">
                <span className="text-text-secondary text-[10px] tracking-widest opacity-50 block mb-1">
                  システムは安定しています。
                </span>
                System integrity verified. No immediate threats detected in the local core network.
              </p>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-text-secondary font-light">
            <span>REPLY_LINK_ACTIVE</span>
            <span className="text-xs">⌨</span>
          </div>
          <div className="bg-base-950 p-2 text-[10px] text-info-500/50 tracking-wider flex items-center gap-2">
            <span>&gt; INPUT_SYSTEM_COMMAND_</span>
            <span className="w-1 h-3 bg-info-500 blink-fast" />
          </div>
        </div>
      </div>
    </div>
  );
});
