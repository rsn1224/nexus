import type React from 'react';
import { useEffect } from 'react';
import { useWindowsSettings } from '../../stores/useWindowsSettingsStore';
import type { RecommendedValue } from '../../types';

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

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'var(--color-danger-500)';
      case 'medium':
        return 'var(--color-warning-500)';
      case 'low':
        return 'var(--color-text-secondary)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const getSafetyColor = (safety: string) => {
    switch (safety) {
      case 'safe':
        return 'var(--color-success-500)';
      case 'moderate':
        return 'var(--color-warning-500)';
      case 'advanced':
        return 'var(--color-danger-500)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const formatRecommendedValue = (value: RecommendedValue) => {
    if ('boolean' in value) {
      return value.boolean ? 'ON' : 'OFF';
    }
    if ('string' in value) {
      return value.string.toUpperCase();
    }
    if ('enum' in value) {
      return value.enum.toUpperCase();
    }
    return String(value);
  };

  if (advisorLoading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>ANALYZING SETTINGS...</div>
      </div>
    );
  }

  if (advisorError) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ color: 'var(--color-danger-500)', marginBottom: '8px' }}>
          ERROR: {advisorError}
        </div>
        <button
          type="button"
          onClick={fetchAdvisorResult}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-accent-500)',
            color: 'var(--color-background)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          RETRY
        </button>
      </div>
    );
  }

  if (!advisorResult) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>NO DATA AVAILABLE</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--color-text-primary)', fontSize: '14px', marginBottom: '8px' }}>
          SETTINGS OPTIMIZATION ADVISOR
        </h3>

        {/* Optimization Score */}
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              OPTIMIZATION SCORE
            </span>
            <span
              style={{
                color:
                  advisorResult.optimizationScore >= 80
                    ? 'var(--color-success-500)'
                    : advisorResult.optimizationScore >= 60
                      ? 'var(--color-warning-500)'
                      : 'var(--color-danger-500)',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {advisorResult.optimizationScore}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${advisorResult.optimizationScore}%`,
                height: '100%',
                backgroundColor:
                  advisorResult.optimizationScore >= 80
                    ? 'var(--color-success-500)'
                    : advisorResult.optimizationScore >= 60
                      ? 'var(--color-warning-500)'
                      : 'var(--color-danger-500)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Hardware Summary */}
        <div
          style={{
            padding: '8px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{ color: 'var(--color-text-secondary)', fontSize: '10px', marginBottom: '4px' }}
          >
            HARDWARE SUMMARY
          </div>
          <div style={{ color: 'var(--color-text-primary)', fontSize: '11px' }}>
            {advisorResult.hardwareSummary}
          </div>
        </div>

        {/* Warnings */}
        {advisorResult.warnings.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{ color: 'var(--color-warning-500)', fontSize: '11px', marginBottom: '4px' }}
            >
              WARNINGS:
            </div>
            {advisorResult.warnings.map((warning) => (
              <div
                key={`warning-${warning.substring(0, 30)}`}
                style={{ color: 'var(--color-warning-500)', fontSize: '10px', marginBottom: '2px' }}
              >
                • {warning}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={applyAllSafeRecommendations}
            disabled={
              advisorResult.recommendations.filter((r) => r.safetyLevel === 'safe').length === 0
            }
            style={{
              padding: '6px 12px',
              backgroundColor:
                advisorResult.recommendations.filter((r) => r.safetyLevel === 'safe').length > 0
                  ? 'var(--color-success-500)'
                  : 'var(--color-surface)',
              color:
                advisorResult.recommendations.filter((r) => r.safetyLevel === 'safe').length > 0
                  ? 'var(--color-background)'
                  : 'var(--color-text-muted)',
              border: 'none',
              borderRadius: '4px',
              cursor:
                advisorResult.recommendations.filter((r) => r.safetyLevel === 'safe').length > 0
                  ? 'pointer'
                  : 'default',
              fontSize: '11px',
            }}
          >
            APPLY ALL SAFE (
            {advisorResult.recommendations.filter((r) => r.safetyLevel === 'safe').length})
          </button>
          <button
            type="button"
            onClick={fetchAdvisorResult}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 style={{ color: 'var(--color-text-primary)', fontSize: '12px', marginBottom: '8px' }}>
          RECOMMENDATIONS ({advisorResult.recommendations.length})
        </h4>

        {advisorResult.recommendations.length === 0 ? (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: 'var(--color-success-500)', fontSize: '11px' }}>
              ALL SETTINGS OPTIMAL
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {advisorResult.recommendations.map((rec) => (
              <div
                key={rec.settingId}
                style={{
                  padding: '12px',
                  backgroundColor: rec.isOptimal
                    ? 'var(--color-surface)'
                    : 'var(--color-background)',
                  border: `1px solid ${rec.isOptimal ? 'var(--color-surface)' : 'var(--color-surface)'}`,
                  borderRadius: '4px',
                  borderLeft: `4px solid ${getImportanceColor(rec.importance)}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: 'var(--color-text-primary)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                      }}
                    >
                      {rec.label.toUpperCase()}
                    </div>
                    <div
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '10px',
                        marginBottom: '4px',
                      }}
                    >
                      {rec.reason}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        color: getSafetyColor(rec.safetyLevel),
                        fontSize: '9px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        backgroundColor: `${getSafetyColor(rec.safetyLevel)}20`,
                        borderRadius: '2px',
                      }}
                    >
                      {rec.safetyLevel.toUpperCase()}
                    </span>
                    <span
                      style={{
                        color: getImportanceColor(rec.importance),
                        fontSize: '9px',
                        fontWeight: 'bold',
                      }}
                    >
                      {rec.importance.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                      CURRENT:
                    </span>
                    <span
                      style={{
                        color: rec.isOptimal
                          ? 'var(--color-success-500)'
                          : 'var(--color-text-primary)',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}
                    >
                      {rec.currentValue}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                      RECOMMENDED:
                    </span>
                    <span
                      style={{
                        color: rec.isOptimal
                          ? 'var(--color-text-primary)'
                          : 'var(--color-accent-500)',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}
                    >
                      {formatRecommendedValue(rec.recommendedValue)}
                    </span>
                  </div>
                </div>

                {!rec.isOptimal && (
                  <button
                    type="button"
                    onClick={() => applyRecommendation(rec.settingId)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor:
                        rec.safetyLevel === 'safe'
                          ? 'var(--color-accent-500)'
                          : 'var(--color-surface)',
                      color:
                        rec.safetyLevel === 'safe'
                          ? 'var(--color-background)'
                          : 'var(--color-text-primary)',
                      border:
                        rec.safetyLevel === 'safe'
                          ? 'none'
                          : `1px solid ${getSafetyColor(rec.safetyLevel)}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    {rec.safetyLevel === 'safe' ? 'APPLY' : 'APPLY (ADVANCED)'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsAdvisorPanel;
