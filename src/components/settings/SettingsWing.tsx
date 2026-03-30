import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavStore } from '../../stores/useNavStore';
import { ErrorBoundary } from '../ui';
import ApiKeySection from './ApiKeySection';
import HardwareConfigTree from './HardwareConfigTree';
import UiCustomizeSection from './UiCustomizeSection';
import WindowsSettingsTab from './WindowsSettingsTab';

export default function SettingsWing(): React.ReactElement {
  const { t } = useTranslation('settings');
  const activeTab = useNavStore(
    (s) => (s.wingStates.settings.activeTab ?? 'app') as 'app' | 'windows',
  );

  const [neonIntensity, setNeonIntensity] = useState(88);
  const [aiRendering, setAiRendering] = useState(true);
  const [autoPowerOpt, setAutoPowerOpt] = useState(false);

  return (
    <div className="min-h-screen bg-base-900 p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scanline-overlay"></div>
        <div className="scanning-line animate-pulse opacity-20"></div>
        <div className="absolute top-[20%] left-[20%] w-96 h-96 rounded-full bg-accent-500/2 blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 rounded-full bg-warning-500/1 blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="mb-14 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-px w-12 bg-accent-500"></div>
              <span className="font-label text-accent-500 text-[10px] tracking-[0.3em] font-bold">
                CONFIGURATION_MODULE_07
              </span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-text-primary mb-2">
              {t('title')}
            </h1>
            <p className="font-label text-text-secondary/40 text-[10px] tracking-[0.2em] uppercase">
              System Locale: JA_JP {/* */} {/* Encryption Protocol: AES-256-GCM */}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative group">
              <span className="absolute -top-5 right-0 font-label text-[8px] text-warning-500/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-widest">
                {t('restorePointAvailable')}
              </span>
              <button
                type="button"
                className="relative group px-6 py-2.5 border border-text-secondary/20 text-text-secondary/60 hover:text-warning-500 hover:border-warning-500/50 font-label text-[10px] tracking-widest uppercase transition-all bg-white/2 glass-panel"
              >
                <div className="hud-btn-scan"></div>
                {t('restoreAll')}
              </button>
            </div>
            <div className="relative group">
              <span className="absolute -top-5 right-0 font-label text-[8px] text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse whitespace-nowrap tracking-widest">
                {t('rootApproved')}
              </span>
              <button
                type="button"
                className="relative px-8 py-2.5 bg-accent-500/10 border border-accent-500 text-accent-500 font-black text-[10px] tracking-widest uppercase transition-all hover:bg-accent-500/20 glass-panel"
              >
                <div className="scanning-line animate-pulse opacity-20"></div>
                {t('saveSettings')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-6 px-6 pt-4 border-b border-white/5 relative z-10">
        {[
          { id: 'app', i18nKey: 'appConfig' as const },
          { id: 'windows', i18nKey: 'windows.title' as const },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => useNavStore.getState().setTab('settings', tab.id)}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-accent-500 text-text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-white/20'
            }`}
          >
            <span className="text-sm font-bold tracking-tight uppercase">{t(tab.i18nKey)}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'app' && (
        <ErrorBoundary name={t('appConfig')}>
          <div className="relative z-10">
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">
              {/* UI Customization */}
              <div className="md:col-span-12 lg:col-span-7">
                <UiCustomizeSection
                  neonIntensity={neonIntensity}
                  setNeonIntensity={setNeonIntensity}
                  aiRendering={aiRendering}
                  setAiRendering={setAiRendering}
                  autoPowerOpt={autoPowerOpt}
                  setAutoPowerOpt={setAutoPowerOpt}
                />
              </div>

              {/* API Key Security */}
              <div className="md:col-span-12 lg:col-span-5">
                <ApiKeySection />
              </div>

              {/* Hardware System Tree */}
              <div className="md:col-span-12">
                <HardwareConfigTree />
              </div>
            </div>
          </div>
        </ErrorBoundary>
      )}

      {activeTab === 'windows' && (
        <ErrorBoundary name={t('windows.title')}>
          <div className="flex-1 overflow-hidden relative z-10">
            <WindowsSettingsTab />
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
}
