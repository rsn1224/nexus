import { useEffect, useState } from 'react';
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

export default function WatchdogTab() {
  const rules = useWatchdogRules();
  const events = useWatchdogEvents();
  const isLoading = useWatchdogLoading();
  const error = useWatchdogError();
  const { fetchRules, fetchEvents, removeRule, loadPresets, updateRule } = useWatchdogActions();

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

  const handleLoadPresets = async () => {
    const presetRules = await loadPresets();
    setPresets(presetRules);
    setShowPresets(true);
  };

  const formatAction = (action: WatchdogAction): string => {
    if (typeof action === 'string') {
      return action.toUpperCase();
    }
    if ('setPriority' in action) {
      return `SET PRIORITY(${action.setPriority.level.toUpperCase()})`;
    }
    if ('setAffinity' in action) {
      return `SET AFFINITY(${action.setAffinity.cores.join(',')})`;
    }
    return 'UNKNOWN';
  };

  const formatConditions = (
    conditions: { metric: string; operator: string; threshold: number }[],
  ): string => {
    return conditions.map((c) => `${c.metric} ${c.operator} ${c.threshold}`).join(' AND ');
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner message={error} />
      </div>
    );
  }

  return (
    <div className="p-4 font-mono text-[12px]">
      {/* Header */}
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

      {/* Rules Table */}
      {!isLoading &&
        (rules.length === 0 ? (
          <EmptyState
            message="NO RULES DEFINED — Create your first automation rule to start monitoring processes"
            action="ADD RULE"
          />
        ) : (
          <div className="border border-border overflow-hidden mb-6">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-base-800 border-b border-border">
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    NAME
                  </th>
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    STATUS
                  </th>
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    CONDITIONS
                  </th>
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    ACTION
                  </th>
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    PROFILE
                  </th>
                  <th className="px-3 py-[5px] text-right font-bold text-text-muted uppercase text-[10px]">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule: WatchdogRule) => (
                  <tr
                    key={rule.id}
                    className="border-b border-border transition-colors duration-100 hover:bg-white/4"
                  >
                    <td className="px-3 py-[5px]">
                      <div className="font-bold text-text-primary">{rule.name}</div>
                      <div className="text-[10px] text-text-muted mt-[2px]">ID: {rule.id}</div>
                    </td>
                    <td className="px-3 py-[5px]">
                      <Button
                        variant={rule.enabled ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleRule(rule)}
                        aria-label={`ルール「${rule.name}」を${rule.enabled ? '無効' : '有効'}にする`}
                      >
                        {rule.enabled ? 'ENABLED' : 'DISABLED'}
                      </Button>
                    </td>
                    <td className="px-3 py-[5px]">
                      <div className="text-text-primary text-[11px]">
                        {formatConditions(rule.conditions)}
                      </div>
                    </td>
                    <td className="px-3 py-[5px]">
                      <div className="text-accent-500 font-bold text-[11px]">
                        {formatAction(rule.action)}
                      </div>
                    </td>
                    <td className="px-3 py-[5px]">
                      <div className="text-text-primary text-[11px]">
                        {rule.profileId || 'GLOBAL'}
                      </div>
                    </td>
                    <td className="px-3 py-[5px] text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                          aria-label={`ルール「${rule.name}」を編集`}
                        >
                          EDIT
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          aria-label={`ルール「${rule.name}」を削除`}
                        >
                          DELETE
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {/* Event Log */}
      <div className="mt-6">
        <h3 className="mb-4 text-[11px] font-bold uppercase text-text-primary">EVENT LOG</h3>

        {events.length === 0 ? (
          <EmptyState message="NO EVENTS YET — Watchdog events will appear here when rules are triggered" />
        ) : (
          <div className="border border-border overflow-hidden max-h-[300px] overflow-y-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-base-800 border-b border-border sticky top-0">
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    TIME
                  </th>
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    RULE
                  </th>
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    PROCESS
                  </th>
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    ACTION
                  </th>
                  <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-[10px]">
                    RESULT
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((event) => (
                  <tr
                    key={`${event.ruleId}-${event.timestamp}`}
                    className={`border-b border-border ${event.success ? '' : 'bg-danger-50'}`}
                  >
                    <td className="px-3 py-[5px]">
                      <div className="text-text-muted text-[10px]">
                        {formatTime(event.timestamp)}
                      </div>
                    </td>
                    <td className="px-3 py-[5px]">
                      <div className="text-text-primary text-[11px]">{event.ruleName}</div>
                    </td>
                    <td className="px-3 py-[5px]">
                      <div className="text-text-primary text-[11px]">
                        {event.processName} ({event.pid})
                      </div>
                    </td>
                    <td className="px-3 py-[5px]">
                      <div className="text-accent-500 font-bold text-[11px]">
                        {event.actionTaken}
                      </div>
                    </td>
                    <td className="px-3 py-[5px]">
                      <div
                        className={`font-bold text-[11px] ${event.success ? 'text-success-500' : 'text-danger-500'}`}
                      >
                        {event.success ? 'SUCCESS' : 'FAILED'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals would be implemented here */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000">
          <div className="bg-base-900 p-6 min-w-[600px] max-w-[80vw] max-h-[80vh] overflow-y-auto">
            <h3 className="mb-4">{editingRule ? 'EDIT RULE' : 'ADD RULE'}</h3>
            <p>Rule modal implementation would go here</p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
                aria-label="ルール編集をキャンセル"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPresets && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000">
          <div className="bg-base-900 p-6 min-w-[600px] max-w-[80vw] max-h-[80vh] overflow-y-auto">
            <h3 className="mb-4">PRESET RULES</h3>
            {presets.map((preset) => (
              <div key={preset.id} className="p-3 border border-border mb-2">
                <div className="font-bold">{preset.name}</div>
                <div className="text-[10px] text-text-muted">
                  {formatConditions(preset.conditions)}
                </div>
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
