import type React from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistoryActions } from '../../stores/useHistoryStore';
import SessionTable from './SessionTable';
import TacticalAiInsight from './TacticalAiInsight';
import { TrendChart } from './TrendChart';

interface SessionRow {
  id: string;
  timestamp: string;
  duration: string;
  status: string;
  statusColor: string;
  performance: string;
  notes: string;
}

export default function HistoryWing(): React.ReactElement {
  const { t } = useTranslation('logs');
  const { fetchSessions } = useHistoryActions();

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const sessionData: SessionRow[] = [
    {
      id: '#SN-998122',
      timestamp: '2024.05.24 // 14:02:44',
      duration: '42M 12S',
      status: 'completed',
      statusColor: 'green',
      performance: 'optimal',
      notes: 'CPU使用率: 45%',
    },
    {
      id: '#SN-998121',
      timestamp: '2024.05.24 // 13:15:32',
      duration: '38M 45S',
      status: 'completed',
      statusColor: 'green',
      performance: 'good',
      notes: 'GPU温度: 72°C',
    },
    {
      id: '#SN-998120',
      timestamp: '2024.05.24 // 12:28:19',
      duration: '55M 03S',
      status: 'warning',
      statusColor: 'amber',
      performance: 'moderate',
      notes: 'メモリ使用率: 82%',
    },
    {
      id: '#SN-998119',
      timestamp: '2024.05.24 // 11:41:07',
      duration: '29M 18S',
      status: 'completed',
      statusColor: 'green',
      performance: 'optimal',
      notes: 'ネットワーク: 安定',
    },
    {
      id: '#SN-998118',
      timestamp: '2024.05.24 // 10:53:55',
      duration: '47M 36S',
      status: 'error',
      statusColor: 'red',
      performance: 'poor',
      notes: 'ドライバクラッシュ',
    },
  ];

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-accent-500/10 text-accent-500 border-accent-500/30';
      case 'amber':
        return 'bg-warning-500/10 text-warning-500 border-warning-500/30';
      default:
        return 'bg-text-secondary/10 text-text-secondary border-text-secondary/30';
    }
  };

  const insight = {
    title: 'CRITICAL INSIGHT',
    content:
      'ピーク時の戦闘負荷においてニューラルインターフェースのボトルネックを検出。セクター7への熱分離プロトコルの適用を強く推奨。',
    type: 'critical' as const,
  };

  return (
    <div className="min-h-screen bg-base-900 p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scanline-overlay"></div>
        <div className="scanning-line animate-pulse opacity-20"></div>
        <div className="absolute top-[20%] left-[20%] w-96 h-96 rounded-full bg-accent-500/2 blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 rounded-full bg-warning-500/1 blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="mb-14 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-px w-12 bg-accent-500"></div>
              <span className="font-label text-accent-500 text-[10px] tracking-[0.3em] font-bold">
                {t('history.moduleLabel')}
              </span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-text-primary mb-2">
              LOGS{' '}
              <span className="text-accent-500 drop-shadow-[0_0_15px_rgba(68,214,44,0.3)]">
                WING
              </span>
            </h1>
            <p className="font-label text-text-secondary/40 text-[10px] tracking-[0.2em] uppercase">
              {t('history.totalSessions', { count: sessionData.length })}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative group">
              <span className="absolute -top-5 right-0 font-label text-[8px] text-warning-500/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-widest">
                {t('history.syncing')}
              </span>
              <button
                type="button"
                className="relative group px-6 py-2.5 border border-text-secondary/20 text-text-secondary/60 hover:text-warning-500 hover:border-warning-500/50 font-label text-[10px] tracking-widest uppercase transition-all bg-white/2 glass-panel"
              >
                <div className="hud-btn-scan"></div>
                {t('history.sync')}
              </button>
            </div>
            <div className="relative group">
              <span className="absolute -top-5 right-0 font-label text-[8px] text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse whitespace-nowrap tracking-widest">
                {t('history.clearable')}
              </span>
              <button
                type="button"
                className="relative px-8 py-2.5 bg-accent-500/10 border border-accent-500 text-accent-500 font-black text-[10px] tracking-widest uppercase transition-all hover:bg-accent-500/20 glass-panel"
              >
                <div className="scanning-line animate-pulse opacity-20"></div>
                {t('history.clear')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Trend Chart */}
          <div className="md:col-span-12 lg:col-span-8">
            <div className="glass-panel border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="reflective-overlay absolute inset-0"></div>
              <div className="p-8 relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <span className="material-symbols-outlined text-accent-500">trending_up</span>
                  <h2 className="text-xl font-bold text-text-primary tracking-tight">
                    {t('history.performanceTrend')}
                  </h2>
                </div>
                <TrendChart sessions={[]} range="7d" onRangeChange={() => {}} />
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="md:col-span-12 lg:col-span-4">
            <TacticalAiInsight insight={insight} />
          </div>

          {/* Session Table */}
          <div className="md:col-span-12">
            <SessionTable sessionData={sessionData} getStatusColor={getStatusColor} />
          </div>
        </div>
      </div>
    </div>
  );
}
