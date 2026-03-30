import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReadinessResult, Recommendation } from '../../lib/gameReadiness';
import { calcReadiness, getRankStyle } from '../../lib/gameReadiness';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import Button from '../ui/Button';

// ============================================================
// SECTION: Score Gauge
// ============================================================

function ScoreGauge({ result }: { result: ReadinessResult }): React.ReactElement {
  const { label, className } = getRankStyle(result.rank);

  return (
    <div className="text-center space-y-2">
      <div className={`text-3xl font-bold ${className}`}>{result.total}</div>
      <div className={`text-xs font-bold uppercase tracking-wider ${className}`}>{label}</div>
    </div>
  );
}

// ============================================================
// SECTION: 3-Axis Breakdown
// ============================================================

const AXIS_I18N_KEYS: Record<string, string> = {
  resource: 'readiness.axisResource',
  optimization: 'readiness.axisOptimization',
  performance: 'readiness.axisPerformance',
};

function AxisBar({ axis, score }: { axis: string; score: number }): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const label = AXIS_I18N_KEYS[axis] ? t(AXIS_I18N_KEYS[axis]) : axis;
  const width = score < 0 ? 0 : Math.min(score, 100);
  const isUnavailable = score < 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-bold">
          {isUnavailable ? t('readiness.na') : `${score}`}
        </span>
      </div>
      <div className="h-1.5 bg-base-700 rounded-full overflow-hidden">
        {!isUnavailable && (
          <div
            className="h-full bg-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${width}%` }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// SECTION: Recommendations
// ============================================================

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-danger-500',
  medium: 'text-accent-400',
  low: 'text-text-muted',
};

function RecommendationRow({ rec }: { rec: Recommendation }): React.ReactElement {
  const color = PRIORITY_COLORS[rec.priority] ?? 'text-text-muted';

  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className={`text-xs font-bold uppercase ${color}`}>{rec.priority[0]}</span>
      <span className="text-xs text-text-secondary">{rec.message}</span>
    </div>
  );
}

// ============================================================
// SECTION: ReadinessSummaryStep
// ============================================================

export default function ReadinessSummaryStep(): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const scanResults = useOnboardingStore((s) => s.scanResults);
  const nextStep = useOnboardingStore((s) => s.nextStep);

  const result = useMemo((): ReadinessResult | null => {
    const hw = scanResults.hardware;
    if (!hw) return null;

    return calcReadiness({
      cpuPercent: null,
      memUsedMb: hw.memUsedGb ? hw.memUsedGb * 1024 : null,
      memTotalMb: hw.memTotalGb ? hw.memTotalGb * 1024 : null,
      gpuUsagePercent: hw.gpuUsagePercent,
      gpuTempC: hw.gpuTempC,
      diskUsagePercent: null,
      isProfileApplied: false,
      boostLevel: 'none',
      timerState: null,
      affinityConfigured: false,
      frameTime: null,
    });
  }, [scanResults.hardware]);

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <div className="text-sm font-bold text-text-primary uppercase tracking-wider">
            {t('readiness.title')}
          </div>
          <div className="text-xs text-text-muted">{t('readiness.noHardware')}</div>
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={nextStep}>
          {t('readiness.next')}
        </Button>
      </div>
    );
  }

  const topRecs = result.recommendations.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="text-sm font-bold text-text-primary uppercase tracking-wider">
          {t('readiness.title')}
        </div>
        <div className="text-xs text-text-muted">{t('readiness.subtitle')}</div>
      </div>

      <ScoreGauge result={result} />

      <div className="space-y-2">
        <AxisBar axis="resource" score={result.axes.resource} />
        <AxisBar axis="optimization" score={result.axes.optimization} />
        <AxisBar axis="performance" score={result.axes.performance} />
      </div>

      {topRecs.length > 0 && (
        <div className="bg-base-800/60 rounded-lg p-3 space-y-1">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            {t('readiness.recommendations')}
          </div>
          {topRecs.map((rec) => (
            <RecommendationRow key={rec.id} rec={rec} />
          ))}
        </div>
      )}

      <Button variant="primary" size="lg" fullWidth onClick={nextStep}>
        {t('readiness.next')}
      </Button>
    </div>
  );
}
