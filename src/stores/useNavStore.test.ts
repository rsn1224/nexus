import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubpageEntry } from '../types/navigation';
import { buildBreadcrumbs, MAX_SUBPAGE_DEPTH, useNavStore } from './useNavStore';

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

function resetStore(): void {
  useNavStore.setState({
    navigate: () => {},
    setNavigate: useNavStore.getState().setNavigate,
    wingStates: useNavStore.getInitialState().wingStates,
  });
}

const SAMPLE_ENTRY: SubpageEntry = {
  id: 'profile-edit',
  params: { profileId: 'abc' },
  title: 'Valorant',
};

// ─── テスト ───────────────────────────────────────────────────────────────────

describe('useNavStore — 後方互換', () => {
  beforeEach(resetStore);

  it('navigate は初期状態で no-op', () => {
    expect(() => useNavStore.getState().navigate('core')).not.toThrow();
  });

  it('setNavigate で navigate 関数を差し替えられる', () => {
    const mock = vi.fn();
    useNavStore.getState().setNavigate(mock);
    useNavStore.getState().navigate('arsenal');
    expect(mock).toHaveBeenCalledWith('arsenal');
  });

  it('navigate は登録した関数を正しい wingId で呼ぶ', () => {
    const mock = vi.fn();
    useNavStore.getState().setNavigate(mock);
    useNavStore.getState().navigate('logs');
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith('logs');
  });
});

describe('useNavStore — wingStates 初期値', () => {
  beforeEach(resetStore);

  it('全 Wing の初期 activeTab は null', () => {
    const { wingStates } = useNavStore.getState();
    for (const state of Object.values(wingStates)) {
      expect(state.activeTab).toBeNull();
    }
  });

  it('全 Wing の初期 subpageStack は空配列', () => {
    const { wingStates } = useNavStore.getState();
    for (const state of Object.values(wingStates)) {
      expect(state.subpageStack).toHaveLength(0);
    }
  });
});

describe('useNavStore — navigateTo', () => {
  beforeEach(resetStore);

  it('navigate を呼ぶ', () => {
    const mock = vi.fn();
    useNavStore.getState().setNavigate(mock);
    useNavStore.getState().navigateTo('arsenal');
    expect(mock).toHaveBeenCalledWith('arsenal');
  });

  it('tab 指定でタブを設定し、サブページスタックをクリアする', () => {
    // 事前にサブページを push
    useNavStore.getState().pushSubpage('arsenal', SAMPLE_ENTRY);
    useNavStore.getState().navigateTo('arsenal', { tab: 'profiles' });

    const { wingStates } = useNavStore.getState();
    expect(wingStates.arsenal.activeTab).toBe('profiles');
    expect(wingStates.arsenal.subpageStack).toHaveLength(0);
  });

  it('subpage 指定でサブページを push する', () => {
    useNavStore.getState().navigateTo('arsenal', {
      tab: 'profiles',
      subpage: SAMPLE_ENTRY,
    });

    const { wingStates } = useNavStore.getState();
    expect(wingStates.arsenal.subpageStack).toHaveLength(1);
    expect(wingStates.arsenal.subpageStack[0]).toEqual(SAMPLE_ENTRY);
  });

  it('options なしで Wing 切替のみ行う', () => {
    const mock = vi.fn();
    useNavStore.getState().setNavigate(mock);
    useNavStore.getState().navigateTo('arsenal');
    expect(mock).toHaveBeenCalledWith('arsenal');
    expect(useNavStore.getState().wingStates.arsenal.activeTab).toBeNull();
  });
});

describe('useNavStore — setTab', () => {
  beforeEach(resetStore);

  it('タブを設定する', () => {
    useNavStore.getState().setTab('arsenal', 'process');
    expect(useNavStore.getState().wingStates.arsenal.activeTab).toBe('process');
  });

  it('タブ切替でサブページスタックをクリアする', () => {
    useNavStore.getState().pushSubpage('arsenal', SAMPLE_ENTRY);
    useNavStore.getState().setTab('arsenal', 'process');
    expect(useNavStore.getState().wingStates.arsenal.subpageStack).toHaveLength(0);
  });

  it('他の Wing の状態に影響しない', () => {
    useNavStore.getState().setTab('settings', 'general');
    expect(useNavStore.getState().wingStates.arsenal.activeTab).toBeNull();
  });
});

describe('useNavStore — pushSubpage', () => {
  beforeEach(resetStore);

  it('サブページを push する', () => {
    useNavStore.getState().pushSubpage('arsenal', SAMPLE_ENTRY);
    expect(useNavStore.getState().wingStates.arsenal.subpageStack).toHaveLength(1);
    expect(useNavStore.getState().wingStates.arsenal.subpageStack[0]).toEqual(SAMPLE_ENTRY);
  });

  it('複数 push でスタックが積まれる', () => {
    const entry2: SubpageEntry = { id: 'session-detail', params: {}, title: 'セッション' };
    useNavStore.getState().pushSubpage('arsenal', SAMPLE_ENTRY);
    useNavStore.getState().pushSubpage('arsenal', entry2);
    expect(useNavStore.getState().wingStates.arsenal.subpageStack).toHaveLength(2);
  });

  it(`MAX_SUBPAGE_DEPTH (${MAX_SUBPAGE_DEPTH}) 超過時は push を無視する`, () => {
    for (let i = 0; i < MAX_SUBPAGE_DEPTH + 2; i++) {
      useNavStore
        .getState()
        .pushSubpage('arsenal', { id: `page-${i}`, params: {}, title: `Page ${i}` });
    }
    expect(useNavStore.getState().wingStates.arsenal.subpageStack).toHaveLength(MAX_SUBPAGE_DEPTH);
  });

  it('他の Wing の状態に影響しない', () => {
    useNavStore.getState().pushSubpage('arsenal', SAMPLE_ENTRY);
    expect(useNavStore.getState().wingStates.tactics.subpageStack).toHaveLength(0);
  });
});

