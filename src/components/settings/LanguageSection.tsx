import type React from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { STORAGE_KEY } from '../../i18n/config';
import Button from '../ui/Button';

export default function LanguageSection(): React.ReactElement {
  const { t } = useTranslation('settings');

  return (
    <div className="glass-panel bloom-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-white/30" aria-hidden="true">
          language
        </span>
        <h3 className="text-[10px] tracking-widest text-white/60 uppercase">
          {t('general.language')}
        </h3>
      </div>
      <div className="flex gap-3">
        {(['ja', 'en'] as const).map((lang) => {
          const isActive = i18n.language === lang || i18n.language.startsWith(`${lang}-`);
          return (
            <Button
              key={lang}
              variant={isActive ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                void i18n.changeLanguage(lang);
                localStorage.setItem(STORAGE_KEY, lang);
              }}
            >
              {lang === 'ja' ? t('general.languageJa') : t('general.languageEn')}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
