import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '../../stores/useOnboardingStore';
import Button from '../ui/Button';

export default function WelcomeStep(): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const nextStep = useOnboardingStore((s) => s.nextStep);

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <div className="text-3xl font-bold text-accent-500 tracking-widest">
          {t('welcome.title')}
        </div>
        <div className="text-xs text-text-muted uppercase tracking-wider">
          {t('welcome.subtitle')}
        </div>
      </div>

      <div className="space-y-3 text-text-secondary text-xs leading-relaxed">
        <p>{t('welcome.description1')}</p>
        <p>{t('welcome.description2')}</p>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={nextStep}>
        {t('welcome.begin')}
      </Button>
    </div>
  );
}
