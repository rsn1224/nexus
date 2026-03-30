import type React from 'react';
import { useTranslation } from 'react-i18next';

interface HardwareNode {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: string;
  color: 'green' | 'amber' | 'neutral';
  hasPulse?: boolean;
}

export default function HardwareConfigTree(): React.ReactElement {
  const { t } = useTranslation('settings');
  const hardwareNodes: HardwareNode[] = [
    {
      id: 'core_proc_01',
      label: 'CORE_PROC_01',
      value: '98.4',
      unit: 'GHz',
      status: 'STATUS: OPTIMIZED',
      color: 'green',
      hasPulse: true,
    },
    {
      id: 'memory_array',
      label: 'MEMORY_ARRAY',
      value: '64.0',
      unit: 'GB',
      status: 'LATENCY: 0.2ms',
      color: 'neutral',
    },
    {
      id: 'render_engine',
      label: 'RENDER_ENGINE',
      value: 'X3',
      unit: 'CORE',
      status: 'LOAD: 12%',
      color: 'amber',
      hasPulse: true,
    },
    {
      id: 'storage_vol',
      label: 'STORAGE_VOL',
      value: '4.0',
      unit: 'TB',
      status: 'FREE: 82%',
      color: 'neutral',
    },
  ];

  const getNodeColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'border-accent-500/30 bg-accent-500/2 hover:bg-accent-500/5 hover:border-accent-500/50';
      case 'amber':
        return 'border-warning-500/30 hover:border-warning-500/50';
      default:
        return 'border-white/10 bg-black/40 hover:border-accent-500/30';
    }
  };

  const getNodeTextColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-accent-500';
      case 'amber':
        return 'text-warning-500';
      default:
        return 'text-text-primary';
    }
  };

  return (
    <div className="glass-panel border border-white/10 shadow-2xl">
      <div className="reflective-overlay absolute inset-0"></div>
      <div className="p-8 relative z-10">
        <h2 className="text-xl font-bold mb-10 flex items-center gap-3 tracking-tight">
          <span className="material-symbols-outlined text-accent-500">memory</span>
          {t('hardware.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {hardwareNodes.map((node) => (
            <div
              key={node.id}
              className={`p-6 border relative group hover:transition-all cursor-pointer ${getNodeColor(
                node.color,
              )}`}
            >
              {node.hasPulse && (
                <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-accent-500 rounded-full shadow-[0_0_12px_rgba(68,214,44,0.35)] animate-pulse"></div>
              )}
              {node.color === 'amber' && node.hasPulse && (
                <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-warning-500 rounded-full shadow-[0_0_12px_rgba(255,174,0,0.25)] animate-pulse"></div>
              )}
              <div
                className={`font-label text-[9px] mb-5 tracking-[0.3em] font-bold uppercase ${getNodeTextColor(node.color)}`}
              >
                {node.label}
              </div>
              <div
                className={`text-4xl font-black mb-1 group-hover:${getNodeTextColor(node.color)} transition-colors tracking-tighter font-mono`}
              >
                {node.value}
                <span
                  className={`text-sm text-text-secondary/40 ml-1 group-hover:${getNodeTextColor(node.color)}/40`}
                >
                  {node.unit}
                </span>
              </div>
              <div
                className={`text-[9px] font-label tracking-widest uppercase ${node.color === 'green' ? 'text-accent-500/60' : node.color === 'amber' ? 'text-warning-500/40' : 'text-text-secondary/30'}`}
              >
                {node.status}
              </div>
            </div>
          ))}
        </div>
        {/* Tree Visual Connection */}
        <div className="mt-10 grid grid-cols-4 gap-4 px-10">
          <div className="col-span-1 border-t border-l border-white/10 h-10"></div>
          <div className="col-span-1 border-t border-white/10 h-10"></div>
          <div className="col-span-1 border-t border-white/10 h-10"></div>
          <div className="col-span-1 border-t border-r border-white/10 h-10"></div>
        </div>
        <div className="flex justify-center -mt-2">
          <div className="relative group cursor-help">
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 font-label text-[7px] text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-[0.4em] font-bold">
              [NODE_ACTIVE_LINK_04]
            </span>
            <div className="px-10 py-4 border border-accent-500/50 bg-accent-500/10 text-accent-500 font-label text-[11px] tracking-[0.5em] font-black hover:bg-accent-500/20 transition-all shadow-[0_0_12px_rgba(68,214,44,0.35)] uppercase">
              {t('hardware.integratedHub')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
