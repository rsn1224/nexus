import type React from 'react';
import type { ProcessFilter } from '../../types';
import Button from '../ui/Button';

interface WatchdogFilterSectionProps {
  processFilter: ProcessFilter;
  onAddInclude: () => void;
  onRemoveInclude: (index: number) => void;
  onAddExclude: () => void;
  onRemoveExclude: (index: number) => void;
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
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text-primary">INCLUDE NAMES (empty = all processes)</span>
          <Button variant="ghost" onClick={onAddInclude}>
            + ADD
          </Button>
        </div>
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
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text-primary">EXCLUDE NAMES</span>
          <Button variant="ghost" onClick={onAddExclude}>
            + ADD
          </Button>
        </div>
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
