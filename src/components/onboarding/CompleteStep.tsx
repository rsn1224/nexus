import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import Button from '../ui/Button';

export default function CompleteStep({
  onComplete,
}: {
  onComplete: () => void;
}): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <div className="text-2xl font-bold text-success-500">{t('complete.title')}</div>
        <div className="text-xs text-text-muted">{t('complete.subtitle')}</div>
      </div>

      <div className="space-y-2 text-text-secondary text-xs leading-relaxed">
        <p>{t('complete.description1')}</p>
        <p>{t('complete.description2')}</p>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleComplete}>
        {t('complete.goToDashboard')}
      </Button>
    </div>
  );
}
