import { memo, useCallback } from 'react';
import type { Suggestion, SuggestionPriority } from '../../types/v2';

interface Props {
  suggestion: Suggestion;
  onApply: (id: string) => void;
  onRollback: (id: string) => void;
  loading: boolean;
}

const BORDER_CLASS: Record<SuggestionPriority, string> = {
  critical: 'border-l-4 border-l-danger-500 shadow-[0_0_15px_rgba(255,49,49,0.1)]',
  recommended: 'border-l-4 border-l-info-500',
  info: 'border-l-4 border-l-border-subtle',
};

const LABEL_CLASS: Record<SuggestionPriority, string> = {
  critical: 'text-danger-500',
  recommended: 'text-info-500',
  info: 'text-text-secondary',
};

const JP_LABEL: Record<SuggestionPriority, string> = {
  critical: '緊急最適化',
  recommended: '推奨設定',
  info: '情報',
};

export const SuggestionCard = memo(function SuggestionCard({
  suggestion,
  onApply,
  onRollback,
  loading,
}: Props) {
  const handleApply = useCallback(() => onApply(suggestion.id), [onApply, suggestion.id]);
  const handleRollback = useCallback(() => onRollback(suggestion.id), [onRollback, suggestion.id]);
  const hasActions = suggestion.actions.length > 0;

  return (
    <div
      className={`piano-surface p-4 cursor-pointer hover:bg-white/5 transition-all ${BORDER_CLASS[suggestion.priority]}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] tracking-widest ${LABEL_CLASS[suggestion.priority]}`}>
          {JP_LABEL[suggestion.priority]}
        </span>
        {suggestion.impact !== '警告' && (
          <span className="text-accent-500 text-[9px] font-bold">{suggestion.impact}</span>
        )}
      </div>
      <h4 className="text-[11px] font-bold text-text-primary uppercase tracking-tight">
        {suggestion.title}
      </h4>
      <p className="text-[9px] text-text-secondary mt-1">{suggestion.reason}</p>

      {suggestion.isApplied ? (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-success-500 text-xs">✓ APPLIED</span>
          {suggestion.canRollback && (
            <button
              type="button"
              onClick={handleRollback}
              disabled={loading}
              className="text-[9px] text-text-secondary border border-border-subtle px-2 py-0.5 hover:border-text-secondary transition-colors disabled:opacity-40"
            >
              REVERT
            </button>
          )}
        </div>
      ) : (
        hasActions && (
          <button
            type="button"
            onClick={handleApply}
            disabled={loading}
            className="mt-3 text-[9px] uppercase tracking-wider px-3 py-1 border border-accent-500 text-accent-500 hover:bg-accent-500/10 transition-colors disabled:opacity-40"
          >
            DEPLOY
          </button>
        )
      )}
    </div>
  );
});
