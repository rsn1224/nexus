import type React from 'react';
import { useTranslation } from 'react-i18next';

interface SessionRow {
  id: string;
  timestamp: string;
  duration: string;
  status: string;
  statusColor: string;
  performance: string;
  notes: string;
}

interface SessionTableProps {
  sessionData: SessionRow[];
  getStatusColor: (color: string) => string;
}

export default function SessionTable({
  sessionData,
  getStatusColor,
}: SessionTableProps): React.ReactElement {
  const { t } = useTranslation('logs');

  return (
    <div className="glass-panel border border-white/10 relative overflow-hidden shadow-2xl">
      <div className="reflective-overlay absolute inset-0"></div>
      <div className="p-8 relative z-10">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-bold flex items-center gap-3 tracking-tight">
            <span className="material-symbols-outlined text-accent-500">history</span>
            {t('history.sessionHistory')}
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="font-label text-[9px] text-text-secondary/40 hover:text-accent-500 tracking-[0.2em] transition-colors uppercase font-bold"
            >
              {t('history.export')}
            </button>
            <span className="px-3 py-1 bg-accent-500/10 border border-accent-500/30 text-accent-500 font-label text-[9px] tracking-[0.2em] font-bold">
              {t('history.sessions', { count: sessionData.length })}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-8 py-4 text-left font-label text-text-secondary/60 uppercase tracking-widest">
                  {t('history.sessionId')}
                </th>
                <th className="px-8 py-4 text-left font-label text-text-secondary/60 uppercase tracking-widest">
                  {t('history.timestamp')}
                </th>
                <th className="px-8 py-4 text-left font-label text-text-secondary/60 uppercase tracking-widest">
                  {t('history.duration')}
                </th>
                <th className="px-8 py-4 text-left font-label text-text-secondary/60 uppercase tracking-widest">
                  {t('history.status')}
                </th>
                <th className="px-8 py-4 text-left font-label text-text-secondary/60 uppercase tracking-widest">
                  {t('history.performance')}
                </th>
                <th className="px-8 py-4 text-left font-label text-text-secondary/60 uppercase tracking-widest">
                  {t('history.notes')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sessionData.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="px-8 py-4 font-mono text-accent-500">{session.id}</td>
                  <td className="px-8 py-4 text-text-secondary/80">{session.timestamp}</td>
                  <td className="px-8 py-4 text-text-primary/80">{session.duration}</td>
                  <td className="px-8 py-4 text-right">
                    <span
                      className={`text-[8px] px-3 py-1.5 border font-black uppercase tracking-[0.3em] transition-all rounded-sm ${getStatusColor(
                        session.statusColor,
                      )} group-hover:brightness-125`}
                    >
                      {session.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            session.performance === 'optimal'
                              ? 'bg-accent-500'
                              : session.performance === 'good'
                                ? 'bg-warning-500'
                                : 'bg-text-secondary/40'
                          }`}
                          style={{
                            width:
                              session.performance === 'optimal'
                                ? '90%'
                                : session.performance === 'good'
                                  ? '60%'
                                  : '30%',
                          }}
                        ></div>
                      </div>
                      <span className="text-[8px] text-text-secondary/60 uppercase tracking-widest">
                        {session.performance}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-text-secondary/60">{session.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
