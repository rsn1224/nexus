import type React from 'react';
import { useEffect, useState } from 'react';
import { testApiKey } from '../../services/perplexityService';
import { useAppSettings } from '../../stores/useAppSettingsStore';
import { Button } from '../ui';

export default function SettingsWing(): React.ReactElement {
  const { settings, isLoading, error, fetchSettings, saveSettings, updateSettings } =
    useAppSettings();

  // Local state for API key input and test result
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Initialize settings on mount
  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  // Sync API key input with current settings
  useEffect(() => {
    if (settings) {
      setApiKeyInput(settings.perplexityApiKey);
      setTestResult(null); // Clear test result when settings change
    }
  }, [settings]);

  const handleTestApiKey = async (): Promise<void> => {
    if (!apiKeyInput.trim()) {
      setTestResult({ valid: false, message: 'APIキーが空です' });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const result = await testApiKey(apiKeyInput);
      setTestResult({
        valid: result.ok,
        message: result.ok ? 'APIキーは有効です' : result.error,
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

  const handleSaveAll = async (): Promise<void> => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      perplexityApiKey: apiKeyInput,
    };

    await saveSettings(updatedSettings);
    setTestResult(null); // Clear test result after saving
  };

  const handleToggleStartWithWindows = async (): Promise<void> => {
    if (!settings) return;
    await updateSettings({ startWithWindows: !settings.startWithWindows });
  };

  const handleToggleMinimizeToTray = async (): Promise<void> => {
    if (!settings) return;
    await updateSettings({ minimizeToTray: !settings.minimizeToTray });
  };

  // Get app version and build date from package.json
  const appVersion = '0.1.0'; // This should come from package.json in a real implementation
  const buildDate = new Date().toISOString().split('T')[0]; // Placeholder

  // Error banner (inline)
  const errorBanner = error ? (
    <div className="px-4 py-2 mb-4 bg-red-500/10 border-b border-red-600 text-red-500 font-[var(--font-mono)] text-[10px] rounded">
      ERROR: {error}
    </div>
  ) : null;

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-cyan-500)] font-bold tracking-widest">
          ▶ SETTINGS / CONFIG
        </div>
        <Button variant="primary" size="sm" onClick={handleSaveAll} disabled={isLoading}>
          SAVE ALL
        </Button>
      </div>

      {/* Error Banner */}
      {errorBanner}

      {/* API Section */}
      <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
          API
        </div>
        <div className="space-y-2">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
            Perplexity API Key
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-per-******************"
              className="flex-1 bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-[var(--font-mono)] text-[11px] px-2 py-1 rounded"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestApiKey}
              disabled={isTestingKey}
            >
              {isTestingKey ? 'TESTING...' : 'TEST'}
            </Button>
          </div>
          {/* Test Result */}
          {testResult && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  testResult.valid
                    ? 'bg-[var(--color-success-500)]'
                    : 'bg-[var(--color-danger-500)]'
                }`}
              />
              <span
                className={`font-[var(--font-mono)] text-[10px] ${
                  testResult.valid
                    ? 'text-[var(--color-success-500)]'
                    : 'text-[var(--color-danger-500)]'
                }`}
              >
                {testResult.valid ? 'VALID' : 'INVALID'}
              </span>
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)]">
                — {testResult.message}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* APPLICATION Section */}
      <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
          APPLICATION
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Start with Windows
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  settings?.startWithWindows
                    ? 'bg-[var(--color-success-500)]'
                    : 'bg-[var(--color-text-muted)]'
                }`}
              />
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
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
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
              Minimize to Tray
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  settings?.minimizeToTray
                    ? 'bg-[var(--color-success-500)]'
                    : 'bg-[var(--color-text-muted)]'
                }`}
              />
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)]">
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
      <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
          ABOUT
        </div>
        <div className="space-y-1">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
            Version: {appVersion}
          </div>
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-secondary)]">
            Built: {buildDate}
          </div>
        </div>
      </div>
    </div>
  );
}
