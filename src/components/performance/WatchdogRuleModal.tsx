import { useWatchdogRuleForm } from '../../hooks/useWatchdogRuleForm';
import type { WatchdogRule } from '../../types';
import Button from '../ui/Button';
import WatchdogConditionsSection from './WatchdogConditionsSection';
import WatchdogFilterSection from './WatchdogFilterSection';

interface WatchdogRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: WatchdogRule) => void;
  editingRule?: WatchdogRule | null;
}

const labelClass = 'block mb-1 text-[10px] font-bold uppercase text-text-secondary';
const inputClass =
  'w-full px-2 py-2 border border-border-subtle rounded bg-base-800 text-text-primary font-mono text-[12px]';

export function WatchdogRuleModal({
  isOpen,
  onClose,
  onSave,
  editingRule,
}: WatchdogRuleModalProps) {
  const {
    rule,
    validationError,
    handleSave,
    updateRule,
    updateCondition,
    addCondition,
    removeCondition,
    addIncludeName,
    removeIncludeName,
    addExcludeName,
    removeExcludeName,
  } = useWatchdogRuleForm(editingRule, onSave, onClose);

  if (!isOpen) return null;

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
            {validationError && (
              <div className="text-danger-500 text-[10px] font-mono mt-1">⚠ {validationError}</div>
            )}
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
          <WatchdogConditionsSection
            conditions={rule.conditions}
            onAdd={addCondition}
            onRemove={removeCondition}
            onUpdate={updateCondition}
          />

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
          <WatchdogFilterSection
            processFilter={rule.processFilter}
            onAddInclude={addIncludeName}
            onRemoveInclude={removeIncludeName}
            onAddExclude={addExcludeName}
            onRemoveExclude={removeExcludeName}
          />

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
