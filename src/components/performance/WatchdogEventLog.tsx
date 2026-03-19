import type React from 'react';
import type { WatchdogEvent } from '../../types';
import EmptyState from '../ui/EmptyState';

interface WatchdogEventLogProps {
  events: WatchdogEvent[];
  formatTime: (timestamp: number) => string;
}

export default function WatchdogEventLog({
  events,
  formatTime,
}: WatchdogEventLogProps): React.ReactElement {
  return (
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
                    <div className="text-text-muted text-[10px]">{formatTime(event.timestamp)}</div>
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
                    <div className="text-accent-500 font-bold text-[11px]">{event.actionTaken}</div>
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
  );
}
