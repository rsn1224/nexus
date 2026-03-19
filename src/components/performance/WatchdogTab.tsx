import { useEffect, useState } from 'react';
import { formatTime } from '../../lib/formatters';
import {
  useWatchdogActions,
  useWatchdogError,
  useWatchdogEvents,
  useWatchdogLoading,
  useWatchdogRules,
} from '../../stores/useWatchdogStore';
import type { WatchdogAction, WatchdogRule } from '../../types';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import ErrorBanner from '../ui/ErrorBanner';
import LoadingFallback from '../ui/LoadingFallback';
import SectionHeader from '../ui/SectionHeader';
import WatchdogEventLog from './WatchdogEventLog';
import { WatchdogRuleModal } from './WatchdogRuleModal';
import WatchdogRuleTable from './WatchdogRuleTable';

export default function WatchdogTab() {
  const rules = useWatchdogRules();
  const events = useWatchdogEvents();
  const isLoading = useWatchdogLoading();
  const error = useWatchdogError();
  const { fetchRules, fetchEvents, removeRule, loadPresets, updateRule, addRule } =
    useWatchdogActions();

  const [showModal, setShowModal] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<WatchdogRule[]>([]);
  const [editingRule, setEditingRule] = useState<WatchdogRule | null>(null);

  useEffect(() => {
    fetchRules();
    fetchEvents();
  }, [fetchRules, fetchEvents]);

  const handleToggleRule = async (rule: WatchdogRule) => {
    const updatedRule = { ...rule, enabled: !rule.enabled };
    await updateRule(updatedRule);
  };

  const handleDeleteRule = async (ruleId: string) => {
    await removeRule(ruleId);
  };

  const handleEditRule = (rule: WatchdogRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleSaveRule = (rule: WatchdogRule) => {
    if (editingRule) {
      void updateRule(rule);
    } else {
      void addRule(rule);
    }
    setShowModal(false);
    setEditingRule(null);
  };

  const handleLoadPresets = async () => {
    const presetRules = await loadPresets();
    setPresets(presetRules);
    setShowPresets(true);
  };

  const formatAction = (action: WatchdogAction): string => {
    if (typeof action === 'string') return action.toUpperCase();
    if ('setPriority' in action) return `SET PRIORITY(${action.setPriority.level.toUpperCase()})`;
    if ('setAffinity' in action) return `SET AFFINITY(${action.setAffinity.cores.join(',')})`;
    return 'UNKNOWN';
  };

  const formatConditions = (
    conditions: { metric: string; operator: string; threshold: number }[],
  ): string => {
    return conditions.map((c) => `${c.metric} ${c.operator} ${c.threshold}`).join(' AND ');
  };

  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner message={error} />
      </div>
    );
  }

  return (
    <div className="p-4 text-[12px]">
      <SectionHeader title="▶ BOOST / WATCHDOG" color="accent">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleLoadPresets}
            disabled={isLoading}
            aria-label="プリセットルールを読み込む"
          >
            PRESETS
          </Button>
          <Button
            variant="primary"
            onClick={handleAddRule}
            disabled={isLoading}
            aria-label="新しい監視ルールを追加"
          >
            ADD RULE
          </Button>
        </div>
      </SectionHeader>

      {isLoading && <LoadingFallback />}

      {!isLoading &&
        (rules.length === 0 ? (
          <EmptyState
            message="NO RULES DEFINED — Create your first automation rule to start monitoring processes"
            action="ADD RULE"
          />
        ) : (
          <WatchdogRuleTable
            rules={rules}
            onToggle={handleToggleRule}
            onEdit={handleEditRule}
            onDelete={handleDeleteRule}
            formatAction={formatAction}
            formatConditions={formatConditions}
          />
        ))}

      <WatchdogEventLog events={events} formatTime={formatTime} />

      <WatchdogRuleModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
        editingRule={editingRule}
      />

      {showPresets && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000">
          <div className="bg-base-900 p-6 min-w-[600px] max-w-[80vw] max-h-[80vh] overflow-y-auto">
            <h3 className="mb-4">PRESET RULES</h3>
            {presets.map((preset) => (
              <div key={preset.id} className="p-3 border border-border mb-2">
                <div className="font-bold">{preset.name}</div>
                <div className="text-xs text-text-muted">{formatConditions(preset.conditions)}</div>
              </div>
            ))}
            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowPresets(false)}
                aria-label="プリセット一覧を閉じる"
              >
                CLOSE
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
