import type React from 'react';
import { useState } from 'react';
import { useInitialData, useStateSync } from '../../hooks/useInitialData';
import { testApiKey } from '../../services/perplexityService';
import { useAppSettings } from '../../stores/useAppSettingsStore';
import { ErrorBanner } from '../ui';
import Button from '../ui/Button';

const APP_VERSION = '0.1.0';

export default function GeneralTab(): React.ReactElement {
  const { settings, isLoading, error, fetchSettings, saveSettings, updateSettings } =
    useAppSettings();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  useInitialData(() => fetchSettings(), [fetchSettings]);

  useStateSync(() => {
    if (settings) {
      setApiKeyInput(settings.perplexityApiKey);
      setTestResult(null);
    }
  }, [settings]);

  const handleSaveApiKey = async (): Promise<void> => {
    if (!settings) return;
    setIsSavingKey(true);
    try {
      await saveSettings({ ...settings, perplexityApiKey: apiKeyInput });
      setTestResult({ valid: true, message: '保存しました' });
    } catch (err) {
      setTestResult({ valid: false, message: err instanceof Error ? err.message : '保存に失敗' });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleTestApiKey = async (): Promise<void> => {
    if (!apiKeyInput.trim()) {
      setTestResult({ valid: false, message: 'APIキーが空です' });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);
    try {
      await saveSettings({
        ...settings,
        perplexityApiKey: apiKeyInput,
        startWithWindows: settings?.startWithWindows ?? false,
        minimizeToTray: settings?.minimizeToTray ?? true,
      });
      const result = await testApiKey();
      setTestResult({
        valid: result.ok,
        message: result.ok ? 'APIキーは有効です（保存済み）' : result.error,
      });
    } catch (err) {
      setTestResult({
        valid: false,
        message: err instanceof Error ? err.message : 'テストに失敗しました',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleToggleStartWithWindows = async (): Promise<void> => {
    if (!settings) return;
    await updateSettings({ startWithWindows: !settings.startWithWindows });
  };

  const handleToggleMinimizeToTray = async (): Promise<void> => {
    if (!settings) return;
    await updateSettings({ minimizeToTray: !settings.minimizeToTray });
  };

  const buildDate = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
      {error && <ErrorBanner message={`ERROR: ${error}`} />}

      {/* API Section */}
      <div className="glass-panel bloom-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-white/30">api</span>
          <h3 className="text-[10px] tracking-widest text-white/60 uppercase">API</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="api-key" className="text-xs text-white/60 block mb-2">
              Perplexity API Key
            </label>
            <div className="flex items-center gap-2">
              <input
                id="api-key"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-per-******************"
                className="flex-1 bg-white/5 border border-white/10 text-text-primary font-data text-xs px-3 py-2 rounded-lg focus:border-accent-500/50 focus:outline-none"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveApiKey}
                disabled={isSavingKey || isLoading}
              >
                {isSavingKey ? 'SAVING...' : 'SAVE'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestApiKey}
                disabled={isTestingKey}
              >
                {isTestingKey ? 'TESTING...' : 'TEST'}
              </Button>
            </div>
          </div>
          {testResult && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div
                className={`w-2 h-2 rounded-full ${testResult.valid ? 'bg-accent-500' : 'bg-danger-500'}`}
              />
              <span
                className={`text-xs font-data ${testResult.valid ? 'text-accent-500' : 'text-danger-500'}`}
              >
                {testResult.valid ? 'VALID' : 'INVALID'}
              </span>
              <span className="text-xs text-white/60 font-data">— {testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* APPLICATION Section */}
      <div className="glass-panel bloom-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-white/30">settings_applications</span>
          <h3 className="text-[10px] tracking-widest text-white/60 uppercase">APPLICATION</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <div className="text-xs text-white/60 font-data">Start with Windows</div>
              <div className="text-[9px] text-white/40 mt-1">Launch NEXUS on system startup</div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${settings?.startWithWindows ? 'bg-accent-500' : 'bg-white/30'}`}
              />
              <span className="text-xs text-text-primary font-data">
                {settings?.startWithWindows ? 'ENABLED' : 'DISABLED'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToggleStartWithWindows}
                disabled={isLoading}
              >
                TOGGLE
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <div className="text-xs text-white/60 font-data">Minimize to Tray</div>
              <div className="text-[9px] text-white/40 mt-1">Keep running in system tray</div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${settings?.minimizeToTray ? 'bg-accent-500' : 'bg-white/30'}`}
              />
              <span className="text-xs text-text-primary font-data">
                {settings?.minimizeToTray ? 'ENABLED' : 'DISABLED'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToggleMinimizeToTray}
                disabled={isLoading}
              >
                TOGGLE
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ABOUT Section */}
      <div className="glass-panel bloom-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-white/30">info</span>
          <h3 className="text-[10px] tracking-widest text-white/60 uppercase">ABOUT</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span className="text-xs text-white/60 font-data">Version</span>
            <span className="text-xs text-accent-500 font-data">{APP_VERSION}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span className="text-xs text-white/60 font-data">Built</span>
            <span className="text-xs text-accent-500 font-data">{buildDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
