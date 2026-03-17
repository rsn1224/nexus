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

  const isDisabled = panelState.status === 'loading' || processNames.length === 0;

  return (
    <div className="mt-3 bg-base-800 border border-border-subtle rounded overflow-hidden">
      <button
        type="button"
        onClick={handleAsk}
        disabled={panelState.status === 'loading'}
        className={`w-full flex items-center justify-between px-3 py-[10px] bg-transparent border-none ${isDisabled ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
        title={processNames.length === 0 ? '先に RUN BOOST を実行してください' : undefined}
      >
        <div className="flex items-center gap-[6px]">
          <span className="font-[var(--font-mono)] text-[10px] font-bold text-cyan-500 tracking-widest">
            AI に聞く
          </span>
        </div>
        <span className="font-[var(--font-mono)] text-[9px] text-text-muted">
          {panelState.status === 'loading' ? 'ASKING...' : '▶ ASK AI'}
        </span>
      </button>

      {panelState.status === 'loading' && (
        <div className="px-3 py-2 bg-base-900 font-[var(--font-mono)] text-[10px] text-text-muted mt-2">
          Perplexity に問い合わせ中...
        </div>
      )}

      {panelState.status === 'error' && (
        <div className="px-3 py-2 bg-base-800 border-b border-danger-600 text-danger-500 font-[var(--font-mono)] text-[10px]">
          ⚠ {panelState.error}
        </div>
      )}

      {panelState.status === 'ok' && (
        <div className="px-3 py-2 bg-base-900">
          {panelState.data.map((suggestion, i) => (
            <div
              className="flex items-start gap-2 py-1 font-[var(--font-mono)] text-[10px] leading-normal"
              key={suggestion}
            >
              <span className="text-cyan-500 shrink-0 font-semibold">{i + 1}.</span>
              <span className="text-text-secondary">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
