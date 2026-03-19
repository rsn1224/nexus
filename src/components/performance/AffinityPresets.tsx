import type React from 'react';
import { useCallback } from 'react';
import type { CpuTopology } from '../../types';

interface AffinityPresetsProps {
  cpuTopology: CpuTopology;
  onChange: (cores: number[]) => void;
}

export default function AffinityPresets({
  cpuTopology,
  onChange,
}: AffinityPresetsProps): React.ReactElement {
  const handleSelectAll = useCallback(() => {
    const allCores = Array.from({ length: cpuTopology.logicalCores }, (_, i) => i);
    onChange(allCores);
  }, [cpuTopology, onChange]);

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleSelectPCores = useCallback(() => {
    onChange([...cpuTopology.pCores].sort((a, b) => a - b));
  }, [cpuTopology, onChange]);

  const handleSelectECores = useCallback(() => {
    if (cpuTopology.eCores.length === 0) return;
    onChange([...cpuTopology.eCores].sort((a, b) => a - b));
  }, [cpuTopology, onChange]);

  return (
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
            className="font-mono text-[9px] px-2 py-0.5 bg-base-700 text-accent-500 border-none rounded-[2px] cursor-pointer"
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
  );
}
