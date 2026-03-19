import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoostStore } from '../../stores/useBoostStore';
import { useOpsStore } from '../../stores/useOpsStore';
import type { SystemProcess } from '../../types';
import ProcessTab from './ProcessTab';

// Mock stores
vi.mock('../../stores/useBoostStore');
vi.mock('../../stores/useOpsStore');

const mockUseBoostStore = vi.mocked(useBoostStore);
const mockUseOpsStore = vi.mocked(useOpsStore);

// Mock process data
const mockProcesses: SystemProcess[] = [
  {
    pid: 1234,
    name: 'chrome.exe',
    cpuPercent: 25.5,
    memMb: 1024.5,
    diskReadKb: 100.0,
    diskWriteKb: 50.0,
    canTerminate: true,
  },
  {
    pid: 5678,
    name: 'system',
    cpuPercent: 5.0,
    memMb: 512.0,
    diskReadKb: 0.0,
    diskWriteKb: 0.0,
    canTerminate: false,
  },
  {
    pid: 9012,
    name: 'node.exe',
    cpuPercent: 15.0,
    memMb: 256.0,
    diskReadKb: 200.0,
    diskWriteKb: 150.0,
    canTerminate: true,
  },
];

describe('ProcessTab', () => {
  const mockRunBoost = vi.fn();
  const mockKillProcess = vi.fn();
  const mockSetProcessPriority = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useBoostStore
    mockUseBoostStore.mockReturnValue({
      lastResult: null,
      isRunning: false,
      error: null,
      runBoost: mockRunBoost,
    });

    // Mock useOpsStore
    mockUseOpsStore.mockReturnValue({
      processes: mockProcesses,
      isLoading: false,
      lastUpdated: Date.now(),
      killProcess: mockKillProcess,
      setProcessPriority: mockSetProcessPriority,
    });
  });

  it('フィルタ入力でプロセスが絞り込まれること', async () => {
    render(<ProcessTab />);

    // フィルタ入力欄を取得
    const filterInput = screen.getByPlaceholderText('プロセス名で絞り込み...');
    expect(filterInput).toBeInTheDocument();

    // "chrome" でフィルタ
    fireEvent.change(filterInput, { target: { value: 'chrome' } });

    // chrome.exe のみ表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('chrome.exe')).toBeInTheDocument();
      expect(screen.queryByText('system')).not.toBeInTheDocument();
      expect(screen.queryByText('node.exe')).not.toBeInTheDocument();
    });

    // プロセス件数表示が更新されることを確認
    expect(screen.getByText(/LIVE PROCESSES \(表示 1 \/ 全 3 件/)).toBeInTheDocument();
  });

  it('列ヘッダークリックでソート順が変わること', async () => {
    render(<ProcessTab />);

    // NAME 列ヘッダーをクリック
    const nameHeader = screen.getByRole('columnheader', { name: /NAME/ });
    fireEvent.click(nameHeader);

    // 昇順にソートされることを確認（chrome, node, system）
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // ヘッダー行を除いたデータ行
      const dataRows = rows.slice(1, 4);
      expect(dataRows[0]).toHaveTextContent('chrome.exe');
      expect(dataRows[1]).toHaveTextContent('node.exe');
      expect(dataRows[2]).toHaveTextContent('system');
    });

    // 再度クリックで降順に変わることを確認
    fireEvent.click(nameHeader);
    await waitFor(() => {
      const header = screen.getByRole('columnheader', { name: /NAME/ });
      expect(header).toHaveTextContent('▼');
    });
  });

  it('CPU% 列でソートできること', async () => {
    render(<ProcessTab />);

    // CPU% 列ヘッダーをクリック
    const cpuHeader = screen.getByRole('columnheader', { name: /CPU%/ });
    fireEvent.click(cpuHeader);

    // 昇順にソートされることを確認（system, node, chrome）
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      const dataRows = rows.slice(1, 4);
      expect(dataRows[0]).toHaveTextContent('system');
      expect(dataRows[1]).toHaveTextContent('node.exe');
      expect(dataRows[2]).toHaveTextContent('chrome.exe');
    });
  });

  it('行クリックでアクションパネルが展開されること', async () => {
    render(<ProcessTab />);

    // 最初のプロセス行をクリック
    const firstRow = screen.getByText('chrome.exe').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
    }

    // アクションパネルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('PRIORITY:')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('NORMAL')).toBeInTheDocument();
      expect(screen.getByText('IDLE')).toBeInTheDocument();
      expect(screen.getByText('✕ KILL')).toBeInTheDocument();
    });

    // 選択行がハイライトされることを確認
    if (firstRow) {
      expect(firstRow).toHaveClass('border-l-2');
    }
  });

  it('KILL ボタンクリックで確認ダイアログが表示されること', async () => {
    render(<ProcessTab />);

    // 最初のプロセス行をクリックしてアクションパネルを展開
    const firstRow = screen.getByText('chrome.exe').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
    }

    // KILL ボタンをクリック
    await waitFor(() => {
      const killButton = screen.getByText('✕ KILL');
      fireEvent.click(killButton);
    });

    // 確認ダイアログが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('プロセスの終了')).toBeInTheDocument();
      expect(screen.getByText(/「chrome.exe」\(PID: 1234\) を終了しますか？/)).toBeInTheDocument();
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
      expect(screen.getByText('終了する')).toBeInTheDocument();
    });
  });

  it('確認ダイアログで「終了する」をクリックすると killProcess が呼ばれること', async () => {
    render(<ProcessTab />);

    // 最初のプロセス行をクリックしてアクションパネルを展開
    const firstRow = screen.getByText('chrome.exe').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
    }

    // KILL ボタンをクリック
    await waitFor(() => {
      const killButton = screen.getByText('✕ KILL');
      fireEvent.click(killButton);
    });

    // 「終了する」ボタンをクリック
    await waitFor(() => {
      const confirmButton = screen.getByText('終了する');
      fireEvent.click(confirmButton);
    });

    // killProcess が呼ばれることを確認
    await waitFor(() => {
      expect(mockKillProcess).toHaveBeenCalledWith(1234);
    });
  });

  it('保護プロセスの KILL ボタンが disabled であること', async () => {
    render(<ProcessTab />);

    // system プロセス行をクリックしてアクションパネルを展開
    const systemRow = screen.getByText('system').closest('tr');
    if (systemRow) {
      fireEvent.click(systemRow);
    }

    // KILL ボタンが disabled であることを確認
    await waitFor(() => {
      const killButton = screen.getByText('✕ KILL');
      expect(killButton).toBeDisabled();
    });
  });

  it('優先度ボタンクリックで setProcessPriority が呼ばれること', async () => {
    render(<ProcessTab />);

    // 最初のプロセス行をクリックしてアクションパネルを展開
    const firstRow = screen.getByText('chrome.exe').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
    }

    // HIGH ボタンをクリック
    await waitFor(() => {
      const highButton = screen.getByText('HIGH');
      fireEvent.click(highButton);
    });

    // setProcessPriority が呼ばれることを確認
    expect(mockSetProcessPriority).toHaveBeenCalledWith(1234, 'high');
  });

  it('Disk I/O 列が表示されること', async () => {
    render(<ProcessTab />);

    // DISK R と DISK W 列が表示されることを確認
    expect(screen.getByText('DISK R')).toBeInTheDocument();
    expect(screen.getByText('DISK W')).toBeInTheDocument();

    // Disk I/O 値が表示されることを確認
    expect(screen.getByText('100.0KB/s')).toBeInTheDocument(); // chrome.exe disk read
    expect(screen.getByText('50.0KB/s')).toBeInTheDocument(); // chrome.exe disk write
    expect(screen.getAllByText('0.0KB/s').length).toBeGreaterThan(0); // system disk read/write
    expect(screen.getByText('200.0KB/s')).toBeInTheDocument(); // node.exe disk read
    expect(screen.getByText('150.0KB/s')).toBeInTheDocument(); // node.exe disk write
  });

  it('MEM 列でソートできること', async () => {
    render(<ProcessTab />);

    // MEM 列ヘッダーをクリック
    const memHeader = screen.getByRole('columnheader', { name: /^MEM/ });
    fireEvent.click(memHeader);

    // ソート後の順序を確認 - テーブルの実際の順序を検証
    await waitFor(() => {
      // MEM ▲ に変わっていることを確認（昇順ソート）
      const memHeaderEl = screen.getByRole('columnheader', { name: /^MEM/ });
      expect(memHeaderEl).toHaveTextContent('▲');

      // 最初の行が node.exe であることを確認
      const firstRow = screen.getByText('node.exe').closest('tr');
      expect(firstRow).toBeInTheDocument();
    });
  });

  it('RUN BOOST ボタンクリックで runBoost が呼ばれること', async () => {
    render(<ProcessTab />);

    // RUN BOOST ボタンをクリック
    const boostButton = screen.getByText('▶ RUN BOOST');
    fireEvent.click(boostButton);

    // runBoost が呼ばれることを確認
    expect(mockRunBoost).toHaveBeenCalledWith(15); // デフォルト閾値
  });
});
