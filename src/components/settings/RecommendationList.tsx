import type React from 'react';
import { useTranslation } from 'react-i18next';
import type { RecommendedValue, SettingRecommendation } from '../../types';
import Button from '../ui/Button';

interface RecommendationListProps {
  recommendations: SettingRecommendation[];
  onApply: (settingId: string) => void;
}

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

const formatRecommendedValue = (value: RecommendedValue) => {
  if ('boolean' in value) return value.boolean ? 'ON' : 'OFF';
  if ('string' in value) return value.string.toUpperCase();
  if ('enum' in value) return value.enum.toUpperCase();
  return String(value);
};

export default function RecommendationList({
  recommendations,
  onApply,
}: RecommendationListProps): React.ReactElement {
  const { t } = useTranslation(['settings', 'common']);
  return (
    <div>
      <h4 className="text-text-primary text-xs mb-2">
        {t('settings:advisor.recommendations')} ({recommendations.length})
      </h4>

      {recommendations.length === 0 ? (
        <div className="p-3 bg-base-800 rounded-lg text-center">
          <div className="text-success-500 text-xs">{t('settings:advisor.allOptimal')}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recommendations.map((rec) => (
            <div
              key={rec.settingId}
              className={`p-3 rounded-lg border border-base-800 border-l-4 ${importanceBorderClass(rec.importance)} ${rec.isOptimal ? 'bg-base-800' : 'bg-base-900'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="text-text-primary text-xs font-bold mb-1">
                    {rec.label.toUpperCase()}
                  </div>
                  <div className="text-text-secondary text-xs">{rec.reason}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`${safetyBadgeClass(rec.safetyLevel)} text-xs font-bold px-1.5 py-0.5 rounded-lg`}
                  >
                    {rec.safetyLevel.toUpperCase()}
                  </span>
                  <span className={`${importanceTextClass(rec.importance)} text-xs font-bold`}>
                    {rec.importance.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-xs">{t('common:current')}</span>
                  <span
                    className={`${rec.isOptimal ? 'text-success-500' : 'text-text-primary'} text-xs font-bold`}
                  >
                    {rec.currentValue}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary text-xs">{t('common:recommended')}</span>
                  <span
                    className={`${rec.isOptimal ? 'text-text-primary' : 'text-accent-500'} text-xs font-bold`}
                  >
                    {formatRecommendedValue(rec.recommendedValue)}
                  </span>
                </div>
              </div>

              {!rec.isOptimal && (
                <Button
                  variant={rec.safetyLevel === 'safe' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => onApply(rec.settingId)}
                >
                  {rec.safetyLevel === 'safe' ? t('common:apply') : t('common:applyAdvanced')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
