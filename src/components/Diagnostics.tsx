import type React from 'react';
import { memo } from 'react';
import { useSystemStatus } from '../stores/useSystemStore';

const Diagnostics = memo(function Diagnostics(): React.ReactElement | null {
  const { alerts } = useSystemStatus();

  if (alerts.length === 0) return null;

  return (
    <section aria-label="診断アラート">
      <div className="flex flex-col gap-1">
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
                className={`text-[11px] font-bold tracking-[0.08em] ${
                  alert.severity === 'danger' ? 'text-danger-500' : 'text-warning-500'
                }`}
              >
                {alert.title}
              </span>
              <span className="text-[11px] text-text-secondary truncate">{alert.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

export default Diagnostics;
