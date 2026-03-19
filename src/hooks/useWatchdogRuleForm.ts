import { useState } from 'react';
import type {
  ProcessFilter,
  WatchdogCondition,
  WatchdogMetric,
  WatchdogOperator,
  WatchdogRule,
} from '../types';

export interface UseWatchdogRuleFormResult {
  rule: WatchdogRule;
  handleSave: () => void;
  updateRule: (updates: Partial<WatchdogRule>) => void;
  updateCondition: (index: number, updates: Partial<WatchdogCondition>) => void;
  addCondition: () => void;
  removeCondition: (index: number) => void;
  updateFilter: (updates: Partial<ProcessFilter>) => void;
  addIncludeName: () => void;
  removeIncludeName: (index: number) => void;
  addExcludeName: () => void;
  removeExcludeName: (index: number) => void;
}

const DEFAULT_CONDITION: WatchdogCondition = {
  metric: 'cpuPercent' as WatchdogMetric,
  operator: 'greaterThan' as WatchdogOperator,
  threshold: 50,
};

export function useWatchdogRuleForm(
  editingRule: WatchdogRule | null | undefined,
  onSave: (rule: WatchdogRule) => void,
  onClose: () => void,
): UseWatchdogRuleFormResult {
  const [rule, setRule] = useState<WatchdogRule>(() => {
    if (editingRule) return { ...editingRule };
    return {
      id: `rule-${Date.now()}`,
      name: '',
      enabled: true,
      conditions: [{ ...DEFAULT_CONDITION }],
      action: 'suspend',
      processFilter: { includeNames: [], excludeNames: [] },
      profileId: null,
      cooldownSecs: 30,
      lastTriggeredAt: null,
    };
  });

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
      conditions: [...prev.conditions, { ...DEFAULT_CONDITION }],
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

  return {
    rule,
    handleSave,
    updateRule,
    updateCondition,
    addCondition,
    removeCondition,
    updateFilter,
    addIncludeName,
    removeIncludeName,
    addExcludeName,
    removeExcludeName,
  };
}
