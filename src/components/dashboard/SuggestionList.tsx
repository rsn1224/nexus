import { memo } from 'react';
import type { Suggestion, SuggestionPriority } from '../../types/v2';
import { SuggestionCard } from './SuggestionCard';

interface Props {
  suggestions: Suggestion[];
  onApply: (id: string) => void;
  onRollback: (id: string) => void;
  loading: boolean;
}

const PRIORITY_ORDER: SuggestionPriority[] = ['critical', 'recommended', 'info'];

const PRIORITY_LABEL: Record<SuggestionPriority, string> = {
  critical: 'CRITICAL',
  recommended: 'RECOMMENDED',
  info: 'INFO',
};

export const SuggestionList = memo(function SuggestionList({
  suggestions,
  onApply,
  onRollback,
  loading,
}: Props) {
  const pending = suggestions.filter((s) => !s.isApplied);

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center">
        <span className="text-success-500 text-2xl">✓</span>
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
          ALL OPTIMIZATIONS APPLIED
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
      {PRIORITY_ORDER.map((priority) => {
        const group = pending.filter((s) => s.priority === priority);
        if (group.length === 0) return null;
        return (
          <section key={priority}>
            <p className="text-text-secondary text-xs font-mono uppercase tracking-widest mb-2 px-1">
              — {PRIORITY_LABEL[priority]}
            </p>
            <div className="flex flex-col gap-1.5">
              {group.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  onApply={onApply}
                  onRollback={onRollback}
                  loading={loading}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
});
