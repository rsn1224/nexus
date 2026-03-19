import type React from 'react';
import { Button, Input } from '../ui';

type SortMode = 'name' | 'size' | 'lastPlayed';

interface LauncherControlsProps {
  searchQuery: string;
  sortMode: SortMode;
  autoBoostEnabled: boolean;
  isScanning: boolean;
  onSearchChange: (value: string) => void;
  onSortModeChange: (mode: SortMode) => void;
  onToggleAutoBoost: () => void;
  onScanGames: () => void;
}

export default function LauncherControls({
  searchQuery,
  sortMode,
  autoBoostEnabled,
  isScanning,
  onSearchChange,
  onSortModeChange,
  onToggleAutoBoost,
  onScanGames,
}: LauncherControlsProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      {/* 検索・ソート */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="ゲームを検索..."
          value={searchQuery}
          onChange={onSearchChange}
          size="sm"
          className="flex-1"
        />
        <select
          value={sortMode}
          onChange={(e) => onSortModeChange(e.target.value as SortMode)}
          aria-label="ソート順を選択"
          className="font-mono text-xs bg-base-800 text-text-primary border border-border-subtle px-2 py-1 rounded-lg"
        >
          <option value="name">名前順</option>
          <option value="size">サイズ順</option>
          <option value="lastPlayed">最終プレイ順</option>
        </select>
      </div>

      {/* アクション */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onScanGames}
          disabled={isScanning}
          loading={isScanning}
        >
          {isScanning ? '🔄 スキャン中...' : '🔄 ゲームスキャン'}
        </Button>
        <Button
          variant={autoBoostEnabled ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggleAutoBoost}
        >
          {autoBoostEnabled ? '⚡ AUTO BOOST ON' : '⚡ AUTO BOOST OFF'}
        </Button>
      </div>
    </div>
  );
}
