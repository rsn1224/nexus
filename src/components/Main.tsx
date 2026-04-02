import type React from 'react';
import { memo } from 'react';
import { useUiStore } from '../stores/useUiStore';
import ActionStrip from './actions/ActionStrip';
import DiagnosticBanner from './diagnostic/DiagnosticBanner';
import FooterBar from './layout/FooterBar';
import OptimizeSection from './optimize/OptimizeSection';
import HistoryPanel from './panels/HistoryPanel';
import SettingsPanel from './panels/SettingsPanel';
import KpiGrid from './system/KpiGrid';
import RevertDialog from './ui/RevertDialog';

const Main = memo(function Main(): React.ReactElement {
  const { isRevertDialogOpen, openRevertDialog } = useUiStore();

  return (
    <>
      <main className="flex-1 min-h-0 flex flex-col gap-3 px-4 py-3 overflow-hidden">
        {/* Layer 1: 常時監視 KPI */}
        <KpiGrid />

        {/* Layer 2: 診断アラート（異常時のみ） */}
        <DiagnosticBanner />

        {/* Layer 3: 最適化操作 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <OptimizeSection onRevert={openRevertDialog} />
        </div>

        {/* クイックアクション */}
        <ActionStrip />

        {/* フッター */}
        <FooterBar />
      </main>

      {/* スライドパネル */}
      <SettingsPanel />
      <HistoryPanel />

      {/* リバート確認ダイアログ */}
      {isRevertDialogOpen && <RevertDialog />}
    </>
  );
});

export default Main;
