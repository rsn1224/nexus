import type React from 'react';
import { memo } from 'react';
import { useSystemStore } from '../../stores/useSystemStore';

const DiagnosticBanner = memo(function DiagnosticBanner(): React.ReactElement | null {
  const alerts = useSystemStore((s) => s.alerts);

  if (alerts.length === 0) return null;

  return (
    <section aria-label="Diagnostics" className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-text-muted">
        Diagnostics
      </span>
      {alerts.map((alert) => (
        <div
          key={`${alert.severity}-${alert.title}`}
          role="alert"
          className={[
            'flex items-start gap-2 px-3 py-2 rounded border text-[11px]',
            alert.severity === 'danger'
              ? 'border-danger-500/30 bg-danger-500/5 text-danger-500'
              : 'border-warning-500/30 bg-warning-500/5 text-warning-500',
          ].join(' ')}
        >
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold shrink-0">{alert.title}</span>
              <span className="text-text-muted">{alert.detail}</span>
            </div>
            {alert.action_hint && (
              <span className="text-[10px] font-mono text-text-muted">→ {alert.action_hint}</span>
            )}
          </div>
        </div>
      ))}
    </section>
  );
});

export default DiagnosticBanner;
