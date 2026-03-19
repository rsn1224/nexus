import { memo, useCallback } from 'react';
import type { Suggestion, SuggestionPriority } from '../../types/v2';

interface Props {
  suggestion: Suggestion;
  onApply: (id: string) => void;
  onRollback: (id: string) => void;
  loading: boolean;
}

const CARD_CLASS: Record<SuggestionPriority, string> = {
  critical: 'border-l-4 border-l-warning-500 bg-warning-500/10',
  recommended: 'border-l-4 border-l-accent-500 bg-accent-500/10',
  info: 'border-l-4 border-l-border-subtle',
};

const ICON: Record<SuggestionPriority, string> = {
  critical: '⚡',
  recommended: '💡',
  info: '●',
};

export const SuggestionCard = memo(function SuggestionCard({
  suggestion,
  onApply,
  onRollback,
  loading,
}: Props) {
  const handleApply = useCallback(() => {
    onApply(suggestion.id);
  }, [onApply, suggestion.id]);

  const handleRollback = useCallback(() => {
    onRollback(suggestion.id);
  }, [onRollback, suggestion.id]);

  const hasActions = suggestion.actions.length > 0;

  return (
    <div
      className={`flex items-start justify-between gap-3 px-3 py-2.5 rounded-sm ${CARD_CLASS[suggestion.priority]}`}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <span className="text-xs mt-0.5 shrink-0">{ICON[suggestion.priority]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-text-primary text-xs font-mono">{suggestion.title}</p>
          <p className="text-text-secondary text-xs mt-0.5 truncate">{suggestion.reason}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {suggestion.impact !== '警告' && (
          <span className="text-accent-500 text-xs font-mono">{suggestion.impact}</span>
        )}
        {suggestion.isApplied ? (
          <>
            <span className="text-success-500 text-xs font-mono">✓</span>
            {suggestion.canRollback && (
              <button
                type="button"
                onClick={handleRollback}
                disabled={loading}
                className="text-xs font-mono text-text-secondary border border-border-subtle px-2 py-0.5 rounded hover:border-text-secondary transition-colors disabled:opacity-40"
              >
                REVERT
              </button>
            )}
          </>
        ) : (
          hasActions && (
            <button
              type="button"
              onClick={handleApply}
              disabled={loading}
              className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 border border-accent-500 text-accent-500 hover:bg-accent-500/10 transition-colors rounded disabled:opacity-40"
            >
              APPLY
            </button>
          )
        )}
      </div>
    </div>
  );
});
