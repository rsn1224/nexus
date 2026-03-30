import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { OnboardingStep } from '../../stores/useOnboardingStore';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import CompleteStep from './CompleteStep';
import ReadinessSummaryStep from './ReadinessSummaryStep';
import ScanStep from './ScanStep';
import WelcomeStep from './WelcomeStep';

// ============================================================
// SECTION: Step Indicator
// ============================================================

const STEP_COUNT = 4;

function StepIndicator({ current }: { current: OnboardingStep }): React.ReactElement {
  return (
    <nav className="flex items-center gap-2 justify-center" aria-label="Onboarding progress">
      {Array.from({ length: STEP_COUNT }, (_, i) => {
        const step = (i + 1) as OnboardingStep;
        const isDone = step < current;
        const isActive = step === current;

        let colorClass = 'bg-base-600';
        if (isDone) colorClass = 'bg-success-500';
        if (isActive) colorClass = 'bg-accent-500';

        return (
          <div
            key={step}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${colorClass}`}
            aria-current={isActive ? 'step' : undefined}
          />
        );
      })}
    </nav>
  );
}

// ============================================================
// SECTION: Step Router
// ============================================================

function StepContent({
  step,
  onComplete,
}: {
  step: OnboardingStep;
  onComplete: () => void;
}): React.ReactElement {
  switch (step) {
    case 1:
      return <WelcomeStep />;
    case 2:
      return <ScanStep />;
    case 3:
      return <ReadinessSummaryStep />;
    case 4:
      return <CompleteStep onComplete={onComplete} />;
  }
}

// ============================================================
// SECTION: Wizard
// ============================================================

export default function OnboardingWizard({
  onComplete,
}: {
  onComplete: () => void;
}): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const skipOnboarding = useOnboardingStore((s) => s.skipOnboarding);

  const handleSkip = useCallback(() => {
    skipOnboarding();
    onComplete();
  }, [skipOnboarding, onComplete]);

  // Scenario 10: Escape key does nothing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-base-900 flex items-center justify-center font-mono">
      <div className="w-full max-w-lg mx-4">
        <div className="piano-surface p-6 space-y-6">
          <StepIndicator current={currentStep} />

          <div className="wing-enter">
            <StepContent step={currentStep} onComplete={onComplete} />
          </div>

          {currentStep < 4 && (
            <div className="text-center">
              <button
                type="button"
                className="text-xs text-text-muted hover:text-text-secondary transition-colors underline"
                onClick={handleSkip}
              >
                {t('skip')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
