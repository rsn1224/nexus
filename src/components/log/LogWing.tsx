import type React from 'react';
import type { ChangeEvent } from 'react';
import { useMemo } from 'react';
import { useInitialData } from '../../hooks/useInitialData';
import { useLogActions, useLogState } from '../../stores/useLogStore';
import { Card, EmptyState, ErrorBanner } from '../ui';
import LogActions from './LogActions';
import { LogAnalysisPanel } from './LogAnalysisPanel';
import LogEntries from './LogEntries';
import LogFilters from './LogFilters';
import LogStats from './LogStats';

export default function LogWing(): React.ReactElement {
  const logState = useLogState();
  const logActions = useLogActions();

  const { logs, analysis, isLoading, error, selectedLevel, selectedSource, searchQuery } = logState;

  const {
    getSystemLogs,
    getApplicationLogs,
    analyzeLogs,
    exportLogs,
    setSelectedLevel,
    setSelectedSource,
    setSearchQuery,
    clearLogs,
    clearError,
  } = logActions;

  // 導出データを useMemo で計算
  const derivedData = useMemo(() => {
    // Filtered logs based on current filters
    const filteredLogs = logs.filter((log) => {
      // Level filter
      if (selectedLevel !== 'All' && log.level !== selectedLevel) {
        return false;
      }

      // Source filter
      if (selectedSource && log.source !== selectedSource) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(query) ||
          log.source.toLowerCase().includes(query) ||
          log.timestamp.toLowerCase().includes(query)
        );
      }

      return true;
    });

    // Get unique sources for dropdown
    const uniqueSources = Array.from(new Set(logs.map((log) => log.source))).sort();

    // Get log counts by level
    const logCounts = logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      filteredLogs,
      uniqueSources,
      logCounts,
      hasLogs: logs.length > 0,
      hasFilteredLogs: filteredLogs.length > 0,
    };
  }, [logs, selectedLevel, selectedSource, searchQuery]);

  // 変数を分解
  const { filteredLogs, uniqueSources, logCounts, hasLogs, hasFilteredLogs } = derivedData;

  // 初回データフェッチ
  useInitialData(() => getSystemLogs(), [getSystemLogs]);

  const handleLevelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLevel(e.target.value as 'All' | 'Error' | 'Warn' | 'Info' | 'Debug');
  };

  const handleSourceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedSource(e.target.value);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getLevelTextClass = (level: string) => {
    switch (level) {
      case 'Error':
        return 'text-danger-500';
      case 'Warn':
        return 'text-accent-500';
      case 'Info':
        return 'text-accent-500';
      default:
        return 'text-text-muted';
    }
  };

  const getLevelDotClass = (level: string) => {
    switch (level) {
      case 'Error':
        return 'bg-danger-500';
      case 'Warn':
        return 'bg-accent-500';
      case 'Info':
        return 'bg-accent-500';
      default:
        return 'bg-text-muted';
    }
  };

  const handleRefresh = () => {
    void getSystemLogs();
  };

  const handleAnalyze = () => {
    void analyzeLogs();
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="font-mono text-[11px] text-text-muted mb-2">LOG MANAGEMENT</div>
      </div>

      {/* Controls */}
      <Card className="mb-4">
        <LogFilters
          selectedLevel={selectedLevel}
          selectedSource={selectedSource}
          searchQuery={searchQuery}
          uniqueSources={uniqueSources}
          onLevelChange={handleLevelChange}
          onSourceChange={handleSourceChange}
          onSearchChange={handleSearchChange}
        />
      </Card>

      {/* Stats */}
      {hasLogs && (
        <LogStats
          logCounts={logCounts}
          totalLogs={logs.length}
          filteredLogs={filteredLogs.length}
        />
      )}

      {/* Actions */}
      <Card className="mb-4">
        <LogActions
          onRefresh={handleRefresh}
          onClear={clearLogs}
          onAnalyze={handleAnalyze}
          onExport={exportLogs}
          onGetAppLogs={getApplicationLogs}
          isLoading={isLoading}
        />
      </Card>

      {/* Error Display */}
      {error && <ErrorBanner message={`Error: ${error}`} onDismiss={clearError} />}

      {/* Logs Display */}
      <Card>
        {hasFilteredLogs ? (
          <div className="max-h-96 overflow-y-auto">
            <LogEntries
              logs={filteredLogs}
              getLevelTextClass={getLevelTextClass}
              getLevelDotClass={getLevelDotClass}
            />
          </div>
        ) : hasLogs ? (
          <EmptyState message="No logs match current filters" />
        ) : (
          <EmptyState message="No logs available" />
        )}
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card className="mt-4">
          <LogAnalysisPanel analysis={analysis} />
        </Card>
      )}
    </div>
  );
}
