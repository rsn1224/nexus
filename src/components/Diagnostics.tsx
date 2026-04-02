import { CheckCircle } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import { useSystemStatus } from '../stores/useSystemStore';

const Diagnostics = memo(function Diagnostics(): React.ReactElement {
  const { alerts } = useSystemStatus();

  if (alerts.length === 0) {
    return (
      <div className="flex-1 border border-border-subtle rounded bg-base-900 p-4 flex flex-col gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-muted">診断</p>
        <div className="flex items-center gap-2 text-success-500">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="text-[12px] font-mono">すべて正常</span>
        </div>
      </div>
    );
  }

  return (
    <section aria-label="診断アラート" className="flex flex-col gap-1">
      {alerts.map((alert) => (
        <div
          key={`${alert.severity}-${alert.title}`}
          className={`flex gap-3 p-2 rounded border-l-2 bg-base-800 ${
            alert.severity === 'danger' ? 'border-danger-500' : 'border-warning-500'
          }`}
          role="alert"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span
              className={`text-[11px] font-bold tracking-widest ${
                alert.severity === 'danger' ? 'text-danger-500' : 'text-warning-500'
              }`}
            >
              {alert.title}
            </span>
            <span className="text-[11px] text-text-secondary truncate">{alert.detail}</span>
            {alert.action_hint && (
              <span className="text-[10px] font-mono text-text-muted">→ {alert.action_hint}</span>
            )}
          </div>
        </div>
      ))}
    </section>
  );
});

export default Diagnostics;
