import { create } from 'zustand';
import { makeInitialWingStates } from '../lib/navigation';
import type { WingId } from '../types';
import type { NavigateOptions, SubpageEntry, WingNavState } from '../types/navigation';

// ─── 定数 ────────────────────────────────────────────────────────────────────

/** サブページスタックの最大深度。超過時は push を無視する。 */
export const MAX_SUBPAGE_DEPTH = 5;

// ─── Store インターフェース ────────────────────────────────────────────────────

interface NavStore {
  // ── 後方互換 ──────────────────────────────────────────────────────────────
  /**
   * Wing 切替（App.tsx の setActiveWing に delegate）。
   * 後方互換のため維持。内部実装は setNavigate で注入される。
   */
  navigate: (wing: WingId) => void;
  /** App.tsx が起動時に登録するコールバック */
  setNavigate: (fn: (wing: WingId) => void) => void;

  // ── Wing 状態 ─────────────────────────────────────────────────────────────
  /** 現在アクティブな Wing ID。Escape キーハンドラーから参照する。 */
  activeWing: WingId;
  wingStates: Record<WingId, WingNavState>;

  // ── アクション ────────────────────────────────────────────────────────────
  /**
   * Wing + タブ + サブページを一括指定して遷移。
   * tab を指定するとサブページスタックをクリアしてからタブを設定。
   * subpage を指定すると tab 設定後にサブページを push。
   */
  navigateTo: (wingId: WingId, options?: NavigateOptions) => void;

  /** タブのみ切替。サブページスタックをクリアする。 */
  setTab: (wingId: WingId, tabId: string) => void;

  /**
   * サブページを push。
   * スタックが MAX_SUBPAGE_DEPTH を超える場合は無視（警告なし）。
   */
  pushSubpage: (wingId: WingId, entry: SubpageEntry) => void;

  /** サブページを 1 つ pop。スタックが空なら何もしない。 */
  popSubpage: (wingId: WingId) => void;

  /** サブページスタックを全クリア。 */
  clearSubpages: (wingId: WingId) => void;
}

// ─── Store 実装 ───────────────────────────────────────────────────────────────

export const useNavStore = create<NavStore>((set, get) => ({
  // ── 後方互換 ──────────────────────────────────────────────────────────────
  navigate: () => {},
  setNavigate: (fn) =>
    set({
      navigate: (wing: WingId) => {
        fn(wing);
        set({ activeWing: wing });
      },
    }),

  // ── 状態 ──────────────────────────────────────────────────────────────────
  activeWing: 'home',
  wingStates: makeInitialWingStates(),

  // ── アクション ────────────────────────────────────────────────────────────
  navigateTo: (wingId, options) => {
    // Wing 切替（App.tsx の setActiveWing に delegate）
    get().navigate(wingId);

    if (!options) return;

    set((state) => {
      const current = state.wingStates[wingId];
      let next: WingNavState = { ...current };

      if (options.tab !== undefined) {
        // タブ切替時はサブページスタックをクリア
        next = { activeTab: options.tab, subpageStack: [] };
      }

      if (options.subpage !== undefined && next.subpageStack.length < MAX_SUBPAGE_DEPTH) {
        next = { ...next, subpageStack: [...next.subpageStack, options.subpage] };
      }

      return {
        wingStates: { ...state.wingStates, [wingId]: next },
      };
    });
  },

  setTab: (wingId, tabId) => {
    set((state) => ({
      wingStates: {
        ...state.wingStates,
        [wingId]: { activeTab: tabId, subpageStack: [] },
      },
    }));
  },

  pushSubpage: (wingId, entry) => {
    set((state) => {
      const current = state.wingStates[wingId];
      if (current.subpageStack.length >= MAX_SUBPAGE_DEPTH) return state;
      return {
        wingStates: {
          ...state.wingStates,
          [wingId]: {
            ...current,
            subpageStack: [...current.subpageStack, entry],
          },
        },
      };
    });
  },

  popSubpage: (wingId) => {
    set((state) => {
      const current = state.wingStates[wingId];
      if (current.subpageStack.length === 0) return state;
      return {
        wingStates: {
          ...state.wingStates,
          [wingId]: {
            ...current,
            subpageStack: current.subpageStack.slice(0, -1),
          },
        },
      };
    });
  },

  clearSubpages: (wingId) => {
    set((state) => ({
      wingStates: {
        ...state.wingStates,
        [wingId]: { ...state.wingStates[wingId], subpageStack: [] },
      },
    }));
  },
}));

// ─── 後方互換 re-export ───────────────────────────────────────────────────────
export { buildBreadcrumbs } from '../lib/navigation';
