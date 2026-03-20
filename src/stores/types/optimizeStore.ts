import type {
  GamingSection,
  OptimizeAllConfig,
  OptimizePreset,
  OptimizeResult,
  OptimizeStep,
} from '../../types/v2';

// =============================================================================
// Optimize Store — State
// =============================================================================

export type OptimizeStoreState = {
  /** 現在選択中のプリセット */
  activePreset: OptimizePreset | null;

  /** プリセットに含まれるステップ一覧 */
  steps: OptimizeStep[];

  /** 各ステップの有効/無効（ユーザーがトグル可能） */
  stepEnabled: Record<string, boolean>;

  /** 直近の適用結果 */
  lastResult: OptimizeResult | null;

  /** GAMING Wing のアクティブセクション */
  activeSection: GamingSection;

  /** Optimize All の各カテゴリ有効/無効 */
  optimizeAllConfig: OptimizeAllConfig;

  /** 適用中フラグ */
  applying: boolean;

  /** エラーメッセージ */
  error: string | null;
};

// =============================================================================
// Optimize Store — Actions
// =============================================================================

export type OptimizeStoreActions = {
  /** プリセットを選択し、対応ステップ一覧をロード */
  selectPreset: (preset: OptimizePreset) => void;

  /** 個別ステップの有効/無効をトグル */
  toggleStep: (stepId: string) => void;

  /**
   * 有効な全ステップを順次 invoke で適用。
   * 結果を lastResult に格納。
   */
  applyPreset: () => Promise<void>;

  /**
   * lastResult の rollbackMap を使って全ステップをロールバック。
   */
  rollbackPreset: () => Promise<void>;

  /** GAMING Wing のセクションを切り替え */
  setActiveSection: (section: GamingSection) => void;

  /** Optimize All のカテゴリ有効/無効をトグル */
  toggleOptimizeCategory: (category: keyof OptimizeAllConfig) => void;

  /**
   * Optimize All を実行。
   * optimizeAllConfig で有効なカテゴリのみ適用。
   */
  runOptimizeAll: () => Promise<void>;

  /** エラーをクリア */
  clearError: () => void;
};

// =============================================================================
// Combined
// =============================================================================

export type OptimizeStore = OptimizeStoreState & OptimizeStoreActions;
