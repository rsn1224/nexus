import type React from 'react';

/**
 * 共通スタイル定数。新規ファイルのみ使用。
 * 既存ファイル（HomeWing / BoostWing 等）への適用は行わない。
 * DESIGN.md セクション 15 参照。
 */
export const S = {
  monoLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.08em',
  },
  monoValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--color-text-primary)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  },
  microBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    padding: '1px 4px',
    borderRadius: '2px',
    border: '1px solid var(--color-border-subtle)',
    color: 'var(--color-text-muted)',
  },
  wingHeader: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    flexShrink: 0 as const,
    borderBottom: '1px solid var(--color-border-subtle)',
    paddingBottom: '8px',
  },
} as const satisfies Record<string, React.CSSProperties>;
