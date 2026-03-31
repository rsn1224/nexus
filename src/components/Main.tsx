import type React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useOptimizeStore } from '../stores/useOptimizeStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useSystemStore } from '../stores/useSystemStore';
import Diagnostics from './Diagnostics';
import HistoryPanel from './HistoryPanel';
import Optimizations from './Optimizations';
import QuickInfo from './QuickInfo';
import SettingsPanel from './SettingsPanel';
import SystemStatus from './SystemStatus';
import Button from './ui/Button';

const REVERT_COUNTDOWN_SECS = 3;

const Main = memo(function Main(): React.ReactElement {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revertConfirm, setRevertConfirm] = useState(false);
  const [revertCountdown, setRevertCountdown] = useState(REVERT_COUNTDOWN_SECS);
  const revertTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useSystemStore((s) => s.startPolling);
  const stopPolling = useSystemStore((s) => s.stopPolling);
  const fetchCandidates = useOptimizeStore((s) => s.fetchCandidates);
  const fetchHistory = useOptimizeStore((s) => s.fetchHistory);
  const revertAll = useOptimizeStore((s) => s.revertAll);
  const isReverting = useOptimizeStore((s) => s.isReverting);
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

  const startRevertConfirm = useCallback(() => {
    setRevertConfirm(true);
    setRevertCountdown(REVERT_COUNTDOWN_SECS);
    revertTimerRef.current = setInterval(() => {
      setRevertCountdown((c) => {
        if (c <= 1) {
          clearInterval(revertTimerRef.current ?? undefined);
          revertTimerRef.current = null;
          setRevertConfirm(false);
          return REVERT_COUNTDOWN_SECS;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const handleRevertConfirmed = useCallback(async () => {
    if (revertTimerRef.current) {
      clearInterval(revertTimerRef.current);
      revertTimerRef.current = null;
    }
    setRevertConfirm(false);
    await revertAll();
    void fetchCandidates();
  }, [revertAll, fetchCandidates]);

  return (
    <main className="pt-16 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col gap-4 px-4 py-4 pb-10 overflow-y-auto [scrollbar-gutter:stable]">
        <SystemStatus />
        <Diagnostics />
        <Optimizations />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 h-8 border-t border-border-subtle bg-base-900 flex items-center justify-between px-4 gap-2 z-10">
        <QuickInfo />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleOpenHistory}>
            HISTORY
          </Button>
          <Button variant="ghost" size="sm" onClick={handleOpenSettings}>
            SETTINGS
          </Button>
          {revertConfirm ? (
            <Button
              variant="danger"
              size="sm"
              loading={isReverting}
              onClick={() => void handleRevertConfirmed()}
            >
              CONFIRM ({revertCountdown}s)
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled={isReverting} onClick={startRevertConfirm}>
              REVERT ALL
            </Button>
          )}
        </div>
      </footer>

      <SettingsPanel isOpen={settingsOpen} onClose={handleCloseSettings} />
      <HistoryPanel isOpen={historyOpen} onClose={handleCloseHistory} />
    </main>
  );
});

export default Main;
