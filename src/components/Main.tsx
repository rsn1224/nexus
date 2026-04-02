import { X } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import type { ActiveTab, QuickPanel } from '../stores/useUiStore';
import { useUiStore } from '../stores/useUiStore';
import ActionStrip from './actions/ActionStrip';
import DiagnosticBanner from './diagnostic/DiagnosticBanner';
import FooterBar from './layout/FooterBar';
import OptimizeSection from './optimize/OptimizeSection';
import HistoryPanel from './panels/HistoryPanel';
import { QuickPanelContent } from './panels/QuickPanels';
import SettingsPanel from './panels/SettingsPanel';
import KpiGrid from './system/KpiGrid';
import RevertDialog from './ui/RevertDialog';
import BoostView from './views/BoostView';
import MonitorView from './views/MonitorView';

const TAB_LABELS: Record<ActiveTab, string> = {
  optimize: 'Optimize',
  monitor: 'Monitor',
  boost: 'Boost',
};

const PANEL_TITLES: Record<QuickPanel, string> = {
  game: 'GAME',
  display: 'DISPLAY',
  security: 'WINDOWS',
  modules: 'MODULES',
};

const TABS: ActiveTab[] = ['optimize', 'monitor', 'boost'];

const Main = memo(function Main(): React.ReactElement {
  const {
    isRevertDialogOpen,
    openRevertDialog,
    activeTab,
    setActiveTab,
    activeQuickPanel,
    setActiveQuickPanel,
  } = useUiStore();

  return (
    <>
      <main className="flex-1 min-h-0 flex flex-col gap-3 px-4 py-3 overflow-hidden">
        {/* Layer 1: 常時監視 KPI */}
        <KpiGrid />

        {/* Layer 2: 診断アラート（異常時のみ） */}
        <DiagnosticBanner />

        {/* Layer 3: タブバー */}
        <div className="nx-tabs shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`nx-tab${activeTab === tab ? ' nx-tab--active' : ''}`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Layer 4: タブコンテンツ */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activeTab === 'optimize' && <OptimizeSection onRevert={openRevertDialog} />}
          {activeTab === 'monitor' && <MonitorView />}
          {activeTab === 'boost' && <BoostView />}
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

      {/* Quick Actions フローティングパネル */}
      {activeQuickPanel && (
        <>
          <div
            className="nx-overlay"
            onClick={() => setActiveQuickPanel(null)}
            aria-hidden="true"
          />
          <div
            className="nx-panel bottom-[72px] left-4 right-4"
            role="dialog"
            aria-label={PANEL_TITLES[activeQuickPanel]}
          >
            <div className="nx-panel-hd">
              <span className="nx-panel-ttl">{PANEL_TITLES[activeQuickPanel]}</span>
              <button
                type="button"
                className="nx-panel-x"
                onClick={() => setActiveQuickPanel(null)}
                aria-label="パネルを閉じる"
              >
                <X size={12} />
              </button>
            </div>
            <QuickPanelContent panel={activeQuickPanel} />
          </div>
        </>
      )}
    </>
  );
});

export default Main;
