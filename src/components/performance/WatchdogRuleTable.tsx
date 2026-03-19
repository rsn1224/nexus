import type React from 'react';
import type { WatchdogAction, WatchdogRule } from '../../types';
import Button from '../ui/Button';

interface WatchdogRuleTableProps {
  rules: WatchdogRule[];
  onToggle: (rule: WatchdogRule) => void;
  onEdit: (rule: WatchdogRule) => void;
  onDelete: (ruleId: string) => void;
  formatAction: (action: WatchdogAction) => string;
  formatConditions: (
    conditions: { metric: string; operator: string; threshold: number }[],
  ) => string;
}

export default function WatchdogRuleTable({
  rules,
  onToggle,
  onEdit,
  onDelete,
  formatAction,
  formatConditions,
}: WatchdogRuleTableProps): React.ReactElement {
  return (
    <div className="border border-border overflow-hidden mb-6">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-base-800 border-b border-border">
            <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-xs">
              NAME
            </th>
            <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-xs">
              STATUS
            </th>
            <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-xs">
              CONDITIONS
            </th>
            <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-xs">
              ACTION
            </th>
            <th className="px-3 py-[5px] text-left font-bold text-text-muted uppercase text-xs">
              PROFILE
            </th>
            <th className="px-3 py-[5px] text-right font-bold text-text-muted uppercase text-xs">
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
                <div className="text-xs text-text-muted mt-[2px]">ID: {rule.id}</div>
              </td>
              <td className="px-3 py-[5px]">
                <Button
                  variant={rule.enabled ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => onToggle(rule)}
                  aria-label={`ルール「${rule.name}」を${rule.enabled ? '無効' : '有効'}にする`}
                >
                  {rule.enabled ? 'ENABLED' : 'DISABLED'}
                </Button>
              </td>
              <td className="px-3 py-[5px]">
                <div className="text-text-primary text-xs">{formatConditions(rule.conditions)}</div>
              </td>
              <td className="px-3 py-[5px]">
                <div className="text-accent-500 font-bold text-xs">{formatAction(rule.action)}</div>
              </td>
              <td className="px-3 py-[5px]">
                <div className="text-text-primary text-xs">{rule.profileId || 'GLOBAL'}</div>
              </td>
              <td className="px-3 py-[5px] text-right">
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(rule)}
                    aria-label={`ルール「${rule.name}」を編集`}
                  >
                    EDIT
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(rule.id)}
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
  );
}
