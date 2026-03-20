import type React from 'react';

interface SystemMetricsProps {
  cpu: number;
  memory: number;
  latency: string;
  bandwidth: string;
}

export default function SystemMetrics({
  cpu,
  memory,
  latency,
  bandwidth,
}: SystemMetricsProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* CPU Usage */}
      <div className="glass-panel border border-white/10 relative overflow-hidden group">
        <div className="reflective-overlay absolute inset-0"></div>
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-accent-500">memory</span>
            <span className="text-[7px] text-accent-500 font-mono tracking-tighter uppercase">
              CORE_TEMP_01
            </span>
          </div>
          <div className="relative text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-white/10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-accent-500 tracking-tighter">
                    {cpu}
                    <span className="text-sm text-accent-500/60 ml-1">%</span>
                  </div>
                  <div className="text-[7px] text-text-secondary/40 uppercase tracking-widest">
                    CPU LOAD
                  </div>
                </div>
              </div>
              <div
                className="absolute inset-0 rounded-full border-4 border-accent-500/20"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, rgb(68 214 44) ${cpu * 3.6}deg, transparent ${cpu * 3.6}deg)`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Usage */}
      <div className="glass-panel border border-white/10 relative overflow-hidden group">
        <div className="reflective-overlay absolute inset-0"></div>
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-warning-500">sd_card</span>
            <span className="text-[7px] text-warning-500 font-mono tracking-tighter uppercase">
              MEM_USAGE_02
            </span>
          </div>
          <div className="relative text-center">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-white/10"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-warning-500 tracking-tighter">
                    {memory}
                    <span className="text-sm text-warning-500/60 ml-1">GB</span>
                  </div>
                  <div className="text-[7px] text-text-secondary/40 uppercase tracking-widest">
                    RAM USED
                  </div>
                </div>
              </div>
              <div
                className="absolute inset-0 rounded-full border-4 border-warning-500/20"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, rgb(255 174 0) ${(memory / 64) * 360}deg, transparent ${(memory / 64) * 360}deg)`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="glass-panel border border-white/10 relative overflow-hidden group">
        <div className="reflective-overlay absolute inset-0"></div>
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-accent-500">wifi</span>
            <span className="text-[7px] text-accent-500 font-mono tracking-tighter uppercase">
              NET_STATS_03
            </span>
          </div>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-[9px] text-text-secondary/30 tracking-widest mb-1 uppercase">
                LATENCY {/* */} / レイテンシ
              </p>
              <p className="text-base font-bold text-text-primary tracking-tight font-mono">
                {latency}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-text-secondary/30 tracking-widest mb-1 uppercase">
                BANDWIDTH {/* */} / 帯域幅
              </p>
              <p className="text-base font-bold text-text-primary tracking-tight font-mono">
                {bandwidth}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
