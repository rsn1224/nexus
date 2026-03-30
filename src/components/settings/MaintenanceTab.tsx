import { invoke } from '@tauri-apps/api/core';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import log from '../../lib/logger';
import type { RevertAllResult, RevertItem } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function MaintenanceTab(): React.ReactElement {
  const { t } = useTranslation(['settings', 'common']);
  const [isReverting, setIsReverting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [revertResult, setRevertResult] = useState<RevertAllResult | null>(null);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const handleRevertConfirm = async (): Promise<void> => {
    setShowRevertConfirm(false);
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

  const handleCleanupConfirm = async (): Promise<void> => {
    setShowCleanupConfirm(false);
    setIsCleaning(true);
    try {
      const revertRes = await invoke<RevertAllResult>('revert_all_settings');
      const cleanupItems = await invoke<RevertItem[]>('cleanup_app_data');
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

  return (
    <>
      <div className="bg-base-800 border border-border-subtle rounded-lg p-3">
        <div className="text-xs text-text-muted mb-2">{t('settings:maintenance.title')}</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-text-secondary">
                {t('settings:maintenance.revertAll')}
              </div>
              <div className="text-xs text-text-muted">
                {t('settings:maintenance.revertAllDesc')}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRevertConfirm(true)}
              disabled={isReverting}
              loading={isReverting}
            >
              {t('settings:maintenance.revertAllBtn')}
            </Button>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-danger-500">
                {t('settings:maintenance.deleteAllData')}
              </div>
              <div className="text-xs text-text-muted">
                {t('settings:maintenance.deleteAllDataDesc')}
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCleanupConfirm(true)}
              disabled={isCleaning}
              loading={isCleaning}
            >
              {t('settings:maintenance.deleteAllDataBtn')}
            </Button>
          </div>
        </div>

        {revertResult && (
          <div className="mt-3 border-t border-border-subtle pt-3">
            <div className="text-xs text-text-muted mb-1">
              {t('settings:maintenance.result')}: {revertResult.successCount}{' '}
              {t('settings:maintenance.successCount')} / {revertResult.failCount}{' '}
              {t('settings:maintenance.failCount')}
            </div>
            {revertResult.items.map((item) => (
              <div
                key={`${item.category}-${item.label}`}
                className="flex items-center gap-2 text-xs"
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

      <Modal
        isOpen={showRevertConfirm}
        onClose={() => setShowRevertConfirm(false)}
        title={t('settings:maintenance.revertConfirmTitle')}
        size="md"
      >
        <div className="space-y-3">
          <div className="text-xs text-text-primary">
            {t('settings:maintenance.revertConfirmDesc')}
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-text-secondary">
            <li>{t('settings:maintenance.revertItems.powerPlan')}</li>
            <li>{t('settings:maintenance.revertItems.gameMode')}</li>
            <li>{t('settings:maintenance.revertItems.gpuScheduling')}</li>
            <li>{t('settings:maintenance.revertItems.visualEffects')}</li>
          </ul>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => setShowRevertConfirm(false)}>
            {t('common:cancel')}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleRevertConfirm} loading={isReverting}>
            {t('settings:maintenance.revertAllBtn')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showCleanupConfirm}
        onClose={() => setShowCleanupConfirm(false)}
        title={t('settings:maintenance.deleteConfirmTitle')}
        size="md"
      >
        <div className="space-y-3">
          <div className="text-xs text-text-primary">
            {t('settings:maintenance.deleteConfirmDesc')}
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-text-secondary">
            <li>{t('settings:maintenance.deleteItems.profiles')}</li>
            <li>{t('settings:maintenance.deleteItems.settings')}</li>
            <li>{t('settings:maintenance.deleteItems.backup')}</li>
            <li>{t('settings:maintenance.deleteItems.apiKey')}</li>
          </ul>
          <div className="text-xs text-danger-500">{t('settings:maintenance.irreversible')}</div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => setShowCleanupConfirm(false)}>
            {t('common:cancel')}
          </Button>
          <Button variant="danger" size="sm" onClick={handleCleanupConfirm} loading={isCleaning}>
            {t('settings:maintenance.deleteAllDataBtn')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
