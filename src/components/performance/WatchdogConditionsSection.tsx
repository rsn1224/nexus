import type React from 'react';
import type { WatchdogCondition, WatchdogMetric, WatchdogOperator } from '../../types';
import Button from '../ui/Button';

const selectSmClass =
  'px-1 py-1 border border-border-subtle rounded bg-base-800 text-text-primary font-mono text-[11px]';

interface WatchdogConditionsSectionProps {
  conditions: WatchdogCondition[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<WatchdogCondition>) => void;
}

export default function WatchdogConditionsSection({
  conditions,
  onAdd,
  onRemove,
  onUpdate,
}: WatchdogConditionsSectionProps): React.ReactElement {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase text-text-secondary">
          CONDITIONS (AND)
        </span>
        <Button variant="ghost" onClick={onAdd}>
          + ADD
        </Button>
      </div>

      {conditions.map((condition, index) => (
        <div
          key={`${condition.metric}-${condition.operator}-${condition.threshold}`}
          className="flex gap-2 items-center p-2 border border-border-subtle rounded mb-2"
        >
          <select
            value={condition.metric}
            onChange={(e) => onUpdate(index, { metric: e.target.value as WatchdogMetric })}
            aria-label="Condition metric"
            className={selectSmClass}
          >
            <option value="cpuPercent">CPU %</option>
            <option value="memoryMb">MEMORY MB</option>
            <option value="diskReadKb">DISK READ KB</option>
            <option value="diskWriteKb">DISK WRITE KB</option>
          </select>

          <select
            value={condition.operator}
            onChange={(e) => onUpdate(index, { operator: e.target.value as WatchdogOperator })}
            aria-label="Condition operator"
            className={selectSmClass}
          >
            <option value="greaterThan">&gt;</option>
            <option value="lessThan">&lt;</option>
            <option value="equals">=</option>
          </select>

          <input
            type="number"
            value={condition.threshold}
            onChange={(e) => onUpdate(index, { threshold: parseFloat(e.target.value) || 0 })}
            aria-label="Condition threshold"
            className="w-20 px-1 py-1 border border-border-subtle rounded bg-base-800 text-text-primary font-mono text-[11px]"
          />

          <Button variant="danger" onClick={() => onRemove(index)}>
            DELETE
          </Button>
        </div>
      ))}
    </div>
  );
}
