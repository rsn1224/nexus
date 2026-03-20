import type React from 'react';
import { memo, useCallback, useState } from 'react';
import CompleteStep from './CompleteStep';
import ReadinessSummaryStep from './ReadinessSummaryStep';
import type { ScanResult } from './ScanStep';
import ScanStep from './ScanStep';
import WelcomeStep from './WelcomeStep';

type Step = 1 | 2 | 3 | 4;

interface Props {
  onComplete: () => void;
}

const STEP_COUNT = 4;

const OnboardingWizard = memo(function OnboardingWizard({ onComplete }: Props): React.ReactElement {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const goToStep = useCallback((step: Step): void => {
    setCurrentStep(step);
  }, []);

  const handleScanComplete = useCallback((result: ScanResult): void => {
    setScanResult(result);
    setCurrentStep(3);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-base-900 flex flex-col items-center justify-center">
      {/* Step Indicator */}
      <div className="flex gap-2 mb-8">
        {Array.from({ length: STEP_COUNT }, (_, i) => {
          const stepNum = (i + 1) as Step;
          const dotClass =
            stepNum < currentStep
              ? 'bg-success-500'
              : stepNum === currentStep
                ? 'bg-accent-500'
                : 'bg-base-600';
          return <div key={stepNum} className={`w-2 h-2 rounded-full ${dotClass}`} />;
        })}
      </div>

      {/* Card */}
      <div className="glass-panel bloom-border rounded-lg p-8 w-full max-w-lg mx-4">
        {currentStep === 1 && <WelcomeStep onNext={() => goToStep(2)} onSkip={onComplete} />}
        {currentStep === 2 && <ScanStep onNext={handleScanComplete} onSkip={onComplete} />}
        {currentStep === 3 && scanResult && (
          <ReadinessSummaryStep
            scanResult={scanResult}
            onNext={() => goToStep(4)}
            onSkip={onComplete}
          />
        )}
        {currentStep === 4 && <CompleteStep onComplete={onComplete} />}
      </div>

      {/* Step label */}
      <div className="mt-6 text-[10px] font-mono text-text-muted uppercase tracking-widest">
        STEP {currentStep} / {STEP_COUNT}
      </div>
    </div>
  );
});

export default OnboardingWizard;
