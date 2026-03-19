import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WingId } from '../types';
import type { WingNavState } from '../types/navigation';
import { ALL_WING_IDS, buildBreadcrumbs, makeInitialWingStates, WING_LABELS } from './navigation';

describe('WING_LABELS', () => {
  it('全5ウィングのラベルが定義されている', () => {
    const expectedIds: WingId[] = ['dashboard', 'gaming', 'monitor', 'history', 'settings'];
    for (const id of expectedIds) {
      expect(WING_LABELS[id]).toBeDefined();
      expect(typeof WING_LABELS[id]).toBe('string');
    }
  });

  it('各ラベルが空文字でない', () => {
    for (const id of ALL_WING_IDS) {
      expect(WING_LABELS[id].length).toBeGreaterThan(0);
    }
  });
});

describe('ALL_WING_IDS', () => {
  it('5つのウィングIDを含む', () => {
    expect(ALL_WING_IDS).toHaveLength(5);
  });

  it('全ての必須IDが含まれている', () => {
    const required: WingId[] = ['dashboard', 'gaming', 'monitor', 'history', 'settings'];
    for (const id of required) {
      expect(ALL_WING_IDS).toContain(id);
    }
  });
});

describe('makeInitialWingStates', () => {
  it('全5ウィングの初期状態を生成する', () => {
    const states = makeInitialWingStates();
    expect(Object.keys(states)).toHaveLength(5);
  });

  it('各ウィングの初期状態が正しい構造を持つ', () => {
    const states = makeInitialWingStates();
    for (const id of ALL_WING_IDS) {
      expect(states[id]).toEqual({ activeTab: null, subpageStack: [] });
    }
  });

  it('呼び出しごとに新しいオブジェクトを返す', () => {
    const a = makeInitialWingStates();
    const b = makeInitialWingStates();
    expect(a).not.toBe(b);
  });
});

describe('buildBreadcrumbs', () => {
  const mockActions = {
    clearSubpages: vi.fn(),
    setTab: vi.fn(),
    popSubpage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ウィングのみ: ラベル1つ、onClickはnull', () => {
    const state: WingNavState = { activeTab: null, subpageStack: [] };
    const crumbs = buildBreadcrumbs('dashboard', state, mockActions);
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].label).toBe('DASHBOARD');
    expect(crumbs[0].onClick).toBeNull();
  });

  it('ウィング+タブ: ラベル2つ、ウィングにonClick、タブはnull', () => {
    const state: WingNavState = { activeTab: 'profiles', subpageStack: [] };
    const crumbs = buildBreadcrumbs('gaming', state, mockActions);
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0].label).toBe('GAMING');
    expect(crumbs[0].onClick).not.toBeNull();
    expect(crumbs[1].label).toBe('PROFILES');
    expect(crumbs[1].onClick).toBeNull();
  });

  it('ウィング+タブ+サブページ: ラベル3つ、最後のonClickはnull', () => {
    const state: WingNavState = {
      activeTab: 'profiles',
      subpageStack: [{ title: 'Valorant', id: 'val', params: {} }],
    };
    const crumbs = buildBreadcrumbs('gaming', state, mockActions);
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0].label).toBe('GAMING');
    expect(crumbs[1].label).toBe('PROFILES');
    expect(crumbs[2].label).toBe('VALORANT');
    expect(crumbs[2].onClick).toBeNull();
  });

  it('ウィングのonClickがclearSubpagesを呼ぶ', () => {
    const state: WingNavState = { activeTab: 'tab1', subpageStack: [] };
    const crumbs = buildBreadcrumbs('monitor', state, mockActions);
    crumbs[0].onClick?.();
    expect(mockActions.clearSubpages).toHaveBeenCalledWith('monitor');
  });

  it('タブのonClickがサブページ有りのときclearSubpages+setTabを呼ぶ', () => {
    const state: WingNavState = {
      activeTab: 'overview',
      subpageStack: [{ title: 'Detail', id: 'd1', params: {} }],
    };
    const crumbs = buildBreadcrumbs('history', state, mockActions);
    expect(crumbs[1].onClick).not.toBeNull();
    crumbs[1].onClick?.();
    expect(mockActions.clearSubpages).toHaveBeenCalledWith('history');
    expect(mockActions.setTab).toHaveBeenCalledWith('history', 'overview');
  });

  it('複数サブページの中間クリックでpopSubpageが正しい回数呼ばれる', () => {
    const state: WingNavState = {
      activeTab: 'tab',
      subpageStack: [
        { title: 'A', id: 'a', params: {} },
        { title: 'B', id: 'b', params: {} },
        { title: 'C', id: 'c', params: {} },
      ],
    };
    const crumbs = buildBreadcrumbs('gaming', state, mockActions);
    expect(crumbs).toHaveLength(5);
    // Click on 'A' (index 2), should pop 2 times (B and C)
    crumbs[2].onClick?.();
    expect(mockActions.popSubpage).toHaveBeenCalledTimes(2);
  });
});
