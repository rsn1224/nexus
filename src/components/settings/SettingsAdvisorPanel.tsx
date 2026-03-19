import type React from 'react';
import { useEffect } from 'react';
import { useWindowsSettings } from '../../stores/useWindowsSettingsStore';
import Button from '../ui/Button';
import AdvisorScoreCard from './AdvisorScoreCard';
import RecommendationList from './RecommendationList';

const SettingsAdvisorPanel: React.FC = () => {
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
        <div className="text-text-secondary text-xs">ANALYZING SETTINGS...</div>
      </div>
    );
  }

  if (advisorError) {
    return (
      <div className="p-4">
        <div className="text-danger-500 text-xs mb-2">ERROR: {advisorError}</div>
        <Button variant="primary" size="sm" onClick={fetchAdvisorResult}>
          RETRY
        </Button>
      </div>
    );
  }

  if (!advisorResult) {
    return (
      <div className="p-4 text-center">
        <div className="text-text-secondary text-xs">NO DATA AVAILABLE</div>
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
