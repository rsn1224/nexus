import type React from 'react';
import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import logger from '../../lib/logger';
import type { LogLevelFilter } from '../../stores/useLogStore';
import { formatTimestamp, truncateMessage, useLogData } from '../../stores/useLogStore';
import { Button } from '../ui';

export default function LogWing(): React.ReactElement {
  const {
    logs,
    filteredLogs,
    analysis,
    isLoading,
    error,
    selectedLevel,
    selectedSource,
    searchQuery,
    uniqueSources,
    logCounts,
    hasLogs,
    hasFilteredLogs,
    getSystemLogs,
    getApplicationLogs,
    analyzeLogs,
    exportLogs,
    setSelectedLevel,
    setSelectedSource,
    setSearchQuery,
    clearLogs,
    clearError,
  } = useLogData();

  const [appName, setAppName] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportResult, setExportResult] = useState<string | null>(null);

  useEffect(() => {
    // 初期ロード時にシステムログを取得
    void getSystemLogs();
  }, [getSystemLogs]);

  const handleExport = async () => {
    try {
      const filePath = await exportLogs(exportFormat);
      setExportResult(filePath);
    } catch (err) {
      logger.error('Export failed:', err);
    }
  };

  const handleLevelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLevel(e.target.value as LogLevelFilter);
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
        return 'text-[var(--color-danger-500)]';
      case 'Warn':
        return 'text-[var(--color-accent-500)]';
      case 'Info':
        return 'text-[var(--color-cyan-500)]';
      default:
        return 'text-[var(--color-text-muted)]';
    }
  };

  const getLevelDotClass = (level: string) => {
    switch (level) {
      case 'Error':
        return 'bg-[var(--color-danger-500)]';
      case 'Warn':
        return 'bg-[var(--color-accent-500)]';
      case 'Info':
        return 'bg-[var(--color-cyan-500)]';
      default:
        return 'bg-[var(--color-text-muted)]';
    }
  };

  const handleAppLogs = () => {
    if (appName.trim()) {
      void getApplicationLogs(appName.trim());
    }
  };

  const handleRefresh = () => {
    void getSystemLogs();
  };

  const handleAnalyze = () => {
    void analyzeLogs();
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Error':
        return '❌';
      case 'Warn':
        return '⚠️';
      case 'Info':
        return 'ℹ️';
      case 'Debug':
        return '🐛';
      default:
        return '📄';
    }
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] mb-2">
          LOG MANAGEMENT
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          {/* Level Filter */}
          <div>
            <label
              htmlFor="log-level-filter"
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)] block mb-1"
            >
              LEVEL
            </label>
            <select
              id="log-level-filter"
              value={selectedLevel}
              onChange={handleLevelChange}
              className="w-full bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] rounded px-2 py-1 font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)]"
            >
              <option value="All">All</option>
              <option value="Error">Error</option>
              <option value="Warn">Warning</option>
              <option value="Info">Info</option>
              <option value="Debug">Debug</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label
              htmlFor="log-source-filter"
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)] block mb-1"
            >
              SOURCE
            </label>
            <select
              id="log-source-filter"
              value={selectedSource}
              onChange={handleSourceChange}
              className="w-full bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] rounded px-2 py-1 font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)]"
            >
              <option value="">All Sources</option>
              {uniqueSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label
              htmlFor="log-search"
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)] block mb-1"
            >
              SEARCH
            </label>
            <input
              id="log-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search logs..."
              className="w-full bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] rounded px-2 py-1 font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
            />
          </div>

          {/* Export Format */}
          <div>
            <label
              htmlFor="log-export-format"
              className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)] block mb-1"
            >
              EXPORT
            </label>
            <select
              id="log-export-format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
              className="w-full bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] rounded px-2 py-1 font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)]"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          {exportResult && (
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-success-500)] mt-2">
              Exported: {exportResult}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isLoading}>
            REFRESH
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAnalyze}
            disabled={isLoading || !hasLogs}
          >
            ANALYZE
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={isLoading || !hasLogs}
          >
            EXPORT
          </Button>
          <Button variant="secondary" size="sm" onClick={clearLogs} disabled={!hasLogs}>
            CLEAR
          </Button>
        </div>
      </div>

      {/* Application Logs */}
      <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
          APPLICATION LOGS
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Application name..."
            className="flex-1 bg-[var(--color-base-700)] border border-[var(--color-border-subtle)] rounded px-2 py-1 font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAppLogs}
            disabled={!appName.trim() || isLoading}
          >
            FETCH
          </Button>
        </div>
      </div>

      {/* Log Analysis */}
      {analysis && (
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            ANALYSIS RESULTS
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
            <div className="text-center">
              <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-text-primary)] font-bold">
                {analysis.totalEntries}
              </div>
              <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)]">
                TOTAL
              </div>
            </div>
            <div className="text-center">
              <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-danger-500)] font-bold">
                {analysis.errorCount}
              </div>
              <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)]">
                ERRORS
              </div>
            </div>
            <div className="text-center">
              <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-accent-500)] font-bold">
                {analysis.warningCount}
              </div>
              <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)]">
                WARNINGS
              </div>
            </div>
            <div className="text-center">
              <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-cyan-500)] font-bold">
                {analysis.infoCount}
              </div>
              <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)]">
                INFO
              </div>
            </div>
            <div className="text-center">
              <div className="font-[var(--font-mono)] text-[12px] text-[var(--color-text-muted)] font-bold">
                {analysis.debugCount}
              </div>
              <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)]">
                DEBUG
              </div>
            </div>
          </div>
          <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)] mb-1">
            TIME RANGE: {analysis.timeRange}
          </div>
          <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)]">
            TOP SOURCES:{' '}
            {analysis.topSources.map(([source, count]) => `${source} (${count})`).join(', ')}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-[var(--color-danger-500)] bg-opacity-10 border border-[var(--color-danger-500)] rounded p-3 mb-4">
          <div className="flex justify-between items-center">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-danger-500)]">
              ERROR: {error}
            </div>
            <Button variant="secondary" size="sm" onClick={clearError}>
              DISMISS
            </Button>
          </div>
        </div>
      )}

      {/* Log Counts */}
      {hasLogs && (
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3 mb-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            LOG COUNTS
          </div>
          <div className="flex gap-4">
            {Object.entries(logCounts).map(([level, count]) => (
              <div key={level} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getLevelDotClass(level)}`} />
                <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)]">
                  {level}: {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs List */}
      {hasFilteredLogs ? (
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] mb-2">
            LOGS ({filteredLogs.length} of {logs.length})
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={`${log.timestamp}-${log.source}-${log.message.slice(0, 20)}`}
                className="border-b border-[var(--color-border-subtle)] pb-2 last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px]">{getLevelIcon(log.level)}</span>
                    <div className={`w-2 h-2 rounded-full ${getLevelDotClass(log.level)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-[var(--font-mono)] text-[9px] font-bold ${getLevelTextClass(log.level)}`}
                      >
                        {log.level}
                      </span>
                      <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-secondary)]">
                        {log.source}
                      </span>
                      <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)]">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)] break-words">
                      {truncateMessage(log.message, 200)}
                    </div>
                    {(log.processId || log.threadId) && (
                      <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] mt-1">
                        {log.processId && `PID: ${log.processId}`}
                        {log.processId && log.threadId && ' | '}
                        {log.threadId && `TID: ${log.threadId}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] text-center">
            {hasLogs ? 'No logs match current filters' : 'No logs available'}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-[var(--color-base-950)] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded p-4">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-primary)]">
              Loading logs...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
