import type { AiAnalysisResponse, AiLayer } from '../../types/v2';

// =============================================================================
// AI Store — State (ADR-004 Graceful Degradation)
// =============================================================================

export type AiStoreState = {
  /** 現在のAI動作レイヤー */
  activeLayer: AiLayer;

  /** API キーが設定済みか */
  hasApiKey: boolean;

  /** 最新の AI 分析結果 */
  lastAnalysis: AiAnalysisResponse | null;

  /** AI 分析中フラグ */
  analyzing: boolean;

  /** エラーメッセージ */
  error: string | null;

  /** 最後の分析タイムスタンプ（Unix ms） */
  lastAnalyzedAt: number | null;
};

// =============================================================================
// AI Store — Actions
// =============================================================================

export type AiStoreActions = {
  /**
   * API キーの存在をチェックし、activeLayer を決定する。
   * - API キーあり + ネットワーク接続あり → 'ai'
   * - API キーなし or ネットワーク切断 → 'rules'
   * - Rust バックエンド通信エラー → 'static'
   */
  detectLayer: () => Promise<void>;

  /**
   * Perplexity Sonar API で分析を実行する。
   * activeLayer が 'ai' の場合のみ実行。
   * 結果は lastAnalysis に格納し、HealthStore に通知する。
   */
  analyze: () => Promise<void>;

  /**
   * API キーをテストする（ai.test_api_key コマンド）。
   * 成功時: hasApiKey = true, activeLayer = 'ai'
   * 失敗時: hasApiKey = false, activeLayer = 'rules'
   */
  testApiKey: () => Promise<boolean>;

  /** エラーをクリア */
  clearError: () => void;
};

// =============================================================================
// Combined
// =============================================================================

export type AiStore = AiStoreState & AiStoreActions;
