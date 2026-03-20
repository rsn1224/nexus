import type React from 'react';
import { ToggleV2 } from '../ui/ToggleV2';

interface UiCustomizeSectionProps {
  neonIntensity: number;
  setNeonIntensity: (value: number) => void;
  aiRendering: boolean;
  setAiRendering: (value: boolean) => void;
  autoPowerOpt: boolean;
  setAutoPowerOpt: (value: boolean) => void;
}

export default function UiCustomizeSection({
  neonIntensity,
  setNeonIntensity,
  aiRendering,
  setAiRendering,
  autoPowerOpt,
  setAutoPowerOpt,
}: UiCustomizeSectionProps): React.ReactElement {
  return (
    <div className="glass-panel border border-white/10 relative overflow-hidden group shadow-2xl">
      <div className="reflective-overlay absolute inset-0"></div>
      <div className="p-8 relative z-10">
        <div className="absolute top-0 right-0 p-6 font-label text-[9px] text-accent-500/20 tracking-[0.4em]">
          {/* MODULE UI_INTENSITY */}
        </div>
        <h2 className="text-xl font-bold mb-10 flex items-center gap-3 tracking-tight">
          <span className="material-symbols-outlined text-accent-500">palette</span>
          UI カスタマイズ
        </h2>
        <div className="space-y-12">
          {/* Neon Intensity Slider */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <label
                  htmlFor="neon-intensity"
                  className="block font-label text-[9px] text-text-secondary/60 mb-1 uppercase tracking-[0.2em]"
                >
                  Neon Intensity
                </label>
                <span className="text-2xl font-black text-accent-500 tracking-tighter">
                  ネオン発光強度
                </span>
              </div>
              <span className="font-black text-accent-500 text-4xl font-mono">
                {neonIntensity}
                <span className="text-lg ml-0.5 opacity-60">%</span>
              </span>
            </div>
            <div className="relative h-1.5 w-full bg-white/5">
              <div
                className={`absolute top-0 left-0 h-full bg-accent-500 shadow-[0_0_12px_rgba(68,214,44,0.35)] z-10 transition-all neon-slider-fill`}
                style={{ width: `${neonIntensity}%` }}
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                value={neonIntensity}
                onChange={(e) => setNeonIntensity(Number(e.target.value))}
                className="absolute -top-1.5 left-0 w-full h-4 opacity-0 cursor-pointer appearance-none z-20"
                id="neon-intensity"
              />
            </div>
          </div>

          {/* AI Autonomy Controls */}
          <div className="space-y-6">
            <div className="font-label text-[9px] text-text-secondary/60 uppercase tracking-[0.2em]">
              {/* AI Autonomy Alignment */}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-5 bg-black/40 border border-white/5 hover:border-accent-500/30 transition-colors group">
                <span className="text-sm font-medium tracking-tight text-text-primary/80 group-hover:text-accent-500 transition-colors">
                  AI 適応レンダリング
                </span>
                <div className="flex items-center gap-6">
                  <div className="h-1 w-32 bg-white/5 relative hidden sm:block">
                    <div className="absolute left-0 top-0 h-full w-2/3 bg-accent-500/40"></div>
                  </div>
                  <ToggleV2
                    enabled={aiRendering}
                    onToggle={() => setAiRendering(!aiRendering)}
                    className="scale-75"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-5 bg-black/40 border border-white/5 hover:border-warning-500/30 transition-colors group">
                <span className="text-sm font-medium tracking-tight text-text-primary/80 group-hover:text-warning-500 transition-colors">
                  自動電力最適化 [低電力]
                </span>
                <div className="flex items-center gap-6">
                  <div className="h-1 w-32 bg-white/5 relative hidden sm:block">
                    <div className="absolute left-0 top-0 h-full w-1/4 bg-warning-500/40"></div>
                  </div>
                  <ToggleV2
                    enabled={autoPowerOpt}
                    onToggle={() => setAutoPowerOpt(!autoPowerOpt)}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Cards */}
          <div className="grid grid-cols-3 gap-5 pt-4">
            <div className="group relative p-5 bg-accent-500/5 border border-accent-500/40 cursor-pointer hover:bg-accent-500/10 transition-all">
              <div className="font-label text-[8px] mb-3 uppercase tracking-widest text-accent-500">
                Preview_A
              </div>
              <div className="h-10 bg-accent-500/20"></div>
              <div className="absolute inset-0 border border-accent-500 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none"></div>
            </div>
            <div className="group relative p-5 bg-black/40 border border-white/10 cursor-pointer hover:border-white/20 transition-all">
              <div className="font-label text-[8px] mb-3 uppercase tracking-widest text-text-secondary/40">
                Preview_B
              </div>
              <div className="h-10 bg-white/5"></div>
            </div>
            <div className="group relative p-5 bg-black/40 border border-white/10 cursor-pointer hover:border-white/20 transition-all">
              <div className="font-label text-[8px] mb-3 uppercase tracking-widest text-text-secondary/40">
                Preview_C
              </div>
              <div className="h-10 bg-white/5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
