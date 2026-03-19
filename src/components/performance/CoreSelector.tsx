import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { CpuTopology } from '../../types';

interface CoreCellProps {
  index: number;
  type: 'p-core' | 'e-core' | 'unknown';
  selected: boolean;
  onToggle: (index: number) => void;
}

function CoreCell({ index, type, selected, onToggle }: CoreCellProps): React.ReactElement {
  const bgColor = useMemo(() => {
    if (selected) return 'bg-accent-500';
    return 'bg-base-700';
  }, [selected]);

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

interface CoreSelectorProps {
  cpuTopology: CpuTopology;
  selectedCores: number[];
  onToggle: (index: number) => void;
}

export default function CoreSelector({
  cpuTopology,
  selectedCores,
  onToggle,
}: CoreSelectorProps): React.ReactElement {
  const getCoreType = useCallback(
    (index: number): 'p-core' | 'e-core' | 'unknown' => {
      if (cpuTopology.pCores.includes(index)) return 'p-core';
      if (cpuTopology.eCores.includes(index)) return 'e-core';
      return 'unknown';
    },
    [cpuTopology],
  );

  return (
    <>
      <div className="flex flex-wrap gap-1" data-testid="core-map">
        {Array.from({ length: cpuTopology.logicalCores }, (_, i) => {
          const coreId = `core-${cpuTopology.vendorId}-${i}`;
          return (
            <CoreCell
              key={coreId}
              index={i}
              type={getCoreType(i)}
              selected={selectedCores.includes(i)}
              onToggle={onToggle}
            />
          );
        })}
      </div>

      {cpuTopology.eCores.length > 0 && (
        <div className="flex gap-3 text-[9px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-accent-500 rounded-[1px] inline-block" />
            P-Core
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-accent-500 rounded-[1px] inline-block" />
            E-Core
          </span>
        </div>
      )}

      <div className="text-[9px] text-text-muted">
        選択中: {selectedCores.length} / {cpuTopology.logicalCores} コア
        {selectedCores.length > 0 && <span> [{selectedCores.join(', ')}]</span>}
      </div>
    </>
  );
}
