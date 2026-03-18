import type { Recommendation } from '../../lib/gameReadiness';
import { useNavStore } from '../../stores/useNavStore';
import type { WingId } from '../../types';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'text-danger-500',
  medium: 'text-accent-400',
  low: 'text-text-muted',
};

const PRIORITY_ICONS: Record<string, string> = {
  high: '▲',
  medium: '●',
  low: '○',
};

// action 文字列を WingId に変換
const actionToWing: Record<string, WingId> = {
  boost: 'boost',
  profiles: 'boost', // プロファイルは boost wing 内
  winopt: 'windows',
};

export default function RecommendationList({ recommendations }: RecommendationListProps) {
  const navigate = useNavStore((s) => s.navigate);

  if (recommendations.length === 0) {
    return (
      <div className="font-mono text-[10px] text-success-500 text-center py-2">
        ✓ 改善推奨事項はありません
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {recommendations.map((rec) => (
        <div key={rec.id} className="flex items-start gap-2 font-mono text-[10px]">
          <span className={`shrink-0 ${PRIORITY_STYLES[rec.priority]}`}>
            {PRIORITY_ICONS[rec.priority]}
          </span>
          <span className="text-text-secondary flex-1">{rec.message}</span>
          {rec.action && actionToWing[rec.action] && (
            <button
              type="button"
              onClick={() => {
                const wingId = actionToWing[rec.action as keyof typeof actionToWing];
                if (wingId) navigate(wingId);
              }}
              className="shrink-0 text-cyan-500 hover:underline"
            >
              →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
