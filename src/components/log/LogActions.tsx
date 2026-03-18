import type React from 'react';
import { useState } from 'react';
import logger from '../../lib/logger';
import { Button, Input } from '../ui';

interface LogActionsProps {
  onRefresh: () => void;
  onClear: () => void;
  onAnalyze: () => void;
  onExport: (format: 'json' | 'csv') => Promise<string>;
  onGetAppLogs: (appName: string) => void;
  isLoading: boolean;
}

export default function LogActions({
  onRefresh,
  onClear,
  onAnalyze,
  onExport,
  onGetAppLogs,
  isLoading,
}: LogActionsProps): React.ReactElement {
  const [appName, setAppName] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportResult, setExportResult] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const filePath = await onExport(exportFormat);
      setExportResult(filePath);
    } catch (err) {
      logger.error({ msg: 'Export failed', err });
    }
  };

  const handleAppLogs = () => {
    if (appName.trim()) {
      onGetAppLogs(appName.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onRefresh} disabled={isLoading}>
          ↻ 更新
        </Button>
        <Button variant="secondary" size="sm" onClick={onClear}>
          ✕ クリア
        </Button>
        <Button variant="secondary" size="sm" onClick={onAnalyze} disabled={isLoading}>
          ▶ 解析
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="アプリ名..."
          value={appName}
          onChange={setAppName}
          size="sm"
        />
        <Button variant="primary" size="sm" onClick={handleAppLogs} disabled={!appName.trim()}>
          ▶ アプリログ取得
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
          className="font-(--font-mono) text-xs bg-base-800 text-text-primary border border-border-subtle px-2 py-1 rounded"
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </select>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={isLoading}>
          ▶ エクスポート
        </Button>
      </div>

      {exportResult && (
        <div className="font-(--font-mono) text-xs text-success-500">出力先: {exportResult}</div>
      )}
    </div>
  );
}
