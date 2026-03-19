import { create } from 'zustand';
import type { WingId } from '../types';
import type { Breadcrumb, NavigateOptions, SubpageEntry, WingNavState } from '../types/navigation';

// ─── 定数 ────────────────────────────────────────────────────────────────────

/** サブページスタックの最大深度。超過時は push を無視する。 */
export const MAX_SUBPAGE_DEPTH = 5;

/** Wing の表示名マップ（パンくず用） */
const WING_LABELS: Record<WingId, string> = {
  home: 'HOME',
  performance: 'PERFORMANCE',
  games: 'GAMES',
  hardware: 'HARDWARE',
  network: 'NETWORK',
  storage: 'STORAGE',
  settings: 'SETTINGS',
  log: 'LOG',
};

const ALL_WING_IDS: WingId[] = [
  'home',
  'performance',
  'games',
  'hardware',
  'network',
  'storage',
  'settings',
  'log',
];

function makeInitialWingStates(): Record<WingId, WingNavState> {
  const states = {} as Record<WingId, WingNavState>;
  for (const id of ALL_WING_IDS) {
    states[id] = { activeTab: null, subpageStack: [] };
  }
  return states;
}

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

// ─── セレクタ（store 外の純粋関数） ──────────────────────────────────────────

/**
 * 指定 Wing のパンくずリストを構築する。
 * WingHeader から呼ぶこと。
 *
 * 例:
 *   Wing: performance, tab: profiles, stack: [{ title: 'Valorant' }]
 *   → [
 *       { label: 'PERFORMANCE', onClick: () => clearSubpages('performance') },
 *       { label: 'PROFILES',    onClick: () => clearSubpages + setTab },
 *       { label: 'Valorant',    onClick: null },  // 現在地
 *     ]
 */
export function buildBreadcrumbs(
  wingId: WingId,
  wingState: WingNavState,
  actions: {
    clearSubpages: (wingId: WingId) => void;
    setTab: (wingId: WingId, tabId: string) => void;
    popSubpage: (wingId: WingId) => void;
  },
): Breadcrumb[] {
  const crumbs: Breadcrumb[] = [];
  const { activeTab, subpageStack } = wingState;
  const hasTab = activeTab !== null;
  const hasSubpages = subpageStack.length > 0;

  // Wing 名
  crumbs.push({
    label: WING_LABELS[wingId],
    onClick:
      hasTab || hasSubpages
        ? () => {
            actions.clearSubpages(wingId);
          }
        : null,
  });

  // タブ名
  if (hasTab) {
    crumbs.push({
      label: activeTab.toUpperCase(),
      onClick: hasSubpages
        ? () => {
            actions.clearSubpages(wingId);
            actions.setTab(wingId, activeTab);
          }
        : null,
    });
  }

  // サブページスタック
  subpageStack.forEach((entry, i) => {
    const isLast = i === subpageStack.length - 1;
    crumbs.push({
      label: entry.title.toUpperCase(),
      onClick: isLast
        ? null
        : () => {
            // このエントリまで pop する
            const popsNeeded = subpageStack.length - 1 - i;
            for (let j = 0; j < popsNeeded; j++) {
              actions.popSubpage(wingId);
            }
          },
    });
  });

  return crumbs;
}
