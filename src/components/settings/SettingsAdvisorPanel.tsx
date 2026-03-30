import type React from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowsSettings } from '../../stores/useWindowsSettingsStore';
import Button from '../ui/Button';
import AdvisorScoreCard from './AdvisorScoreCard';
import RecommendationList from './RecommendationList';

const SettingsAdvisorPanel: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const {
    advisorResult,
    advisorLoading,
    advisorError,
    fetchAdvisorResult,
    applyRecommendation,
    applyAllSafeRecommendations,
  } = useWindowsSettings();

  useEffect(() => {
    fetchAdvisorResult();
  }, [fetchAdvisorResult]);

  if (advisorLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-text-secondary text-xs">{t('settings:advisor.analyzing')}</div>
      </div>
    );
  }

  if (advisorError) {
    return (
      <div className="p-4">
        <div className="text-danger-500 text-xs mb-2">ERROR: {advisorError}</div>
        <Button variant="primary" size="sm" onClick={fetchAdvisorResult}>
          {t('common:retry')}
        </Button>
      </div>
    );
  }

  if (!advisorResult) {
    return (
      <div className="p-4 text-center">
        <div className="text-text-secondary text-xs">{t('settings:advisor.noData')}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <AdvisorScoreCard
        advisorResult={advisorResult}
        onApplyAllSafe={applyAllSafeRecommendations}
        onRefresh={fetchAdvisorResult}
      />
      <RecommendationList
        recommendations={advisorResult.recommendations}
        onApply={applyRecommendation}
      />
    </div>
  );
};

export default SettingsAdvisorPanel;