describe('useNavStore — popSubpage', () => {
  beforeEach(resetStore);

  it('サブページを pop する', () => {
    useNavStore.getState().pushSubpage('arsenal', SAMPLE_ENTRY);
    useNavStore.getState().popSubpage('arsenal');
    expect(useNavStore.getState().wingStates.arsenal.subpageStack).toHaveLength(0);
  });

  it('スタックが空のとき pop は何もしない', () => {
    expect(() => useNavStore.getState().popSubpage('arsenal')).not.toThrow();
    expect(useNavStore.getState().wingStates.arsenal.subpageStack).toHaveLength(0);
  });

  it('複数 push 後の pop は末尾を取り除く', () => {
    const entry1: SubpageEntry = { id: 'a', params: {}, title: 'A' };
    const entry2: SubpageEntry = { id: 'b', params: {}, title: 'B' };
    useNavStore.getState().pushSubpage('arsenal', entry1);
    useNavStore.getState().pushSubpage('arsenal', entry2);
    useNavStore.getState().popSubpage('arsenal');
    const stack = useNavStore.getState().wingStates.arsenal.subpageStack;
    expect(stack).toHaveLength(1);
    expect(stack[0]).toEqual(entry1);
  });
});

describe('useNavStore — clearSubpages', () => {
  beforeEach(resetStore);

  it('スタックを全クリアする', () => {
    useNavStore.getState().pushSubpage('arsenal', SAMPLE_ENTRY);
    useNavStore.getState().pushSubpage('arsenal', { id: 'b', params: {}, title: 'B' });
    useNavStore.getState().clearSubpages('arsenal');
    expect(useNavStore.getState().wingStates.arsenal.subpageStack).toHaveLength(0);
  });

  it('activeTab は保持される', () => {
    useNavStore.getState().setTab('arsenal', 'profiles');
    useNavStore.getState().pushSubpage('arsenal', SAMPLE_ENTRY);
    useNavStore.getState().clearSubpages('arsenal');
    expect(useNavStore.getState().wingStates.arsenal.activeTab).toBe('profiles');
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

  it('タブなし・サブページなし — Wing 名のみ、onClick は null', () => {
    const crumbs = buildBreadcrumbs('arsenal', { activeTab: null, subpageStack: [] }, mockActions);
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0].label).toBe('ARSENAL');
    expect(crumbs[0].onClick).toBeNull();
  });

  it('タブあり・サブページなし — 2 段パンくず、タブは null（現在地）', () => {
    const crumbs = buildBreadcrumbs(
      'arsenal',
      { activeTab: 'profiles', subpageStack: [] },
      mockActions,
    );
    expect(crumbs).toHaveLength(2);
    expect(crumbs[0].label).toBe('ARSENAL');
    expect(crumbs[0].onClick).not.toBeNull(); // クリック可能
    expect(crumbs[1].label).toBe('PROFILES');
    expect(crumbs[1].onClick).toBeNull(); // 現在地
  });

  it('タブあり・サブページ 1 件 — 3 段パンくず', () => {
    const crumbs = buildBreadcrumbs(
      'arsenal',
      { activeTab: 'profiles', subpageStack: [SAMPLE_ENTRY] },
      mockActions,
    );
    expect(crumbs).toHaveLength(3);
    expect(crumbs[2].label).toBe('VALORANT'); // title.toUpperCase()
    expect(crumbs[2].onClick).toBeNull(); // 現在地
    expect(crumbs[1].onClick).not.toBeNull(); // タブはクリック可能
  });

  it('Wing 名クリックで clearSubpages を呼ぶ', () => {
    const crumbs = buildBreadcrumbs(
      'arsenal',
      { activeTab: 'profiles', subpageStack: [SAMPLE_ENTRY] },
      mockActions,
    );
    crumbs[0].onClick?.();
    expect(mockActions.clearSubpages).toHaveBeenCalledWith('arsenal');
  });

  it('タブクリックで clearSubpages + setTab を呼ぶ', () => {
    const crumbs = buildBreadcrumbs(
      'arsenal',
      { activeTab: 'profiles', subpageStack: [SAMPLE_ENTRY] },
      mockActions,
    );
    crumbs[1].onClick?.();
    expect(mockActions.clearSubpages).toHaveBeenCalledWith('arsenal');
    expect(mockActions.setTab).toHaveBeenCalledWith('arsenal', 'profiles');
  });
});
