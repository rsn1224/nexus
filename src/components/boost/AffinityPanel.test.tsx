import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn().mockResolvedValue(vi.fn()) }));
vi.mock('../../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('../../lib/tauri', () => ({
  extractErrorMessage: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}));

import { useGameProfileStore } from '../../stores/useGameProfileStore';
import type { CpuTopology } from '../../types';
import AffinityPanel from './AffinityPanel';

const MOCK_TOPOLOGY: CpuTopology = {
  physicalCores: 8,
  logicalCores: 16,
  pCores: [0, 1, 2, 3, 4, 5, 6, 7],
  eCores: [8, 9, 10, 11, 12, 13, 14, 15],
  ccdGroups: [],
  hyperthreadingEnabled: true,
  vendorId: 'GenuineIntel',
  brand: 'Intel Core i7-12700K',
};

function setTopology(topo: CpuTopology | null): void {
  useGameProfileStore.setState({ cpuTopology: topo });
}

describe('AffinityPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTopology(MOCK_TOPOLOGY);
  });

  it('CPU 情報が表示される', () => {
    render(<AffinityPanel label="テスト" selectedCores={[]} onChange={vi.fn()} />);

    expect(screen.getByText(/Intel Core i7-12700K/)).toBeInTheDocument();
    expect(screen.getByText(/8C\/16T/)).toBeInTheDocument();
  });

  it('コアセルが論理コア数分レンダリングされる', () => {
    render(<AffinityPanel label="テスト" selectedCores={[]} onChange={vi.fn()} />);

    const coreMap = screen.getByTestId('core-map');
    // 16 コア分のセルが存在する
    expect(coreMap.children).toHaveLength(16);
  });

  it('選択中のコアが反映される', () => {
    render(<AffinityPanel label="テスト" selectedCores={[0, 2, 4]} onChange={vi.fn()} />);

    expect(screen.getByText(/選択中: 3 \/ 16 コア/)).toBeInTheDocument();
  });

  it('コアクリックで onChange が呼ばれる', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<AffinityPanel label="テスト" selectedCores={[0]} onChange={onChange} />);

    // コア 2 をクリック
    await user.click(screen.getByTestId('core-cell-2'));
    expect(onChange).toHaveBeenCalledWith([0, 2]);
  });

  it('選択済みコアをクリックすると解除される', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<AffinityPanel label="テスト" selectedCores={[0, 2]} onChange={onChange} />);

    // コア 0 をクリック（解除）
    await user.click(screen.getByTestId('core-cell-0'));
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it('P/E-Core 判別表示が出る（Intel ハイブリッド）', () => {
    render(<AffinityPanel label="テスト" selectedCores={[]} onChange={vi.fn()} />);

    expect(screen.getByText('P-Core')).toBeInTheDocument();
    expect(screen.getByText('E-Core')).toBeInTheDocument();
    expect(screen.getByText(/P: 8 \/ E: 8/)).toBeInTheDocument();
  });

  it('E-Core がない場合は凡例が表示されない', () => {
    setTopology({
      ...MOCK_TOPOLOGY,
      eCores: [],
      pCores: Array.from({ length: 16 }, (_, i) => i),
    });

    render(<AffinityPanel label="テスト" selectedCores={[]} onChange={vi.fn()} />);

    expect(screen.queryByText('E-Core')).not.toBeInTheDocument();
  });

  it('トポロジー未取得時は「取得中」メッセージが表示される', () => {
    setTopology(null);

    render(<AffinityPanel label="テスト" selectedCores={[]} onChange={vi.fn()} />);

    expect(screen.getByText(/CPU 情報を取得中/)).toBeInTheDocument();
  });

  it('「P-Core のみ」ボタンクリックで P-Core が選択される', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<AffinityPanel label="テスト" selectedCores={[]} onChange={onChange} />);

    await user.click(screen.getByText('P-Core のみ'));
    expect(onChange).toHaveBeenCalledWith([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
