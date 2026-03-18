import type React from 'react';
import { useEffect } from 'react';
import { useWindowsSettings } from '../../stores/useWindowsSettingsStore';
import type { RecommendedValue } from '../../types';
import Button from '../ui/Button';

const importanceBorderClass = (importance: string) => {
  switch (importance) {
    case 'high':
      return 'border-l-danger-500';
    case 'medium':
      return 'border-l-accent-500';
    default:
      return 'border-l-text-secondary';
  }
};

const importanceTextClass = (importance: string) => {
  switch (importance) {
    case 'high':
      return 'text-danger-500';
    case 'medium':
      return 'text-accent-500';
    default:
      return 'text-text-secondary';
  }
};

// Returns combined text + bg classes for safety badge
const safetyBadgeClass = (safety: string) => {
  switch (safety) {
    case 'safe':
      return 'text-success-500 bg-success-500/10';
    case 'moderate':
      return 'text-accent-500 bg-accent-500/10';
    case 'advanced':
      return 'text-danger-500 bg-danger-500/10';
    default:
      return 'text-text-secondary bg-base-700';
  }
};

const scoreTextClass = (score: number) => {
  if (score >= 80) return 'text-success-500';
  if (score >= 60) return 'text-accent-500';
  return 'text-danger-500';
};

const formatRecommendedValue = (value: RecommendedValue) => {
  if ('boolean' in value) return value.boolean ? 'ON' : 'OFF';
  if ('string' in value) return value.string.toUpperCase();
  if ('enum' in value) return value.enum.toUpperCase();
  return String(value);
};

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
        <div className="text-text-secondary text-[11px]">ANALYZING SETTINGS...</div>
      </div>
    );
  }

  if (advisorError) {
    return (
      <div className="p-4">
        <div className="text-danger-500 text-[11px] mb-2">ERROR: {advisorError}</div>
        <Button variant="primary" size="sm" onClick={fetchAdvisorResult}>
          RETRY
        </Button>
      </div>
    );
  }

  if (!advisorResult) {
    return (
      <div className="p-4 text-center">
        <div className="text-text-secondary text-[11px]">NO DATA AVAILABLE</div>
      </div>
    );
  }

  const safeCount = advisorResult.recommendations.filter((r) => r.safetyLevel === 'safe').length;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-text-primary text-[14px] mb-2">SETTINGS OPTIMIZATION ADVISOR</h3>

        {/* Optimization Score */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-text-secondary text-[12px]">OPTIMIZATION SCORE</span>
            <span
              className={`${scoreTextClass(advisorResult.optimizationScore)} text-[12px] font-bold`}
            >
              {advisorResult.optimizationScore}%
            </span>
          </div>
          <div className="w-full h-1 bg-base-800 rounded-full overflow-hidden">
            {/* width is dynamic — inline style required */}
            <div
              className={`h-full transition-[width] duration-300 ${
                advisorResult.optimizationScore >= 80
                  ? 'bg-success-500'
                  : advisorResult.optimizationScore >= 60
                    ? 'bg-accent-500'
                    : 'bg-danger-500'
              }`}
              style={{ width: `${advisorResult.optimizationScore}%` }}
            />
          </div>
        </div>

        {/* Hardware Summary */}
        <div className="p-2 bg-base-800 rounded mb-3">
          <div className="text-text-secondary text-[10px] mb-1">HARDWARE SUMMARY</div>
          <div className="text-text-primary text-[11px]">{advisorResult.hardwareSummary}</div>
        </div>

        {/* Warnings */}
        {advisorResult.warnings.length > 0 && (
          <div className="mb-3">
            <div className="text-accent-500 text-[11px] mb-1">WARNINGS:</div>
            {advisorResult.warnings.map((warning) => (
              <div
                key={`warning-${warning.substring(0, 30)}`}
                className="text-accent-500 text-[10px] mb-0.5"
              >
                • {warning}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={safeCount > 0 ? 'primary' : 'ghost'}
            size="sm"
            onClick={applyAllSafeRecommendations}
            disabled={safeCount === 0}
          >
            APPLY ALL SAFE ({safeCount})
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchAdvisorResult}>
            REFRESH
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-text-primary text-[12px] mb-2">
          RECOMMENDATIONS ({advisorResult.recommendations.length})
        </h4>

        {advisorResult.recommendations.length === 0 ? (
          <div className="p-3 bg-base-800 rounded text-center">
            <div className="text-success-500 text-[11px]">ALL SETTINGS OPTIMAL</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {advisorResult.recommendations.map((rec) => {
              return (
                <div
                  key={rec.settingId}
                  className={`p-3 rounded border border-base-800 border-l-4 ${importanceBorderClass(rec.importance)} ${rec.isOptimal ? 'bg-base-800' : 'bg-base-900'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-text-primary text-[11px] font-bold mb-1">
                        {rec.label.toUpperCase()}
                      </div>
                      <div className="text-text-secondary text-[10px]">{rec.reason}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`${safetyBadgeClass(rec.safetyLevel)} text-[9px] font-bold px-1.5 py-0.5 rounded`}
                      >
                        {rec.safetyLevel.toUpperCase()}
                      </span>
                      <span
                        className={`${importanceTextClass(rec.importance)} text-[9px] font-bold`}
                      >
                        {rec.importance.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-[10px]">CURRENT:</span>
                      <span
                        className={`${rec.isOptimal ? 'text-success-500' : 'text-text-primary'} text-[10px] font-bold`}
                      >
                        {rec.currentValue}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-[10px]">RECOMMENDED:</span>
                      <span
                        className={`${rec.isOptimal ? 'text-text-primary' : 'text-accent-500'} text-[10px] font-bold`}
                      >
                        {formatRecommendedValue(rec.recommendedValue)}
                      </span>
                    </div>
                  </div>

                  {!rec.isOptimal && (
                    <Button
                      variant={rec.safetyLevel === 'safe' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => applyRecommendation(rec.settingId)}
                    >
                      {rec.safetyLevel === 'safe' ? 'APPLY' : 'APPLY (ADVANCED)'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsAdvisorPanel;
