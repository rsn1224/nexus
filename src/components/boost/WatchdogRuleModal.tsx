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

export function WatchdogRuleModal({
  isOpen,
  onClose,
  onSave,
  editingRule,
}: WatchdogRuleModalProps) {
  const [rule, setRule] = useState<WatchdogRule>(() => {
    if (editingRule) {
      return { ...editingRule };
    }
    return {
      id: `rule-${Date.now()}`,
      name: '',
      enabled: true,
      conditions: [
        {
          metric: 'cpuPercent',
          operator: 'greaterThan',
          threshold: 50,
        },
      ],
      action: 'suspend',
      processFilter: {
        includeNames: [],
        excludeNames: [],
      },
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
        {
          metric: 'cpuPercent',
          operator: 'greaterThan',
          threshold: 50,
        },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setRule((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateFilter = (updates: Partial<ProcessFilter>) => {
    setRule((prev) => ({
      ...prev,
      processFilter: { ...prev.processFilter, ...updates },
    }));
  };

  const addIncludeName = () => {
    const name = prompt('Enter process name to include:');
    if (name?.trim()) {
      updateFilter({
        includeNames: [...rule.processFilter.includeNames, name.trim()],
      });
    }
  };

  const removeIncludeName = (index: number) => {
    updateFilter({
      includeNames: rule.processFilter.includeNames.filter((_, i) => i !== index),
    });
  };

  const addExcludeName = () => {
    const name = prompt('Enter process name to exclude:');
    if (name?.trim()) {
      updateFilter({
        excludeNames: [...rule.processFilter.excludeNames, name.trim()],
      });
    }
  };

  const removeExcludeName = (index: number) => {
    updateFilter({
      excludeNames: rule.processFilter.excludeNames.filter((_, i) => i !== index),
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-background)',
          padding: '24px',
          borderRadius: '8px',
          minWidth: '700px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
        }}
      >
        <h2
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            color: 'var(--color-text-primary)',
          }}
        >
          {editingRule ? 'EDIT RULE' : 'ADD RULE'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Basic Info */}
          <div>
            <label
              htmlFor="modal-rule-name"
              style={{
                display: 'block',
                marginBottom: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
              }}
            >
              RULE NAME
            </label>
            <input
              id="modal-rule-name"
              type="text"
              value={rule.name}
              onChange={(e) => updateRule({ name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
              placeholder="Enter rule name..."
            />
          </div>

          {/* Enabled Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="modal-rule-enabled"
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) => updateRule({ enabled: e.target.checked })}
              style={{ accentColor: 'var(--color-accent-500)' }}
            />
            <label
              htmlFor="modal-rule-enabled"
              style={{
                fontSize: '12px',
                color: 'var(--color-text-primary)',
              }}
            >
              ENABLED
            </label>
          </div>

          {/* Conditions */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                }}
              >
                CONDITIONS (AND)
              </span>
              <Button variant="ghost" onClick={addCondition}>
                + ADD
              </Button>
            </div>

            {rule.conditions.map((condition, index) => (
              <div
                key={`${condition.metric}-${condition.operator}-${condition.threshold}`}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  padding: '8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  marginBottom: '8px',
                }}
              >
                <select
                  value={condition.metric}
                  onChange={(e) =>
                    updateCondition(index, { metric: e.target.value as WatchdogMetric })
                  }
                  style={{
                    padding: '4px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                  }}
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
                  style={{
                    padding: '4px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                  }}
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
                  style={{
                    width: '80px',
                    padding: '4px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                  }}
                />

                <Button variant="danger" onClick={() => removeCondition(index)}>
                  DELETE
                </Button>
              </div>
            ))}
          </div>

          {/* Action */}
          <div>
            <label
              htmlFor="modal-rule-action"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
              }}
            >
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
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              <option value="suspend">SUSPEND</option>
              <option value="terminate">TERMINATE</option>
              <option value="setPriority">SET PRIORITY</option>
              <option value="setAffinity">SET AFFINITY</option>
            </select>
          </div>

          {/* Action Details */}
          {typeof rule.action === 'object' && 'setPriority' in rule.action && (
            <div>
              <label
                htmlFor="modal-rule-priority"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                }}
              >
                PRIORITY LEVEL
              </label>
              <select
                id="modal-rule-priority"
                value={rule.action.setPriority.level}
                onChange={(e) =>
                  updateRule({
                    action: { setPriority: { level: e.target.value } },
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                }}
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
            <span
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
              }}
            >
              PROCESS FILTER
            </span>

            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                  INCLUDE NAMES (empty = all processes)
                </span>
                <Button variant="ghost" onClick={addIncludeName}>
                  + ADD
                </Button>
              </div>
              {rule.processFilter.includeNames.map((name, index) => (
                <div
                  key={`include-${name}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                    {name}
                  </span>
                  <Button variant="danger" onClick={() => removeIncludeName(index)}>
                    DELETE
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                  EXCLUDE NAMES
                </span>
                <Button variant="ghost" onClick={addExcludeName}>
                  + ADD
                </Button>
              </div>
              {rule.processFilter.excludeNames.map((name, index) => (
                <div
                  key={`exclude-${name}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    marginBottom: '4px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--color-text-primary)' }}>
                    {name}
                  </span>
                  <Button variant="danger" onClick={() => removeExcludeName(index)}>
                    DELETE
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Cooldown */}
          <div>
            <label
              htmlFor="modal-rule-cooldown"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
              }}
            >
              COOLDOWN (SECONDS)
            </label>
            <input
              id="modal-rule-cooldown"
              type="number"
              min="0"
              value={rule.cooldownSecs}
              onChange={(e) => updateRule({ cooldownSecs: parseInt(e.target.value, 10) || 0 })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            marginTop: '24px',
          }}
        >
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
