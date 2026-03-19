import type React from 'react';
import { useEffect } from 'react';
import { progressWidth } from '../../lib/styles';
import { useBottleneckStore } from '../../stores/useBottleneckStore';
import { useFrameTimeState } from '../../stores/useFrameTimeStore';
import { useNavStore } from '../../stores/useNavStore';
import type { BottleneckConfidence, BottleneckType, WingId } from '../../types';
import { Card } from '../ui';

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

const getBottleneckColor = (type: BottleneckType): string => {
  switch (type) {
    case 'cpu':
      return 'text-danger-500';
    case 'gpu':
      return 'text-accent-500';
    case 'memory':
      return 'text-accent-500';
    case 'storage':
      return 'text-text-secondary';
    case 'balanced':
      return 'text-success-500';
    case 'unknown':
      return 'text-text-muted';
    default:
      return 'text-text-muted';
  }
};

const getBottleneckLabel = (type: BottleneckType): string => {
  switch (type) {
    case 'cpu':
      return 'CPU BOUND';
    case 'gpu':
      return 'GPU BOUND';
    case 'memory':
      return 'MEM BOUND';
    case 'storage':
      return 'DISK BOUND';
    case 'balanced':
      return 'BALANCED';
    case 'unknown':
      return 'ANALYZING...';
    default:
      return 'UNKNOWN';
  }
};

const getConfidenceBorder = (confidence: BottleneckConfidence): string => {
  switch (confidence) {
    case 'high':
      return 'border-success-500 text-success-500';
    case 'medium':
      return 'border-accent-500 text-accent-500';
    case 'low':
      return 'border-danger-600 text-danger-500';
    default:
      return 'border-border-subtle text-text-muted';
  }
};

const getScoreBarColor = (score: number): string => {
  if (score >= 0.8) return 'bg-danger-500';
  if (score >= 0.6) return 'bg-accent-500';
  if (score >= 0.4) return 'bg-accent-500';
  return 'bg-success-500';
};

// ─── コンポーネント ───────────────────────────────────────────────────────────

const BottleneckCard: React.FC = () => {
  const { bottleneck, isAnalyzing, error, startAutoAnalysis, stopAutoAnalysis } =
    useBottleneckStore();
  const { monitorState: frameTimeState } = useFrameTimeState();
  const { navigate } = useNavStore();

  // フレームタイム監視中のみ自動分析を開始
  useEffect(() => {
    if (frameTimeState.type === 'running') {
      startAutoAnalysis();
    } else {
      stopAutoAnalysis();
    }

    return () => {
      stopAutoAnalysis();
    };
  }, [frameTimeState.type, startAutoAnalysis, stopAutoAnalysis]);

  // フレームタイム監視中でなければ表示しない
  if (frameTimeState.type !== 'running') {
    return null;
  }

  const handleActionClick = (action: string | null) => {
    if (action) {
      navigate(action as WingId);
    }
  };

  return (
    <Card title="BOTTLENECK ANALYSIS" className="mt-4">
      {/* ヘッダー右側: 分析中インジケーター */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-accent-500 animate-pulse" />
          <span className="font-mono text-[10px] text-accent-500 tracking-[0.1em]">
            ANALYZING...
          </span>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="px-3 py-2 bg-base-800 border-b border-danger-600 font-mono text-[11px] text-danger-500 mb-3">
          ERROR: {error}
        </div>
      )}

      {bottleneck ? (
        <div className="flex flex-col gap-3">
          {/* 主要ボトルネック表示 */}
          <div className="flex items-center gap-3">
            <span
              className={`font-mono text-[14px] font-bold tracking-[0.1em] ${getBottleneckColor(bottleneck.primary)}`}
            >
              {getBottleneckLabel(bottleneck.primary)}
            </span>
            <span
              className={`font-mono text-[9px] px-[5px] py-[1px] border tracking-[0.08em] ${getConfidenceBorder(bottleneck.confidence)}`}
            >
              {bottleneck.confidence.toUpperCase()}
            </span>
          </div>

          {/* 負荷スコアバー */}
          <div className="flex flex-col gap-2">
            {(
              [
                { key: 'cpu', label: 'CPU', score: bottleneck.scores.cpu },
                { key: 'gpu', label: 'GPU', score: bottleneck.scores.gpu },
                { key: 'memory', label: 'MEM', score: bottleneck.scores.memory },
                { key: 'storage', label: 'DISK', score: bottleneck.scores.storage },
              ] as const
            ).map(({ key, label, score }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-text-muted tracking-[0.1em] w-10">
                  {label}
                </span>
                <div className="flex-1 h-2 bg-base-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getScoreBarColor(score)}`}
                    style={progressWidth(Math.round(score * 100))}
                  />
                </div>
                <span className="font-mono text-[10px] text-text-muted w-8 text-right">
                  {Math.round(score * 100)}%
                </span>
              </div>
            ))}
          </div>

          {/* 改善提案 */}
          {bottleneck.suggestions.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
              <span className="font-mono text-[10px] font-semibold text-text-muted tracking-[0.12em]">
                SUGGESTIONS
              </span>
              {bottleneck.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-text-secondary flex-1">
                    {suggestion.message}
                  </span>
                  {suggestion.action && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(suggestion.action)}
                      className="ml-2 font-mono text-[9px] px-[10px] py-[2px] border border-accent-500 text-accent-500 tracking-[0.1em] transition-all duration-100 hover:bg-accent-500 hover:text-base-900"
                    >
                      APPLY
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[80px] font-mono text-[11px] text-text-muted tracking-[0.1em]">
          WAITING FOR ANALYSIS DATA...
        </div>
      )}
    </Card>
  );
};

export default BottleneckCard;
