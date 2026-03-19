import type React from 'react';
import { useState } from 'react';
import type { ProcessFilter } from '../../types';
import Button from '../ui/Button';

interface WatchdogFilterSectionProps {
  processFilter: ProcessFilter;
  onAddInclude: (name: string) => void;
  onRemoveInclude: (index: number) => void;
  onAddExclude: (name: string) => void;
  onRemoveExclude: (index: number) => void;
}

function AddNameInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (name: string) => void;
}): React.ReactElement {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <div className="flex gap-1 mb-1">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder={placeholder}
        className="flex-1 bg-base-800 border border-border-subtle text-text-primary text-xs px-2 py-1 rounded-lg"
      />
      <Button variant="ghost" onClick={handleAdd} disabled={!value.trim()}>
        + ADD
      </Button>
    </div>
  );
}

export default function WatchdogFilterSection({
  processFilter,
  onAddInclude,
  onRemoveInclude,
  onAddExclude,
  onRemoveExclude,
}: WatchdogFilterSectionProps): React.ReactElement {
  return (
    <div>
      <span className="block mb-2 text-xs font-bold uppercase text-text-secondary">
        PROCESS FILTER
      </span>

      <div className="mb-3">
        <span className="text-xs text-text-primary mb-1 block">
          INCLUDE NAMES (empty = all processes)
        </span>
        <AddNameInput placeholder="プロセス名を入力..." onAdd={onAddInclude} />
        {processFilter.includeNames.map((name, index) => (
          <div
            key={`include-${name}`}
            className="flex justify-between items-center px-2 py-1 bg-base-800 border border-border-subtle rounded-lg mb-1"
          >
            <span className="text-xs text-text-primary">{name}</span>
            <Button variant="danger" onClick={() => onRemoveInclude(index)}>
              DELETE
            </Button>
          </div>
        ))}
      </div>

      <div>
        <span className="text-xs text-text-primary mb-1 block">EXCLUDE NAMES</span>
        <AddNameInput placeholder="除外プロセス名を入力..." onAdd={onAddExclude} />
        {processFilter.excludeNames.map((name, index) => (
          <div
            key={`exclude-${name}`}
            className="flex justify-between items-center px-2 py-1 bg-base-800 border border-border-subtle rounded-lg mb-1"
          >
            <span className="text-xs text-text-primary">{name}</span>
            <Button variant="danger" onClick={() => onRemoveExclude(index)}>
              DELETE
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
