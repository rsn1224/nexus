import type React from 'react';
import { useTranslation } from 'react-i18next';
import { PowerPlan } from '../../types';
import { Button } from '../ui';

interface PowerPlanSectionProps {
  pendingPowerPlan: PowerPlan;
  isLoading: boolean;
  onPendingChange: (plan: PowerPlan) => void;
  onApply: () => void;
}

export default function PowerPlanSection({
  pendingPowerPlan,
  isLoading,
  onPendingChange,
  onApply,
}: PowerPlanSectionProps): React.ReactElement {
  const { t } = useTranslation(['settings', 'common']);
  return (
    <div className="bg-base-800 border border-border-subtle rounded-lg p-3">
      <div className="text-xs text-text-muted mb-2">{t('settings:windows.power')}</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-text-secondary">{t('settings:windows.powerPlan')}</div>
          <div className="flex items-center gap-2">
            <select
              value={pendingPowerPlan}
              title={t('settings:windows.powerPlan')}
              onChange={(e) => onPendingChange(e.target.value as PowerPlan)}
              className="bg-base-700 border border-border-subtle text-text-primary font-mono text-xs px-2 py-1 rounded-lg"
            >
              <option value={PowerPlan.Balanced}>{t('settings:windows.balanced')}</option>
              <option value={PowerPlan.HighPerformance}>
                {t('settings:windows.highPerformance')}
              </option>
              <option value={PowerPlan.PowerSaver}>{t('settings:windows.powerSaver')}</option>
            </select>
            <Button variant="secondary" size="sm" onClick={onApply} disabled={isLoading}>
              {t('common:apply')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
