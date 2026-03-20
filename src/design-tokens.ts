// ⚠️ このファイルはデザインシステムの SSOT（Single Source of Truth）
// ⚠️ 値を変更する場合は必ず src/index.css の @theme も同期すること

export const NEXUS_TOKENS = {
  color: {
    base: {
      950: '#010102',
      900: '#030305',
      800: '#080808',
      700: '#0f0f12',
      600: '#1a1a1e',
      500: '#2d2d33',
    },
    accent: {
      600: '#2fa822',
      500: '#44d62c',
      400: '#5ee048',
      300: '#88ec78',
    },
    warm: {
      600: '#8899aa',
      500: '#c8d8e8',
      400: '#ddeaf4',
      300: '#eef5ff',
    },
    amber: {
      600: '#c87800',
      500: '#ffd700',
      400: '#fbbf24',
      300: '#fde68a',
    },
    info: {
      600: '#0099cc',
      500: '#00f0ff',
      400: '#60f8ff',
    },
    danger: { 600: '#cc1111', 500: '#ff3131', 200: '#fecaca' },
    warning: { 600: '#c87800', 500: '#ffd700', 200: '#fde68a' },
    success: { 600: '#2fa822', 500: '#44d62c', 200: '#bbf7d0' },
    text: {
      primary: '#e5e1e7',
      secondary: '#a8b8b9',
      muted: '#566070',
    },
    border: {
      subtle: '#1a1a1e',
      active: '#44d62c',
    },
  },
  typography: {
    fontFamily: {
      sans: '"Inter", "Noto Sans JP", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, monospace',
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
    core: { accent: 'accent-500', text: 'text-accent-500', bg: 'bg-accent-500/15' },
    arsenal: { accent: 'accent-500', text: 'text-accent-500', bg: 'bg-accent-500/15' },
    tactics: { accent: 'warm-500', text: 'text-warm-500', bg: 'bg-warm-500/15' },
    logs: { accent: 'info-500', text: 'text-info-500', bg: 'bg-info-500/15' },
    settings: { accent: 'accent-500', text: 'text-accent-500', bg: 'bg-accent-500/15' },
  },
} as const;

export type NexusTokens = typeof NEXUS_TOKENS;
