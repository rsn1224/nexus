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
      <div className="bg-base-800 border border-border-subtle rounded-lg p-3">
        <div className="text-xs text-text-muted mb-2">API</div>
        <div className="space-y-2">
          <div className="text-xs text-text-secondary">Perplexity API Key</div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-per-******************"
              className="flex-1 bg-base-700 border border-border-subtle text-text-primary font-mono text-xs px-2 py-1 rounded-lg"
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
          {testResult && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${testResult.valid ? 'bg-success-500' : 'bg-danger-500'}`}
              />
              <span
                className={`text-xs ${testResult.valid ? 'text-success-500' : 'text-danger-500'}`}
              >
                {testResult.valid ? 'VALID' : 'INVALID'}
              </span>
              <span className="text-xs text-text-muted">— {testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* APPLICATION Section */}
      <div className="bg-base-800 border border-border-subtle rounded-lg p-3">
        <div className="text-xs text-text-muted mb-2">APPLICATION</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-secondary">Start with Windows</div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${settings?.startWithWindows ? 'bg-success-500' : 'bg-text-muted'}`}
              />
              <span className="text-xs text-text-primary">
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
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-secondary">Minimize to Tray</div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${settings?.minimizeToTray ? 'bg-success-500' : 'bg-text-muted'}`}
              />
              <span className="text-xs text-text-primary">
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
      <div className="bg-base-800 border border-border-subtle rounded-lg p-3">
        <div className="text-xs text-text-muted mb-2">ABOUT</div>
        <div className="space-y-1">
          <div className="text-xs text-text-secondary">Version: {APP_VERSION}</div>
          <div className="text-xs text-text-secondary">Built: {buildDate}</div>
        </div>
      </div>
    </div>
  );
}
