import type React from 'react';

interface ProcessItem {
  id: string;
  name: string;
  cpu: number;
  memory: number;
  status: 'normal' | 'warning' | 'critical';
  color: string;
}

interface ProcessListProps {
  processes: ProcessItem[];
}

export default function ProcessList({ processes }: ProcessListProps): React.ReactElement {
  const getRowBg = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500/10 hover:bg-red-500/20';
      case 'warning':
        return 'bg-warning-500/10 hover:bg-warning-500/20';
      default:
        return 'hover:bg-white/5';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-warning-500';
      default:
        return 'text-accent-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-500/20';
      case 'warning':
        return 'bg-warning-500/20';
      default:
        return 'bg-accent-500/20';
    }
  };

  return (
    <div className="glass-panel border border-white/10 relative overflow-hidden shadow-2xl">
      <div className="reflective-overlay absolute inset-0"></div>
      <div className="p-4 border-b border-accent-500/10 flex justify-between items-center bg-black/60 relative z-10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-xs text-accent-500">list</span>
          <h3 className="font-label text-[11px] font-bold tracking-[0.15em] text-accent-500 uppercase">
            Active Process List {/* */} / 実行中のプロセス一覧
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[7px] text-accent-500 font-mono tracking-tighter uppercase">
            REF_STRM_X009 {/* */} / Stability Score
          </span>
          <span className="text-[7px] text-accent-500 font-mono tracking-tighter">BUFFER_OK</span>
        </div>
      </div>
      <div className="relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left font-label text-text-secondary/60 uppercase tracking-widest">
                  Process ID
                </th>
                <th className="px-6 py-4 text-left font-label text-text-secondary/60 uppercase tracking-widest">
                  Name
                </th>
                <th className="px-6 py-4 text-left font-label text-text-secondary/60 uppercase tracking-widest">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process) => (
                <tr key={process.id} className={`${getRowBg(process.status)} transition-colors`}>
                  <td className={`px-6 py-4 font-mono ${getStatusColor(process.status)}`}>
                    {process.id}
                  </td>
                  <td
                    className={`px-6 py-4 text-text-primary font-medium ${process.status === 'critical' ? 'font-bold' : ''}`}
                  >
                    {process.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 text-[9px] border font-black tracking-widest ${getStatusBg(
                        process.status,
                      )} ${getStatusColor(process.status)}`}
                    >
                      {process.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
