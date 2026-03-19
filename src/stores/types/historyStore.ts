import type { GameSession, SessionListItem } from '../../types/v2';

// =============================================================================
// History Store — State
// =============================================================================

export type HistoryStoreState = {
  /** セッション一覧（リスト表示用） */
  sessions: SessionListItem[];

  /** 選択中のセッション詳細 */
  selectedSession: GameSession | null;

  /** トレンド表示期間 */
  trendRange: '7d' | '30d';

  /** ローディング状態 */
  loading: boolean;

  /** エラーメッセージ */
  error: string | null;
};

// =============================================================================
// History Store — Actions
// =============================================================================

export type HistoryStoreActions = {
  /** セッション一覧を Rust バックエンドから取得 */
  fetchSessions: () => Promise<void>;

  /** 特定セッションの詳細を取得 */
  selectSession: (sessionId: string) => Promise<void>;

  /** セッションを削除 */
  deleteSession: (sessionId: string) => Promise<void>;

  /** セッションのノートを更新 */
  updateNote: (sessionId: string, note: string) => Promise<void>;

  /** トレンド表示期間を切り替え */
  setTrendRange: (range: '7d' | '30d') => void;

  /** 選択中セッションをクリア */
  clearSelection: () => void;

  /** エラーをクリア */
  clearError: () => void;
};

// =============================================================================
// Combined
// =============================================================================

export type HistoryStore = HistoryStoreState & HistoryStoreActions;
