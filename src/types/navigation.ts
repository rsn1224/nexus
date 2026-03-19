/**
 * Wing 内ナビゲーション型定義
 *
 * 設計原則:
 * - タブ = Wing 内の並列ビュー（TabBar で切替）
 * - サブページ = 特定タブ内の階層的な深掘り（push/pop スタック）
 * - URL ルーティングは使わない（Tauri デスクトップアプリ）
 */

/**
 * サブページエントリ。スタックの 1 要素。
 *
 * id は Wing ごとに固有の文字列リテラル（例: 'profile-edit', 'session-detail'）。
 * string 型にすることで各 Wing が独自に拡張できる。
 *
 * params は Record<string, unknown> で汎用性を保つ。
 * 使用側でキャストして narrowing する（例: params.profileId as string | undefined）。
 */
export interface SubpageEntry {
  /** サブページ種別（例: 'profile-edit', 'session-detail', 'session-compare'） */
  id: string;
  /** サブページに渡すパラメータ */
  params: Record<string, unknown>;
  /** パンくず表示用タイトル（日本語可） */
  title: string;
}

/**
 * Wing ごとのナビゲーション状態
 */
export interface WingNavState {
  /** 現在アクティブなタブ ID。null = タブなし（各 Wing のデフォルトを使用） */
  activeTab: string | null;
  /**
   * サブページスタック。最大 MAX_SUBPAGE_DEPTH 件。
   * 末尾が現在表示中のサブページ。
   */
  subpageStack: SubpageEntry[];
}

/**
 * navigateTo の追加オプション
 */
export interface NavigateOptions {
  /** 切替先タブ ID。指定時はタブを切替え、サブページスタックをクリアする */
  tab?: string;
  /** 指定時はタブ切替後にサブページを push する */
  subpage?: SubpageEntry;
}

/**
 * Breadcrumb コンポーネントに渡す 1 要素
 */
export interface Breadcrumb {
  /** 表示ラベル（uppercase で表示） */
  label: string;
  /**
   * クリックハンドラ。
   * null = クリック不可（最後の要素 = 現在地）
   */
  onClick: (() => void) | null;
}
