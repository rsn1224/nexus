import type { WingId } from '../types';
import type { Breadcrumb, SubpageEntry, WingNavState } from '../types/navigation';

/** Wing の表示名マップ（パンくず用） */
export const WING_LABELS: Record<WingId, string> = {
  core: 'CORE',
  arsenal: 'ARSENAL',
  tactics: 'TACTICS',
  logs: 'LOGS',
  settings: 'SETTINGS',
};

export const ALL_WING_IDS: WingId[] = ['core', 'arsenal', 'tactics', 'logs', 'settings'];

export function makeInitialWingStates(): Record<WingId, WingNavState> {
  const states = {} as Record<WingId, WingNavState>;
  for (const id of ALL_WING_IDS) {
    states[id] = { activeTab: null, subpageStack: [] };
  }
  return states;
}

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
  subpageStack.forEach((entry: SubpageEntry, i: number) => {
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
