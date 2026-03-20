import type React from 'react';
import { memo } from 'react';

interface StitchAiPanelProps {
  suggestions: string[];
  onApply: (suggestion: string) => void;
  onRollback: () => void;
  loading: boolean;
}

const StitchAiPanel = memo(function StitchAiPanel({
  suggestions,
  onApply,
  onRollback,
  loading,
}: StitchAiPanelProps): React.ReactElement {
  const currentTimestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left: AI Liaison Panel */}
      <div className="md:col-span-8">
        <div className="glass-panel bloom-border flex flex-col md:flex-row">
          {/* Left 1/3: AI Avatar */}
          <div className="w-full md:w-1/3 bg-accent-500/5 p-8 flex flex-col items-center justify-center">
            {/* AI Avatar Circle */}
            <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px] text-accent-500">
                smart_toy
              </span>
            </div>

            <div className="text-center">
              <h3 className="font-black text-xl text-accent-500 tracking-tighter mb-1">
                STITCH AI
              </h3>
              <div className="text-[10px] tracking-widest text-white/60 uppercase">
                Active Liaison
              </div>
            </div>
          </div>

          {/* Right 2/3: Messages */}
          <div className="w-full md:w-2/3 p-8">
            {/* Timestamp */}
            <div className="text-[10px] font-data text-white/40 mb-3">
              [{currentTimestamp}] SYSTEM ANALYSIS
            </div>

            {/* Message */}
            <div className="text-sm text-text-primary mb-6 leading-relaxed">
              System performance analysis complete. CPU utilization within optimal parameters.
              Memory allocation stable. Thermal management operating efficiently. No critical issues
              detected.
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onApply(suggestions[0])}
                disabled={loading}
                className="px-4 py-2 bg-accent-500/20 text-accent-500 text-[10px] tracking-widest uppercase rounded-sm border border-accent-500/30 hover:bg-accent-500/30 transition-colors disabled:opacity-50"
              >
                Apply Suggestion
              </button>
              <button
                type="button"
                onClick={onRollback}
                disabled={loading}
                className="px-4 py-2 bg-white/5 text-white/60 text-[10px] tracking-widest uppercase rounded-sm border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Rollback
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Critical Alert Panel */}
      <div className="md:col-span-4">
        <div className="glass-panel bloom-border bg-warning-500/5 p-6">
          {/* Alert Header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[20px] text-warning-500">warning</span>
            <div className="text-[10px] tracking-widest text-warning-500 uppercase">
              Critical Alert
            </div>
          </div>

          {/* Alert Content */}
          <div className="text-sm text-text-primary mb-6 leading-relaxed">
            Firmware discrepancy detected in Primary Input Hub. Update required for full haptic
            synchronization.
          </div>

          {/* Resolve Button */}
          <button
            type="button"
            className="w-full py-2 bg-warning-500 text-black font-black text-[10px] tracking-widest uppercase rounded-sm hover:brightness-110 transition-all"
          >
            RESOLVE NOW
          </button>
        </div>
      </div>
    </div>
  );
});

export default StitchAiPanel;
