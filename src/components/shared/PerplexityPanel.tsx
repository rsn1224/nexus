import type React from 'react';
import { useState } from 'react';
import { getOptimizationSuggestions } from '../../services/perplexityService';

interface PerplexityPanelProps {
  processNames: string[];
}

type PanelState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: string[] }
  | { status: 'error'; error: string };

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = {
  container: {
    marginTop: '12px',
    background: 'var(--color-base-800)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  button: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer' as const,
  },
  buttonDisabled: {
    cursor: 'default' as const,
    opacity: 0.5,
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--color-cyan-500)',
    letterSpacing: '0.1em',
  },
  subtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    color: 'var(--color-text-muted)',
  },
  loadingState: {
    padding: '8px 12px',
    background: 'var(--color-base-900)',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--color-text-muted)',
    marginTop: '8px',
  },
  errorState: {
    padding: '8px 12px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderBottom: '1px solid var(--color-danger-600)',
    color: 'var(--color-danger-500)',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
  },
  successState: {
    padding: '8px 12px',
    background: 'var(--color-base-900)',
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '4px 0',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    lineHeight: '1.5',
  },
  suggestionNumber: {
    color: 'var(--color-cyan-500)',
    flexShrink: 0,
    fontWeight: 600,
  },
  suggestionText: {
    color: 'var(--color-text-secondary)',
  },
} as const;

export default function PerplexityPanel({
  processNames,
}: PerplexityPanelProps): React.ReactElement {
  const [panelState, setPanelState] = useState<PanelState>({ status: 'idle' });

  const handleAsk = async () => {
    if (processNames.length === 0) {
      setPanelState({ status: 'error', error: '先に RUN BOOST を実行してください' });
      return;
    }

    setPanelState({ status: 'loading' });

    try {
      const result = await getOptimizationSuggestions(processNames);
      if (result.ok) {
        setPanelState({ status: 'ok', data: result.data });
      } else {
        setPanelState({ status: 'error', error: result.error });
      }
    } catch (err) {
      setPanelState({
        status: 'error',
        error: err instanceof Error ? err.message : '不明なエラー',
      });
    }
  };

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={handleAsk}
        disabled={panelState.status === 'loading'}
        style={{
          ...styles.button,
          ...(panelState.status === 'loading' || processNames.length === 0
            ? styles.buttonDisabled
            : {}),
          cursor: panelState.status === 'loading' ? 'default' : 'pointer',
        }}
        title={processNames.length === 0 ? '先に RUN BOOST を実行してください' : undefined}
      >
        <div style={styles.buttonContent}>
          <span style={styles.title}>AI に聞く</span>
        </div>
        <span style={styles.subtitle}>
          {panelState.status === 'loading' ? 'ASKING...' : '▶ ASK AI'}
        </span>
      </button>

      {panelState.status === 'loading' && (
        <div style={styles.loadingState}>Perplexity に問い合わせ中...</div>
      )}

      {panelState.status === 'error' && <div style={styles.errorState}>⚠ {panelState.error}</div>}

      {panelState.status === 'ok' && (
        <div style={styles.successState}>
          {panelState.data.map((suggestion, i) => (
            <div style={styles.suggestionItem} key={suggestion}>
              <span style={styles.suggestionNumber}>{i + 1}.</span>
              <span style={styles.suggestionText}>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
