import { invoke } from '@tauri-apps/api/core';
import type React from 'react';
import { useState } from 'react';
import log from '../../lib/logger';
import type { RevertAllResult, RevertItem } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function MaintenanceTab(): React.ReactElement {
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
      <div className="bg-base-800 border border-border-subtle rounded p-3">
        <div className="text-[10px] text-text-muted mb-2">MAINTENANCE</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-text-secondary">全設定リバート</div>
              <div className="text-[10px] text-text-muted">
                nexus が変更した Windows 設定を全て元に戻します
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRevertConfirm(true)}
              disabled={isReverting}
              loading={isReverting}
            >
              ↩ REVERT ALL
            </Button>
          </div>

          <div className="border-t border-border-subtle" />

          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-danger-500">アプリデータ削除</div>
              <div className="text-[10px] text-text-muted">
                プロファイル・設定・API キーを完全に削除します
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCleanupConfirm(true)}
              disabled={isCleaning}
              loading={isCleaning}
            >
              ✕ DELETE ALL DATA
            </Button>
          </div>
        </div>

        {revertResult && (
          <div className="mt-3 border-t border-border-subtle pt-3">
            <div className="text-[10px] text-text-muted mb-1">
              RESULT: {revertResult.successCount} 成功 / {revertResult.failCount} 失敗
            </div>
            {revertResult.items.map((item) => (
              <div
                key={`${item.category}-${item.label}`}
                className="flex items-center gap-2 text-[10px]"
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
        title="⚠ 設定リバートの確認"
        size="md"
      >
        <div className="space-y-3">
          <div className="text-[11px] text-text-primary">
            nexus が変更した以下の Windows 設定を元に戻します：
          </div>
          <ul className="list-disc list-inside space-y-1 text-[10px] text-text-secondary">
            <li>電源プラン</li>
            <li>ゲームモード / フルスクリーン最適化</li>
            <li>ハードウェア GPU スケジューリング</li>
            <li>視覚効果設定</li>
          </ul>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => setShowRevertConfirm(false)}>
            CANCEL
          </Button>
          <Button variant="secondary" size="sm" onClick={handleRevertConfirm} loading={isReverting}>
            ↩ REVERT ALL
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showCleanupConfirm}
        onClose={() => setShowCleanupConfirm(false)}
        title="⚠ データ削除の確認"
        size="md"
      >
        <div className="space-y-3">
          <div className="text-[11px] text-text-primary">以下のデータが完全に削除されます：</div>
          <ul className="list-disc list-inside space-y-1 text-[10px] text-text-secondary">
            <li>ゲームプロファイル (profiles.json)</li>
            <li>アプリ設定 (app_settings.json)</li>
            <li>Windows 設定バックアップ (winopt_backup.json)</li>
            <li>API キー (keyring)</li>
          </ul>
          <div className="text-[10px] text-danger-500">⚠ この操作は元に戻せません</div>
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
    </>
  );
}
