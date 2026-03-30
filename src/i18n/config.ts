import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import arsenalEn from './locales/en/arsenal.json';
import commonEn from './locales/en/common.json';
import coreEn from './locales/en/core.json';
import layoutEn from './locales/en/layout.json';
import logsEn from './locales/en/logs.json';
import onboardingEn from './locales/en/onboarding.json';
import settingsEn from './locales/en/settings.json';
import tacticsEn from './locales/en/tactics.json';
import arsenalJa from './locales/ja/arsenal.json';
import commonJa from './locales/ja/common.json';
import coreJa from './locales/ja/core.json';
import layoutJa from './locales/ja/layout.json';
import logsJa from './locales/ja/logs.json';
import onboardingJa from './locales/ja/onboarding.json';
import settingsJa from './locales/ja/settings.json';
import tacticsJa from './locales/ja/tactics.json';

const STORAGE_KEY = 'nexus:locale';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        layout: layoutEn,
        onboarding: onboardingEn,
        settings: settingsEn,
        core: coreEn,
        arsenal: arsenalEn,
        tactics: tacticsEn,
        logs: logsEn,
      },
      ja: {
        common: commonJa,
        layout: layoutJa,
        onboarding: onboardingJa,
        settings: settingsJa,
        core: coreJa,
        arsenal: arsenalJa,
        tactics: tacticsJa,
        logs: logsJa,
      },
    },
    defaultNS: 'common',
    ns: ['common', 'layout', 'onboarding', 'settings', 'core', 'arsenal', 'tactics', 'logs'],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
export { STORAGE_KEY };
