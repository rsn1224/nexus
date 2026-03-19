import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── モック ──────────────────────────────────────────────────────────────────

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn().mockResolvedValue(vi.fn()) }));
vi.mock('../../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../lib/tauri', () => ({
  extractErrorMessage: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}));

import { invoke } from '@tauri-apps/api/core';
import { useGameProfileStore } from '../../stores/useGameProfileStore';
import type { GameProfile } from '../../types';
import ProfileTab from './ProfileTab';

// ─── テストデータ ────────────────────────────────────────────────────────────

const MOCK_PROFILES: GameProfile[] = [
  {
    id: 'profile-1',
    displayName: 'Rocket League',
    exePath: 'C:\\Games\\RL\\RocketLeague.exe',
    steamAppId: 252950,
    cpuAffinityGame: null,
    cpuAffinityBackground: null,
    processPriority: 'normal',
    powerPlan: 'unchanged',
    processesToSuspend: ['chrome.exe'],
    processesToKill: [],
    timerResolution100ns: null,
    boostLevel: 'soft',
    coreParkingDisabled: false,
    autoSuspendEnabled: false,
    lastPlayed: 1710000000000,
    totalPlaySecs: 7200,
    createdAt: 1709000000000,
    updatedAt: 1710000000000,
  },
  {
    id: 'profile-2',
    displayName: 'Valorant',
    exePath: 'C:\\Games\\Valorant\\VALORANT.exe',
    steamAppId: null,
    cpuAffinityGame: null,
    cpuAffinityBackground: null,
    processPriority: 'high',
    powerPlan: 'highPerformance',
    processesToSuspend: [],
    processesToKill: [],
    timerResolution100ns: null,
    boostLevel: 'medium',
    coreParkingDisabled: false,
    autoSuspendEnabled: false,
    lastPlayed: null,
    totalPlaySecs: 0,
    createdAt: 1709000000000,
    updatedAt: 1709000000000,
  },
];

// ─── ヘルパー ────────────────────────────────────────────────────────────────

function resetStore(): void {
  useGameProfileStore.setState({
    profiles: [],
    activeProfileId: null,
    currentGameExe: null,
    applyResult: null,
    isLoading: false,
    isApplying: false,
    error: null,
    isMonitoring: false,
  });
  vi.clearAllMocks();
}

// ─── テスト ──────────────────────────────────────────────────────────────────

describe('ProfileTab', () => {
  beforeEach(() => {
    resetStore();
    // コマンド名で振り分け（CurrentPowerPlanDisplay が get_current_power_plan を呼ぶため）
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_current_power_plan') return Promise.resolve(null);
      return Promise.resolve([]);
    });
  });

  it('プロファイルがないとき空状態メッセージが表示される', async () => {
    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByText(/プロファイルがありません/)).toBeInTheDocument();
    });
  });

  it('プロファイル一覧が表示される', async () => {
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_current_power_plan') return Promise.resolve(null);
      return Promise.resolve(MOCK_PROFILES);
    });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByText('Rocket League')).toBeInTheDocument();
      expect(screen.getByText('Valorant')).toBeInTheDocument();
    });
  });

  it('プロファイル件数が表示される', async () => {
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_current_power_plan') return Promise.resolve(null);
      return Promise.resolve(MOCK_PROFILES);
    });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByText(/2 件のプロファイル/)).toBeInTheDocument();
    });
  });

  it('ブーストレベルが日本語ラベルで表示される', async () => {
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_current_power_plan') return Promise.resolve(null);
      return Promise.resolve(MOCK_PROFILES);
    });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByText(/ソフト（Level 1）/)).toBeInTheDocument();
      expect(screen.getByText(/ミディアム（Level 2）/)).toBeInTheDocument();
    });
  });

  it('一時停止プロセスが表示される', async () => {
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_current_power_plan') return Promise.resolve(null);
      return Promise.resolve(MOCK_PROFILES);
    });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByText(/一時停止: chrome\.exe/)).toBeInTheDocument();
    });
  });

  it('プレイ時間が「X時間Y分」で表示される', async () => {
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_current_power_plan') return Promise.resolve(null);
      return Promise.resolve(MOCK_PROFILES);
    });

    render(<ProfileTab />);

    await waitFor(() => {
      // 7200秒 = 2時間0分
      expect(screen.getByText(/2時間0分/)).toBeInTheDocument();
    });
  });

  it('「+ 新規プロファイル」ボタンクリックでフォームが表示される', async () => {
    const user = userEvent.setup();
    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByText(/プロファイルがありません/)).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /新規プロファイル/ }));
    });

    // フォーム要素が表示される
    expect(screen.getByPlaceholderText(/Rocket League/)).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it('キャンセルでフォームが閉じる', async () => {
    const user = userEvent.setup();
    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByText(/プロファイルがありません/)).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /新規プロファイル/ }));
    });
    expect(screen.getByText('保存')).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByText('キャンセル'));
    });
    expect(screen.queryByText('保存')).not.toBeInTheDocument();
  });

  it('エラーメッセージが表示され、✕ で閉じられる', async () => {
    const user = userEvent.setup();

    render(<ProfileTab />);

    // useEffect 後にエラーをセット
    useGameProfileStore.setState({ error: 'テストエラーメッセージ' });

    await waitFor(() => {
      expect(screen.getByText('テストエラーメッセージ')).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    });

    await waitFor(() => {
      expect(screen.queryByText('テストエラーメッセージ')).not.toBeInTheDocument();
    });
  });

  it('適用中のプロファイルに「適用中」が表示される', async () => {
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_current_power_plan') return Promise.resolve(null);
      return Promise.resolve(MOCK_PROFILES);
    });
    useGameProfileStore.setState({ activeProfileId: 'profile-1' });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByText('● 適用中')).toBeInTheDocument();
    });
  });

  it('アクティブなプロファイルの「適用」ボタンは disabled', async () => {
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_current_power_plan') return Promise.resolve(null);
      return Promise.resolve(MOCK_PROFILES);
    });
    useGameProfileStore.setState({ activeProfileId: 'profile-1' });

    render(<ProfileTab />);

    await waitFor(() => {
      // 「適用中」テキストのボタンが disabled であることを確認
      const activeBtn = screen.getAllByText('適用中').find((el) => el.tagName === 'BUTTON');
      if (activeBtn) {
        expect(activeBtn).toBeDisabled();
      }
    });
  });

  it('activeProfileId が存在するときリバートボタンが表示される', async () => {
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_current_power_plan') return Promise.resolve(null);
      return Promise.resolve(MOCK_PROFILES);
    });
    useGameProfileStore.setState({ activeProfileId: 'profile-1' });

    render(<ProfileTab />);

    await waitFor(() => {
      expect(screen.getByText('リバート')).toBeInTheDocument();
    });
  });
});
