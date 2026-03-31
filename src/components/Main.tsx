import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useOptimizeStore } from '../stores/useOptimizeStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useSystemStore } from '../stores/useSystemStore';
import Diagnostics from './Diagnostics';
import HistoryPanel from './HistoryPanel';
import Optimizations from './Optimizations';
import QuickInfo from './QuickInfo';
import SettingsPanel from './SettingsPanel';
import SystemStatus from './SystemStatus';

const Main = memo(function Main(): React.ReactElement {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const startPolling = useSystemStore((s) => s.startPolling);
  const stopPolling = useSystemStore((s) => s.stopPolling);
  const fetchCandidates = useOptimizeStore((s) => s.fetchCandidates);
  const fetchHistory = useOptimizeStore((s) => s.fetchHistory);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    startPolling();
    void fetchCandidates();
    void fetchHistory();
    void fetchSettings();
    return () => stopPolling();
  }, [startPolling, stopPolling, fetchCandidates, fetchHistory, fetchSettings]);

  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);
  const handleOpenHistory = useCallback(() => setHistoryOpen(true), []);
  const handleCloseHistory = useCallback(() => setHistoryOpen(false), []);

  return (
    <main className="pt-16 h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col gap-4 px-4 py-4 overflow-y-auto">
        <QuickInfo onOpenSettings={handleOpenSettings} onOpenHistory={handleOpenHistory} />
        <Diagnostics />
        <SystemStatus />
        <Optimizations />
      </div>

      <SettingsPanel isOpen={settingsOpen} onClose={handleCloseSettings} />
      <HistoryPanel isOpen={historyOpen} onClose={handleCloseHistory} />
    </main>
  );
});

export default Main;
