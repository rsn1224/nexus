import type React from 'react';
import { useEffect, useState } from 'react';
import type { LocalSuggestion, SuggestionLevel } from '../../lib/localAi';

const LEVEL_COLOR: Record<SuggestionLevel, string> = {
  critical: 'text-danger-500',
  warn: 'text-(--color-accent-500)',
  info: 'text-cyan-500',
  ok: 'text-text-muted',
};

// Unicode エスケープで Biome no-literal-unicode 対策
const LEVEL_ICON: Record<SuggestionLevel, string> = {
  critical: '\u25b2', // ▲
  warn: '\u25cf', // ●
  info: '\u25c6', // ◆
  ok: '\u2713', // ✓
};

interface AiPanelProps {
  suggestions: LocalSuggestion[];
  title?: string;
}

export default function AiPanel({
  suggestions,
  title = 'AI \u30a2\u30c9\u30d0\u30a4\u30b9',
}: AiPanelProps): React.ReactElement {
  const hasAlert = suggestions.some((s) => s.level === 'warn' || s.level === 'critical');

  // suggestions が変わったとき（初回 scan 完了後など）に展開状態を同期する
  const [expanded, setExpanded] = useState(hasAlert);
  useEffect(() => {
    if (hasAlert) setExpanded(true);
  }, [hasAlert]);

  const topLevel: SuggestionLevel = suggestions[0]?.level ?? 'ok';

  return (
    <div className="mt-4 border border-border-subtle overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-base-800 border-none cursor-pointer hover:bg-base-700 transition-colors"
      >
        <div className="flex items-center gap-[6px]">
          <span className={`text-[10px] ${LEVEL_COLOR[topLevel]}`}>{LEVEL_ICON[topLevel]}</span>
          <span className="font-(--font-mono) text-[10px] font-semibold text-text-muted tracking-wider">
            {title}
          </span>
        </div>
        <span className="font-(--font-mono) text-[9px] text-text-muted">
          {expanded ? '\u25b2' : '\u25bc'}
        </span>
      </button>

      {expanded && (
        <div className="px-3 py-2 bg-base-900">
          {suggestions.map((s) => (
            <div key={s.id} className="flex items-start gap-2 py-1 font-(--font-mono) text-[10px]">
              <span className={`${LEVEL_COLOR[s.level]} shrink-0`}>{LEVEL_ICON[s.level]}</span>
              <span className="text-text-secondary leading-6">{s.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
