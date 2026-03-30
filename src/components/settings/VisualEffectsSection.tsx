import type React from 'react';
import { useTranslation } from 'react-i18next';
import { VisualEffects } from '../../types';
import { Button } from '../ui';

interface VisualEffectsSectionProps {
  pendingVisualEffects: VisualEffects;
  isLoading: boolean;
  onPendingChange: (effect: VisualEffects) => void;
  onApply: () => void;
}

export default function VisualEffectsSection({
  pendingVisualEffects,
  isLoading,
  onPendingChange,
  onApply,
}: VisualEffectsSectionProps): React.ReactElement {
  const { t } = useTranslation(['settings', 'common']);
  return (
    <div className="bg-base-800 border border-border-subtle rounded-lg p-3">
      <div className="text-xs text-text-muted mb-2">{t('settings:windows.visual')}</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-text-secondary">{t('settings:windows.visualEffects')}</div>
          <div className="flex items-center gap-2">
            <select
              value={pendingVisualEffects}
              title={t('settings:windows.visualEffects')}
              onChange={(e) => onPendingChange(e.target.value as VisualEffects)}
              className="bg-base-700 border border-border-subtle text-text-primary font-mono text-xs px-2 py-1 rounded-lg"
            >
              <option value={VisualEffects.BestPerformance}>
                {t('settings:windows.bestPerformance')}
              </option>
              <option value={VisualEffects.Balanced}>{t('settings:windows.balanced')}</option>
              <option value={VisualEffects.BestAppearance}>
                {t('settings:windows.bestAppearance')}
              </option>
            </select>
            <Button variant="secondary" size="sm" onClick={onApply} disabled={isLoading}>
              {t('common:apply')}
            </Button>
          </div>
        </div>
        <div className="text-xs text-text-muted">{t('settings:windows.visualEffectsHint')}</div>
      </div>
    </div>
  );
}
