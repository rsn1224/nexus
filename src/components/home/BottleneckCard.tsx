import type React from 'react';
import { useEffect } from 'react';
import { useBottleneckStore } from '../../stores/useBottleneckStore';
import { useFrameTimeState } from '../../stores/useFrameTimeStore';
import { useNavStore } from '../../stores/useNavStore';
import type { BottleneckConfidence, BottleneckType, WingId } from '../../types';

const getBottleneckColor = (type: BottleneckType): string => {
  switch (type) {
    case 'cpu':
      return 'text-red-500';
    case 'gpu':
      return 'text-orange-500';
    case 'memory':
      return 'text-yellow-500';
    case 'storage':
      return 'text-purple-500';
    case 'balanced':
      return 'text-green-500';
    case 'unknown':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
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

const getConfidenceColor = (confidence: BottleneckConfidence): string => {
  switch (confidence) {
    case 'high':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 0.8) return 'bg-red-500';
  if (score >= 0.6) return 'bg-orange-500';
  if (score >= 0.4) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getScoreWidthClass = (score: number): string => `w-[${Math.round(score * 100)}%]`;

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
    <div className="bg-(--color-surface) border border-(--color-border) rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-(--font-mono) text-(--color-text) uppercase tracking-wider">
          Bottleneck Analysis
        </h3>
        {isAnalyzing && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-text-muted">Analyzing...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded p-2 mb-3">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {bottleneck ? (
        <div className="space-y-3">
          {/* 主要ボトルネック表示 */}
          <div className="flex items-center gap-3">
            <div className={`text-lg font-bold ${getBottleneckColor(bottleneck.primary)}`}>
              {getBottleneckLabel(bottleneck.primary)}
            </div>
            <div
              className={`px-2 py-1 rounded text-xs text-white ${getConfidenceColor(bottleneck.confidence)}`}
            >
              {bottleneck.confidence.toUpperCase()}
            </div>
          </div>

          {/* 負荷スコアバー */}
          <div className="space-y-2">
            {(
              [
                { key: 'cpu', label: 'CPU', score: bottleneck.scores.cpu },
                { key: 'gpu', label: 'GPU', score: bottleneck.scores.gpu },
                { key: 'memory', label: 'MEM', score: bottleneck.scores.memory },
                { key: 'storage', label: 'DISK', score: bottleneck.scores.storage },
              ] as const
            ).map(({ key, label, score }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-12">{label}</span>
                <div className="flex-1 bg-(--color-background) rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getScoreColor(score)} ${getScoreWidthClass(score)}`}
                  />
                </div>
                <span className="text-xs text-text-muted w-8 text-right">
                  {Math.round(score * 100)}%
                </span>
              </div>
            ))}
          </div>

          {/* 改善提案 */}
          {bottleneck.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs text-(--color-text) font-(--font-mono) uppercase">
                Suggestions
              </h4>
              {bottleneck.suggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary flex-1">{suggestion.message}</p>
                  {suggestion.action && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(suggestion.action)}
                      className="ml-2 px-2 py-1 bg-(--color-accent-500) text-white text-xs rounded hover:bg-accent-600 transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-text-muted">Waiting for analysis data...</p>
        </div>
      )}
    </div>
  );
};

export default BottleneckCard;
