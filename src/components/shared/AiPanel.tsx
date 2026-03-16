import type React from 'react';
import { useEffect, useState } from 'react';
import type { LocalSuggestion, SuggestionLevel } from '../../lib/localAi';

const LEVEL_COLOR: Record<SuggestionLevel, string> = {
  critical: 'var(--color-danger-500)',
  warn: 'var(--color-accent-500)',
  info: 'var(--color-cyan-500)',
  ok: 'var(--color-text-muted)',
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
    <div
      style={{
        marginTop: '16px',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--color-base-800)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: LEVEL_COLOR[topLevel], fontSize: '10px' }}>
            {LEVEL_ICON[topLevel]}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            {title}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
          }}
        >
          {expanded ? '\u25b2' : '\u25bc'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '8px 12px', background: 'var(--color-base-900)' }}>
          {suggestions.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '4px 0',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
              }}
            >
              <span style={{ color: LEVEL_COLOR[s.level], flexShrink: 0 }}>
                {LEVEL_ICON[s.level]}
              </span>
              <span style={{ color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                {s.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
