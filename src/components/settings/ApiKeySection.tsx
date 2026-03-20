import type React from 'react';

export default function ApiKeySection(): React.ReactElement {
  return (
    <div className="glass-panel border border-white/10 flex flex-col shadow-2xl">
      <div className="reflective-overlay absolute inset-0"></div>
      <div className="p-8 grow flex flex-col relative z-10">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-bold flex items-center gap-3 tracking-tight">
            <span className="material-symbols-outlined text-warning-500">security</span>
            API キー設定
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="font-label text-[9px] text-text-secondary/40 hover:text-accent-500 tracking-[0.2em] transition-colors uppercase font-bold"
            >
              [ 整合性チェック ]
            </button>
            <span className="px-3 py-1 bg-accent-500/10 border border-accent-500/30 text-accent-500 font-label text-[9px] tracking-[0.2em] font-bold">
              SECURE
            </span>
          </div>
        </div>
        <div className="grow space-y-8">
          <div className="relative group">
            <label
              htmlFor="system-access-key"
              className="block font-label text-[9px] text-text-secondary/60 mb-3 uppercase tracking-[0.2em]"
            >
              System Access Key
            </label>
            <div className="relative">
              <input
                id="system-access-key"
                type="password"
                value="••••••••••••••••"
                readOnly
                className="w-full bg-black/80 border border-white/10 p-5 font-mono text-accent-500 text-lg tracking-[0.4em] focus:ring-0 focus:border-accent-500/50 focus:outline-none transition-all placeholder-accent-500/10"
                aria-label="System Access Key"
              />
              <div className="absolute bottom-0 left-0 h-px w-0 bg-accent-500 transition-all duration-500 group-focus-within:w-full"></div>
            </div>
          </div>
          <div className="scanning-line h-48 bg-black/60 flex items-center justify-center border border-white/5 relative">
            <div className="absolute top-2 left-2 font-mono text-[7px] text-accent-500/20">
              MEM_DUMP_STREAM
            </div>
            <div className="text-center">
              <div className="font-label text-[9px] text-accent-500/30 mb-4 tracking-[0.5em] font-bold">
                SCANNING NEURAL LINK...
              </div>
              <div className="flex gap-3 justify-center items-end h-8">
                <div className="w-1.5 h-full bg-accent-500/60 animate-pulse"></div>
                <div className="w-1.5 h-3/4 bg-accent-500/20 animate-pulse animate-delay-400"></div>
                <div className="w-1.5 h-full bg-accent-500/80 animate-pulse animate-delay-200"></div>
                <div className="w-1.5 h-1/2 bg-accent-500/40 animate-pulse animate-delay-600"></div>
                <div className="w-1.5 h-3/4 bg-accent-500/50 animate-pulse animate-delay-300"></div>
              </div>
            </div>
          </div>
          <div className="relative group mt-auto">
            <span className="absolute -top-3 left-6 font-label text-[8px] text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity bg-base-900 px-3 z-10 tracking-[0.2em] font-bold">
              VERIFIED_ACCESS
            </span>
            <button
              type="button"
              className="hud-button-effect w-full py-5 bg-white/3 border border-white/10 text-text-primary hover:text-accent-500 hover:border-accent-500/50 font-black text-xs tracking-[0.3em] uppercase transition-all active:scale-[0.99] glass-panel"
            >
              <div className="scanning-line animate-pulse opacity-20"></div>
              認証キーを更新
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
