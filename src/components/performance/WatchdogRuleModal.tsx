import { useState } from 'react';
import type {
  ProcessFilter,
  WatchdogCondition,
  WatchdogMetric,
  WatchdogOperator,
  WatchdogRule,
} from '../../types';
import Button from '../ui/Button';

interface WatchdogRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: WatchdogRule) => void;
  editingRule?: WatchdogRule | null;
}

const labelClass = 'block mb-1 text-[10px] font-bold uppercase text-text-secondary';
const inputClass =
  'w-full px-2 py-2 border border-border-subtle rounded bg-base-800 text-text-primary font-mono text-[12px]';
const selectSmClass =
  'px-1 py-1 border border-border-subtle rounded bg-base-800 text-text-primary font-mono text-[11px]';

export function WatchdogRuleModal({
  isOpen,
  onClose,
  onSave,
  editingRule,
}: WatchdogRuleModalProps) {
  const [rule, setRule] = useState<WatchdogRule>(() => {
    if (editingRule) return { ...editingRule };
    return {
      id: `rule-${Date.now()}`,
      name: '',
      enabled: true,
      conditions: [{ metric: 'cpuPercent', operator: 'greaterThan', threshold: 50 }],
      action: 'suspend',
      processFilter: { includeNames: [], excludeNames: [] },
      profileId: null,
      cooldownSecs: 30,
      lastTriggeredAt: null,
    };
  });

  if (!isOpen) return null;

  const handleSave = () => {
    if (!rule.name.trim()) {
      alert('Rule name is required');
      return;
    }
    onSave(rule);
    onClose();
  };

  const updateRule = (updates: Partial<WatchdogRule>) => {
    setRule((prev) => ({ ...prev, ...updates }));
  };

  const updateCondition = (index: number, updates: Partial<WatchdogCondition>) => {
    setRule((prev) => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) => (i === index ? { ...cond, ...updates } : cond)),
    }));
  };

  const addCondition = () => {
    setRule((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { metric: 'cpuPercent', operator: 'greaterThan', threshold: 50 },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setRule((prev) => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== index) }));
  };

  const updateFilter = (updates: Partial<ProcessFilter>) => {
    setRule((prev) => ({ ...prev, processFilter: { ...prev.processFilter, ...updates } }));
  };

  const addIncludeName = () => {
    const name = prompt('Enter process name to include:');
    if (name?.trim())
      updateFilter({ includeNames: [...rule.processFilter.includeNames, name.trim()] });
  };

  const removeIncludeName = (index: number) => {
    updateFilter({ includeNames: rule.processFilter.includeNames.filter((_, i) => i !== index) });
  };

  const addExcludeName = () => {
    const name = prompt('Enter process name to exclude:');
    if (name?.trim())
      updateFilter({ excludeNames: [...rule.processFilter.excludeNames, name.trim()] });
  };

  const removeExcludeName = (index: number) => {
    updateFilter({ excludeNames: rule.processFilter.excludeNames.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000">
      <div className="bg-base-900 p-6 rounded-lg min-w-[700px] max-w-[90vw] max-h-[90vh] overflow-y-auto font-mono text-[12px]">
        <h2 className="mb-6 text-[14px] font-bold uppercase text-text-primary">
          {editingRule ? 'EDIT RULE' : 'ADD RULE'}
        </h2>

        <div className="flex flex-col gap-4">
          {/* Basic Info */}
          <div>
            <label htmlFor="modal-rule-name" className={labelClass}>
              RULE NAME
            </label>
            <input
              id="modal-rule-name"
              type="text"
              value={rule.name}
              onChange={(e) => updateRule({ name: e.target.value })}
              placeholder="Enter rule name..."
              className={inputClass}
            />
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center gap-2">
            <input
              id="modal-rule-enabled"
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) => updateRule({ enabled: e.target.checked })}
              className="accent-accent-500"
            />
            <label htmlFor="modal-rule-enabled" className="text-[12px] text-text-primary">
              ENABLED
            </label>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase text-text-secondary">
                CONDITIONS (AND)
              </span>
              <Button variant="ghost" onClick={addCondition}>
                + ADD
              </Button>
            </div>

            {rule.conditions.map((condition, index) => (
              <div
                key={`${condition.metric}-${condition.operator}-${condition.threshold}`}
                className="flex gap-2 items-center p-2 border border-border-subtle rounded mb-2"
              >
                <select
                  value={condition.metric}
                  onChange={(e) =>
                    updateCondition(index, { metric: e.target.value as WatchdogMetric })
                  }
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
                  onChange={(e) =>
                    updateCondition(index, { operator: e.target.value as WatchdogOperator })
                  }
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
                  onChange={(e) =>
                    updateCondition(index, { threshold: parseFloat(e.target.value) || 0 })
                  }
                  aria-label="Condition threshold"
                  className="w-20 px-1 py-1 border border-border-subtle rounded bg-base-800 text-text-primary font-mono text-[11px]"
                />

                <Button variant="danger" onClick={() => removeCondition(index)}>
                  DELETE
                </Button>
              </div>
            ))}
          </div>

          {/* Action */}
          <div>
            <label htmlFor="modal-rule-action" className={labelClass}>
              ACTION
            </label>
            <select
              id="modal-rule-action"
              value={typeof rule.action === 'string' ? rule.action : 'setPriority'}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'suspend' || value === 'terminate') {
                  updateRule({ action: value });
                } else if (value === 'setPriority') {
                  updateRule({ action: { setPriority: { level: 'normal' } } });
                } else if (value === 'setAffinity') {
                  updateRule({ action: { setAffinity: { cores: [0, 1] } } });
                }
              }}
              className={inputClass}
            >
              <option value="suspend">SUSPEND</option>
              <option value="terminate">TERMINATE</option>
              <option value="setPriority">SET PRIORITY</option>
              <option value="setAffinity">SET AFFINITY</option>
            </select>
          </div>

          {/* Action Details — Priority */}
          {typeof rule.action === 'object' && 'setPriority' in rule.action && (
            <div>
              <label htmlFor="modal-rule-priority" className={labelClass}>
                PRIORITY LEVEL
              </label>
              <select
                id="modal-rule-priority"
                value={rule.action.setPriority.level}
                onChange={(e) => updateRule({ action: { setPriority: { level: e.target.value } } })}
                className={inputClass}
              >
                <option value="low">LOW</option>
                <option value="belowNormal">BELOW NORMAL</option>
                <option value="normal">NORMAL</option>
                <option value="aboveNormal">ABOVE NORMAL</option>
                <option value="high">HIGH</option>
                <option value="realtime">REALTIME</option>
              </select>
            </div>
          )}

          {/* Process Filter */}
          <div>
            <span className="block mb-2 text-[10px] font-bold uppercase text-text-secondary">
              PROCESS FILTER
            </span>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-text-primary">
                  INCLUDE NAMES (empty = all processes)
                </span>
                <Button variant="ghost" onClick={addIncludeName}>
                  + ADD
                </Button>
              </div>
              {rule.processFilter.includeNames.map((name, index) => (
                <div
                  key={`include-${name}`}
                  className="flex justify-between items-center px-2 py-1 bg-base-800 border border-border-subtle rounded mb-1"
                >
                  <span className="text-[11px] text-text-primary">{name}</span>
                  <Button variant="danger" onClick={() => removeIncludeName(index)}>
                    DELETE
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-text-primary">EXCLUDE NAMES</span>
                <Button variant="ghost" onClick={addExcludeName}>
                  + ADD
                </Button>
              </div>
              {rule.processFilter.excludeNames.map((name, index) => (
                <div
                  key={`exclude-${name}`}
                  className="flex justify-between items-center px-2 py-1 bg-base-800 border border-border-subtle rounded mb-1"
                >
                  <span className="text-[11px] text-text-primary">{name}</span>
                  <Button variant="danger" onClick={() => removeExcludeName(index)}>
                    DELETE
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Cooldown */}
          <div>
            <label htmlFor="modal-rule-cooldown" className={labelClass}>
              COOLDOWN (SECONDS)
            </label>
            <input
              id="modal-rule-cooldown"
              type="number"
              min="0"
              value={rule.cooldownSecs}
              onChange={(e) => updateRule({ cooldownSecs: parseInt(e.target.value, 10) || 0 })}
              className={inputClass}
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-2 justify-end mt-6">
          <Button variant="ghost" onClick={onClose}>
            CANCEL
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {editingRule ? 'UPDATE' : 'CREATE'}
          </Button>
        </div>
      </div>
    </div>
  );
}
