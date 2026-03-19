import type { AppliedAction, HealthInput, HealthScore, Suggestion } from '../../types/v2';

// =============================================================================
// Health Store — State
// =============================================================================

export type HealthStoreState = {
  /** 現在の Health Score（null = 未計算） */
  healthScore: HealthScore | null;

  /** 現在の Suggestion 一覧（ルールベース + AI 追加） */
  suggestions: Suggestion[];

  /** セッション中の適用済みアクション履歴（永続化しない） */
  appliedActions: AppliedAction[];

  /** 最後に計算に使用した入力データ */
  lastInput: HealthInput | null;

  /** ローディング状態 */
  loading: boolean;

  /** エラーメッセージ */
  error: string | null;
};

// =============================================================================
// Health Store — Actions
// =============================================================================

export type HealthStoreActions = {
  /**
   * pulse / hardware / windows_settings の最新データで
   * HealthScore と Suggestion を再計算する。
   * lib/healthScore.ts + lib/suggestionEngine.ts を呼ぶ。
   */
  recalculate: (input: HealthInput) => void;

  /**
   * 指定 Suggestion のアクションを invoke 経由で適用する。
   * 成功時: isApplied = true, appliedActions に追記
   * 失敗時: error を set
   */
  applySuggestion: (suggestionId: string) => Promise<void>;

  /**
   * 適用済み Suggestion をロールバックする。
   * canRollback = true の Suggestion のみ。
   */
  rollbackSuggestion: (suggestionId: string) => Promise<void>;

  /**
   * AI 分析結果で Suggestion の優先度を更新する。
   * aiAnalyzer.ts の応答を受け取る。
   */
  updateWithAiInsights: (priorityOrder: string[], additionalInsights: string[]) => void;

  /** エラーをクリア */
  clearError: () => void;
};

// =============================================================================
// Combined
// =============================================================================

export type HealthStore = HealthStoreState & HealthStoreActions;
