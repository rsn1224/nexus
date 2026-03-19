// ⚠️ このファイルはデザインシステムの SSOT（Single Source of Truth）
// ⚠️ 値を変更する場合は必ず src/index.css の @theme も同期すること

export const NEXUS_TOKENS = {
  color: {
    base: {
      950: '#06060a',
      900: '#0a0a10',
      800: '#12121c',
      700: '#1a1a28',
      600: '#222234',
      500: '#2c2c40',
    },
    accent: {
      600: '#0891b2',
      500: '#06b6d4',
      400: '#22d3ee',
      300: '#67e8f9',
    },
    warm: {
      600: '#d97706',
      500: '#f59e0b',
      400: '#fbbf24',
      300: '#fde68a',
    },
    purple: {
      600: '#7c3aed',
      500: '#8b5cf6',
      400: '#a78bfa',
      300: '#c4b5fd',
    },
    info: {
      600: '#2563eb',
      500: '#3b82f6',
      400: '#60a5fa',
    },
    danger: { 600: '#dc2626', 500: '#ef4444', 200: '#fecaca' },
    warning: { 600: '#d97706', 500: '#f59e0b', 200: '#fde68a' },
    success: { 600: '#16a34a', 500: '#22c55e', 200: '#bbf7d0' },
    text: {
      primary: '#e0e0ec',
      secondary: '#9090aa',
      muted: '#6b6b82',
    },
    border: {
      subtle: '#1e1e2e',
      active: '#06b6d4',
    },
  },
  typography: {
    fontFamily: {
      sans: '"Inter Variable", "Inter", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
      mono: '"B612 Mono", "JetBrains Mono", ui-monospace, monospace',
    },
    fontSize: {
      xs: { size: '12px', lineHeight: '1.5' },
      sm: { size: '14px', lineHeight: '1.5' },
      base: { size: '16px', lineHeight: '1.6' },
      lg: { size: '18px', lineHeight: '1.5' },
      xl: { size: '20px', lineHeight: '1.4' },
      '2xl': { size: '24px', lineHeight: '1.3' },
      '3xl': { size: '30px', lineHeight: '1.2' },
    },
  },
  spacing: {
    gap: { card: '12px', section: '24px', inner: '8px', form: '12px' },
    padding: { cardSm: '12px', cardMd: '16px', cardLg: '20px' },
  },
  radius: {
    card: '12px', // rounded-xl
    panel: '8px', // rounded-lg
    badge: '9999px', // rounded-full
    glass: '16px', // card-glass / card-glass-elevated
  },
  motion: {
    duration: { fast: '150ms', normal: '200ms', slow: '300ms' },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  elevation: {
    card: '3',
    layers: {
      L1: 'bg-base-900',
      L2: 'card-glass / bg-base-800/80',
      L3: 'bg-base-700/40',
    },
  },
  wing: {
    home: { accent: 'accent-500', text: 'text-accent-500', bg: 'bg-accent-500/15' },
    performance: { accent: 'warm-500', text: 'text-warm-500', bg: 'bg-warm-500/15' },
    games: { accent: 'warm-500', text: 'text-warm-500', bg: 'bg-warm-500/15' },
    hardware: { accent: 'purple-500', text: 'text-purple-500', bg: 'bg-purple-500/15' },
    network: { accent: 'info-500', text: 'text-info-500', bg: 'bg-info-500/15' },
    storage: { accent: 'purple-500', text: 'text-purple-500', bg: 'bg-purple-500/15' },
    log: { accent: 'info-500', text: 'text-info-500', bg: 'bg-info-500/15' },
    settings: { accent: 'accent-500', text: 'text-accent-500', bg: 'bg-accent-500/15' },
  },
} as const;

export type NexusTokens = typeof NEXUS_TOKENS;
