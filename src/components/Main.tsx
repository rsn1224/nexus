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
        <div className="flex gap-px bg-base-900 border border-border-subtle rounded p-0.5 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                'flex-1 py-1.5 px-2 text-[10px] font-bold tracking-[0.12em] uppercase rounded-sm cursor-pointer transition-colors',
                activeTab === tab
                  ? 'text-accent-400 bg-accent-500/10'
                  : 'text-text-muted bg-transparent hover:text-text-secondary hover:bg-white/4',
              ].join(' ')}
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
            className="fixed inset-0 bg-base-950/70 backdrop-blur-sm z-40 cursor-default"
            onClick={() => setActiveQuickPanel(null)}
            aria-hidden="true"
          />
          <div
            className="absolute bg-base-700 border border-border-subtle rounded z-50 bottom-18 left-4 right-4"
            role="dialog"
            aria-label={PANEL_TITLES[activeQuickPanel]}
          >
            <div className="flex items-center justify-between px-3.5 pt-2.5 pb-2 border-b border-border-subtle">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent-500">
                {PANEL_TITLES[activeQuickPanel]}
              </span>
              <button
                type="button"
                className="flex items-center justify-center w-5 h-5 text-text-muted rounded transition-colors hover:text-text-primary hover:bg-white/4"
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
