import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [panelState, setPanelState] = useState<PanelState>({ status: 'idle' });

  const handleAsk = async () => {
    if (processNames.length === 0) {
      setPanelState({ status: 'error', error: t('runBoostFirst') });
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
        error: err instanceof Error ? err.message : t('unknownError'),
      });
    }
  };

  const isDisabled = panelState.status === 'loading' || processNames.length === 0;

  return (
    <div className="mt-3 bg-base-800 border border-border-subtle rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={handleAsk}
        disabled={panelState.status === 'loading'}
        className={`w-full flex items-center justify-between px-3 py-[10px] bg-transparent border-none ${isDisabled ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
        title={processNames.length === 0 ? t('runBoostFirst') : undefined}
      >
        <div className="flex items-center gap-[6px]">
          <span className="text-xs font-bold text-accent-500">{t('askAiLabel')}</span>
        </div>
        <span className="text-xs text-text-muted">
          {panelState.status === 'loading' ? t('asking') : t('askAi')}
        </span>
      </button>

      {panelState.status === 'loading' && (
        <div className="px-3 py-2 bg-base-900 text-xs text-text-muted mt-2">
          {t('askingPerplexity')}
        </div>
      )}

      {panelState.status === 'error' && (
        <div className="px-3 py-2 bg-base-800 border-b border-danger-600 text-danger-500 text-xs">
          ⚠ {panelState.error}
        </div>
      )}

      {panelState.status === 'ok' && (
        <div className="px-3 py-2 bg-base-900">
          {panelState.data.map((suggestion, i) => (
            <div className="flex items-start gap-2 py-1 text-xs leading-normal" key={suggestion}>
              <span className="text-accent-500 shrink-0 font-semibold">{i + 1}.</span>
              <span className="text-text-secondary">{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
