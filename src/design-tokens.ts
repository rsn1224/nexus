// ⚠️ このファイルはデザインシステムの SSOT（Single Source of Truth）
// ⚠️ 値を変更する場合は必ず src/index.css の @theme も同期すること

export const NEXUS_TOKENS = {
  color: {
    base: {
      950: '#05060b',
      900: '#08090f',
      800: '#0d0e17',
      700: '#12131e',
      600: '#191a28',
      500: '#202235',
    },
    accent: {
      600: '#0891b2',
      500: '#06b6d4',
      400: '#22d3ee',
    },
    success: { 500: '#22c55e' },
    warning: { 500: '#f59e0b' },
    danger: { 500: '#ef4444' },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      muted: '#64748b',
    },
    border: {
      subtle: 'rgba(34, 211, 238, 0.12)',
      active: 'rgba(34, 211, 238, 0.2)',
    },
  },
  typography: {
    fontFamily: {
      sans: '"Inter", "system-ui", sans-serif',
      mono: '"JetBrains Mono", ui-monospace, monospace',
    },
    fontSize: {
      kpi: { size: '24px', weight: 'bold' },
      section: { size: '11px', weight: 'bold', tracking: '0.15em', transform: 'uppercase' },
      body: { size: '12px', weight: 'normal' },
      label: { size: '10px', weight: '600', tracking: '0.12em' },
      button: { size: '11px', weight: '600', tracking: '0.1em', transform: 'uppercase' },
    },
  },
  spacing: {
    gap: { card: '8px', section: '16px', inner: '6px' },
    padding: { card: '12px', section: '16px' },
  },
  radius: {
    default: '4px',
  },
  motion: {
    // v4: 装飾アニメーション禁止。OPTIMIZE ボタン hover の box-shadow のみ例外
    allowed: 'box-shadow 150ms ease',
  },
} as const;

export type NexusTokens = typeof NEXUS_TOKENS;
