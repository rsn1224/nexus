import type React from 'react';
import { useCallback, useEffect } from 'react';
import { useGameProfileActions, useGameProfileState } from '../../stores/useGameProfileStore';
import AffinityPresets from './AffinityPresets';
import CoreSelector from './CoreSelector';

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

  if (!cpuTopology) {
    return <div className={`text-xs text-text-muted ${className}`}>CPU 情報を取得中...</div>;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="text-xs text-text-muted">{label}</span>

      <div className="text-xs text-text-muted">
        {cpuTopology.brand} — {cpuTopology.physicalCores}C/{cpuTopology.logicalCores}T
        {cpuTopology.eCores.length > 0 && (
          <span>
            {' '}
            （P: {cpuTopology.pCores.length} / E: {cpuTopology.eCores.length}）
          </span>
        )}
      </div>

      <AffinityPresets cpuTopology={cpuTopology} onChange={onChange} />

      <CoreSelector
        cpuTopology={cpuTopology}
        selectedCores={selectedCores}
        onToggle={handleToggle}
      />
    </div>
  );
}
