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
    <div
      style={{
        marginTop: '12px',
        background: 'var(--color-base-800)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={handleAsk}
        disabled={panelState.status === 'loading'}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          cursor: panelState.status === 'loading' ? 'default' : 'pointer',
          opacity: panelState.status === 'loading' || processNames.length === 0 ? 0.5 : 1,
        }}
        title={processNames.length === 0 ? '先に RUN BOOST を実行してください' : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--color-cyan-500)',
              letterSpacing: '0.1em',
            }}
          >
            AI に聞く
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
          }}
        >
          {panelState.status === 'loading' ? 'ASKING...' : '▶ ASK AI'}
        </span>
      </button>

      {panelState.status === 'loading' && (
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--color-base-900)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            marginTop: '8px',
          }}
        >
          Perplexity に問い合わせ中...
        </div>
      )}

      {panelState.status === 'error' && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderBottom: '1px solid var(--color-danger-600)',
            color: 'var(--color-danger-500)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
          }}
        >
          ⚠ {panelState.error}
        </div>
      )}

      {panelState.status === 'ok' && (
        <div style={{ padding: '8px 12px', background: 'var(--color-base-900)' }}>
          {panelState.data.map((suggestion, i) => (
            <div
              key={suggestion}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '4px 0',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                lineHeight: '1.5',
              }}
            >
              <span
                style={{
                  color: 'var(--color-cyan-500)',
                  flexShrink: 0,
                  fontWeight: 600,
                }}
              >
                {i + 1}.
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
