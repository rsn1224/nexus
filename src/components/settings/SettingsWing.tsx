import { invoke } from '@tauri-apps/api/core';
import type React from 'react';
import { useState } from 'react';
import { useInitialData, useStateSync } from '../../hooks/useInitialData';
import log from '../../lib/logger';
import { testApiKey } from '../../services/perplexityService';
import { useAppSettings } from '../../stores/useAppSettingsStore';
import type { RevertAllResult, RevertItem } from '../../types';
import WinoptTab from '../performance/WinoptTab';
import { ErrorBanner, TabBar } from '../ui';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import WindowsSettingsTab from '../windows/WindowsSettingsTab';

const settingsTabs = [
  { id: 'app', label: 'アプリ設定' },
  { id: 'windows', label: 'Windows 設定' },
  { id: 'winopt', label: 'Windows 最適化' },
];

export default function SettingsWing(): React.ReactElement {
  const { settings, isLoading, error, fetchSettings, saveSettings, updateSettings } =
    useAppSettings();

  const [activeTab, setActiveTab] = useState<'app' | 'windows' | 'winopt'>('app');

  // Local state for API key input and test result
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Maintenance state
  const [isReverting, setIsReverting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [revertResult, setRevertResult] = useState<RevertAllResult | null>(null);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  // 初回データフェッチ
  useInitialData(() => fetchSettings(), [fetchSettings]);

  // 設定変更時にローカル状態を同期
  useStateSync(() => {
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
      // まずAPIキーを保存
      await saveSettings({
        ...settings,
        perplexityApiKey: apiKeyInput,
        startWithWindows: settings?.startWithWindows ?? false,
        minimizeToTray: settings?.minimizeToTray ?? true,
      });

      // 保存したAPIキーでテスト
      const result = await testApiKey();
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

  const handleRevertAll = async (): Promise<void> => {
    setIsReverting(true);
    setRevertResult(null);
    try {
      const result = await invoke<RevertAllResult>('revert_all_settings');
      setRevertResult(result);
    } catch (err) {
      log.error({ err }, 'settings: revert failed');
    } finally {
      setIsReverting(false);
    }
  };

  const handleCleanupRequest = (): void => {
    setShowCleanupConfirm(true);
  };

  const handleCleanupConfirm = async (): Promise<void> => {
    setShowCleanupConfirm(false);
    setIsCleaning(true);
    try {
      // 1. まず全設定リバート
      const revertRes = await invoke<RevertAllResult>('revert_all_settings');
      // 2. 次にデータ削除
      const cleanupItems = await invoke<RevertItem[]>('cleanup_app_data');
      // 結合して表示
      setRevertResult({
        items: [...revertRes.items, ...cleanupItems],
        total: revertRes.total + cleanupItems.length,
        successCount: revertRes.successCount + cleanupItems.filter((i) => i.success).length,
        failCount: revertRes.failCount + cleanupItems.filter((i) => !i.success).length,
      });
    } catch (err) {
      log.error({ err }, 'settings: cleanup failed');
    } finally {
      setIsCleaning(false);
    }
  };

  // Get app version and build date from package.json
  const appVersion = '0.1.0'; // This should come from package.json in a real implementation
  const buildDate = new Date().toISOString().split('T')[0]; // Placeholder

  // Error banner (inline)
  const errorBanner = error ? <ErrorBanner message={`ERROR: ${error}`} /> : null;

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-[11px] text-accent-500 font-bold tracking-widest">
          ▶ SETTINGS
        </div>
        {activeTab === 'app' && (
          <Button variant="primary" size="sm" onClick={handleSaveAll} disabled={isLoading}>
            SAVE ALL
          </Button>
        )}
      </div>

      {/* Tab Bar */}
      <TabBar
        tabs={settingsTabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as typeof activeTab)}
        className="mb-4"
      />

      {/* Windows 設定タブ */}
      {activeTab === 'windows' && (
        <div className="flex-1 overflow-hidden -m-4">
          <WindowsSettingsTab />
        </div>
      )}

      {/* Windows 最適化タブ */}
      {activeTab === 'winopt' && (
        <div className="flex-1 overflow-y-auto">
          <WinoptTab />
        </div>
      )}

      {/* アプリ設定タブ */}
      {activeTab === 'app' && (
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
          {/* Error Banner */}
          {errorBanner}

          {/* API Section */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
            <div className="font-mono text-[10px] text-text-muted mb-2">API</div>
            <div className="space-y-2">
              <div className="font-mono text-[11px] text-text-secondary">Perplexity API Key</div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-per-******************"
                  className="flex-1 bg-base-700 border border-border-subtle text-text-primary font-mono text-[11px] px-2 py-1 rounded"
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
                      testResult.valid ? 'bg-success-500' : 'bg-danger-500'
                    }`}
                  />
                  <span
                    className={`font-mono text-[10px] ${
                      testResult.valid ? 'text-success-500' : 'text-danger-500'
                    }`}
                  >
                    {testResult.valid ? 'VALID' : 'INVALID'}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    — {testResult.message}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* APPLICATION Section */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
            <div className="font-mono text-[10px] text-text-muted mb-2">APPLICATION</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[11px] text-text-secondary">Start with Windows</div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      settings?.startWithWindows ? 'bg-success-500' : 'bg-text-muted'
                    }`}
                  />
                  <span className="font-mono text-[11px] text-text-primary">
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
                <div className="font-mono text-[11px] text-text-secondary">Minimize to Tray</div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      settings?.minimizeToTray ? 'bg-success-500' : 'bg-text-muted'
                    }`}
                  />
                  <span className="font-mono text-[11px] text-text-primary">
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

          {/* MAINTENANCE Section */}
          <div className="bg-base-800 border border-border-subtle rounded p-3 mb-4">
            <div className="font-mono text-[10px] text-text-muted mb-2">MAINTENANCE</div>
            <div className="space-y-3">
              {/* 全設定リバート */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[11px] text-text-secondary">全設定リバート</div>
                  <div className="font-mono text-[10px] text-text-muted">
                    nexus が変更した Windows 設定を全て元に戻します
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRevertAll}
                  disabled={isReverting}
                  loading={isReverting}
                >
                  ↩ REVERT ALL
                </Button>
              </div>

              {/* 区切り線 */}
              <div className="border-t border-border-subtle" />

              {/* アプリデータ削除 */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[11px] text-danger-500">アプリデータ削除</div>
                  <div className="font-mono text-[10px] text-text-muted">
                    プロファイル・設定・API キーを完全に削除します
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCleanupRequest}
                  disabled={isCleaning}
                  loading={isCleaning}
                >
                  ✕ DELETE ALL DATA
                </Button>
              </div>
            </div>

            {/* リバート結果表示 */}
            {revertResult && (
              <div className="mt-3 border-t border-border-subtle pt-3">
                <div className="font-mono text-[10px] text-text-muted mb-1">
                  RESULT: {revertResult.successCount} 成功 / {revertResult.failCount} 失敗
                </div>
                {revertResult.items.map((item) => (
                  <div
                    key={`${item.category}-${item.label}`}
                    className="flex items-center gap-2 font-mono text-[10px]"
                  >
                    <span className={item.success ? 'text-success-500' : 'text-danger-500'}>
                      {item.success ? '✓' : '✗'}
                    </span>
                    <span className="text-text-secondary">[{item.category}]</span>
                    <span className="text-text-primary">{item.label}</span>
                    <span className="text-text-muted">— {item.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ABOUT Section */}
          <div className="bg-base-800 border border-border-subtle rounded p-3">
            <div className="font-mono text-[10px] text-text-muted mb-2">ABOUT</div>
            <div className="space-y-1">
              <div className="font-mono text-[11px] text-text-secondary">Version: {appVersion}</div>
              <div className="font-mono text-[11px] text-text-secondary">Built: {buildDate}</div>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Confirmation Modal */}
      <Modal
        isOpen={showCleanupConfirm}
        onClose={() => setShowCleanupConfirm(false)}
        title="⚠ データ削除の確認"
        size="md"
      >
        <div className="space-y-3">
          <div className="font-mono text-[11px] text-text-primary">
            以下のデータが完全に削除されます：
          </div>
          <ul className="list-disc list-inside space-y-1 font-mono text-[10px] text-text-secondary">
            <li>ゲームプロファイル (profiles.json)</li>
            <li>アプリ設定 (app_settings.json)</li>
            <li>Windows 設定バックアップ (winopt_backup.json)</li>
            <li>API キー (keyring)</li>
          </ul>
          <div className="font-mono text-[10px] text-danger-500">⚠ この操作は元に戻せません</div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => setShowCleanupConfirm(false)}>
            CANCEL
          </Button>
          <Button variant="danger" size="sm" onClick={handleCleanupConfirm} loading={isCleaning}>
            DELETE ALL DATA
          </Button>
        </div>
      </Modal>
    </div>
  );
}
