import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { useGameProfileActions, useGameProfileState } from '../../stores/useGameProfileStore';

// ─── コアセルコンポーネント ──────────────────────────────────────────────────

interface CoreCellProps {
  index: number;
  type: 'p-core' | 'e-core' | 'unknown';
  selected: boolean;
  onToggle: (index: number) => void;
}

function CoreCell({ index, type, selected, onToggle }: CoreCellProps): React.ReactElement {
  const bgColor = useMemo(() => {
    if (selected) {
      return type === 'p-core' ? 'bg-cyan-500' : 'bg-accent-500';
    }
    return 'bg-base-700';
  }, [selected, type]);

  const textColor = selected ? 'text-base-900' : 'text-text-muted';

  return (
    <button
      type="button"
      data-testid={`core-cell-${index}`}
      onClick={() => onToggle(index)}
      className={`w-8 h-8 rounded-[2px] flex items-center justify-center font-mono text-[9px] cursor-pointer border-none ${bgColor} ${textColor} hover:opacity-80`}
      title={`コア ${index}（${type === 'p-core' ? 'P-Core' : type === 'e-core' ? 'E-Core' : 'コア'}）${selected ? ' ✓' : ''}`}
    >
      {index}
    </button>
  );
}

// ─── AffinityPanel メイン ────────────────────────────────────────────────────

interface AffinityPanelProps {
  label: string;
  selectedCores: number[];
  onChange: (cores: number[]) => void;
  className?: string;
}

export default function AffinityPanel({
  label,
  selectedCores,
  onChange,
  className = '',
}: AffinityPanelProps): React.ReactElement {
  const { cpuTopology } = useGameProfileState();
  const { getCpuTopology } = useGameProfileActions();

  // 初回にトポロジーを取得
  useEffect(() => {
    if (!cpuTopology) {
      void getCpuTopology();
    }
  }, [cpuTopology, getCpuTopology]);

  const handleToggle = useCallback(
    (index: number) => {
      const newCores = selectedCores.includes(index)
        ? selectedCores.filter((c) => c !== index)
        : [...selectedCores, index].sort((a, b) => a - b);
      onChange(newCores);
    },
    [selectedCores, onChange],
  );

  const handleSelectAll = useCallback(() => {
    if (!cpuTopology) return;
    const allCores = Array.from({ length: cpuTopology.logicalCores }, (_, i) => i);
    onChange(allCores);
  }, [cpuTopology, onChange]);

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleSelectPCores = useCallback(() => {
    if (!cpuTopology) return;
    onChange([...cpuTopology.pCores].sort((a, b) => a - b));
  }, [cpuTopology, onChange]);

  const handleSelectECores = useCallback(() => {
    if (!cpuTopology) return;
    if (cpuTopology.eCores.length === 0) return;
    onChange([...cpuTopology.eCores].sort((a, b) => a - b));
  }, [cpuTopology, onChange]);

  // コアの種別を判定
  const getCoreType = useCallback(
    (index: number): 'p-core' | 'e-core' | 'unknown' => {
      if (!cpuTopology) return 'unknown';
      if (cpuTopology.pCores.includes(index)) return 'p-core';
      if (cpuTopology.eCores.includes(index)) return 'e-core';
      return 'unknown';
    },
    [cpuTopology],
  );

  if (!cpuTopology) {
    return (
      <div className={`font-mono text-[10px] text-text-muted ${className}`}>
        CPU 情報を取得中...
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* ラベル */}
      <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">{label}</span>

      {/* CPU 情報 */}
      <div className="font-mono text-[9px] text-text-muted">
        {cpuTopology.brand} — {cpuTopology.physicalCores}C/{cpuTopology.logicalCores}T
        {cpuTopology.eCores.length > 0 && (
          <span>
            {' '}
            （P: {cpuTopology.pCores.length} / E: {cpuTopology.eCores.length}）
          </span>
        )}
      </div>

      {/* クイック選択ボタン */}
      <div className="flex gap-1 flex-wrap">
        <button
          type="button"
          onClick={handleSelectAll}
          className="font-mono text-[9px] px-2 py-0.5 bg-base-700 text-text-muted border-none rounded-[2px] cursor-pointer hover:text-text-primary"
        >
          全選択
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          className="font-mono text-[9px] px-2 py-0.5 bg-base-700 text-text-muted border-none rounded-[2px] cursor-pointer hover:text-text-primary"
        >
          全解除
        </button>
        {cpuTopology.pCores.length > 0 && cpuTopology.eCores.length > 0 && (
          <>
            <button
              type="button"
              onClick={handleSelectPCores}
              className="font-mono text-[9px] px-2 py-0.5 bg-base-700 text-cyan-500 border-none rounded-[2px] cursor-pointer"
            >
              P-Core のみ
            </button>
            <button
              type="button"
              onClick={handleSelectECores}
              className="font-mono text-[9px] px-2 py-0.5 bg-base-700 text-accent-500 border-none rounded-[2px] cursor-pointer"
            >
              E-Core のみ
            </button>
          </>
        )}
      </div>

      {/* コアマップ */}
      <div className="flex flex-wrap gap-1" data-testid="core-map">
        {Array.from({ length: cpuTopology.logicalCores }, (_, i) => {
          const coreId = `core-${cpuTopology.vendorId}-${i}`;
          return (
            <CoreCell
              key={coreId}
              index={i}
              type={getCoreType(i)}
              selected={selectedCores.includes(i)}
              onToggle={handleToggle}
            />
          );
        })}
      </div>

      {/* 凡例 */}
      {cpuTopology.eCores.length > 0 && (
        <div className="flex gap-3 font-mono text-[9px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-cyan-500 rounded-[1px] inline-block" />
            P-Core
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-accent-500 rounded-[1px] inline-block" />
            E-Core
          </span>
        </div>
      )}

      {/* 選択状態 */}
      <div className="font-mono text-[9px] text-text-muted">
        選択中: {selectedCores.length} / {cpuTopology.logicalCores} コア
        {selectedCores.length > 0 && <span> [{selectedCores.join(', ')}]</span>}
      </div>
    </div>
  );
}
