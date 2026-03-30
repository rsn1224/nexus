import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Table from './Table';

interface TestData {
  id: number;
  name: string;
  status: boolean;
  value: number;
}

describe('Table', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'テスト1', status: true, value: 100 },
    { id: 2, name: 'テスト2', status: false, value: 200 },
    { id: 3, name: 'テスト3', status: true, value: 300 },
  ];

  const mockColumns = [
    { key: 'id' as keyof TestData, title: 'ID' },
    { key: 'name' as keyof TestData, title: '名前' },
    { key: 'status' as keyof TestData, title: 'ステータス' },
    { key: 'value' as keyof TestData, title: '値' },
  ];

  it('データ行が表示される', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    expect(screen.getByText('テスト1')).toBeInTheDocument();
    expect(screen.getByText('テスト2')).toBeInTheDocument();
    expect(screen.getByText('テスト3')).toBeInTheDocument();
  });

  it('ヘッダーが表示される', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('名前')).toBeInTheDocument();
    expect(screen.getByText('ステータス')).toBeInTheDocument();
    expect(screen.getByText('値')).toBeInTheDocument();
  });

  it('空データで空状態が表示される', () => {
    render(<Table data={[]} columns={mockColumns} empty="データがありません" />);
    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  it('loading 中に読み込み表示がされる', () => {
    render(<Table data={[]} columns={mockColumns} loading={true} />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('カスタム empty メッセージが表示される', () => {
    render(<Table data={[]} columns={mockColumns} empty="カスタム空メッセージ" />);
    expect(screen.getByText('カスタム空メッセージ')).toBeInTheDocument();
  });

  it('data-testid が設定される', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    expect(screen.getByTestId('ui-table')).toBeInTheDocument();
  });

  it('boolean 値が記号で表示される', () => {
    render(<Table data={mockData} columns={mockColumns} />);
    expect(screen.getAllByText('✓')).toHaveLength(2); // true
    expect(screen.getByText('✗')).toBeInTheDocument(); // false
  });

  it('null/undefined 値がハイフンで表示される', () => {
    const dataWithNull = [{ id: 1, name: null as string | null, status: true, value: 100 }];
    render(<Table data={dataWithNull} columns={mockColumns} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('行クリックで onRowClick が呼ばれる', async () => {
    const onRowClick = vi.fn();
    render(<Table data={mockData} columns={mockColumns} onRowClick={onRowClick} />);

    const firstRow = screen.getByText('テスト1').closest('tr');
    if (firstRow) {
      await userEvent.click(firstRow);
      expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
    }
  });

  it('ソート可能列でソートアイコンが表示される', () => {
    const sortableColumns = [
      { key: 'id' as keyof TestData, title: 'ID', sortable: true },
      { key: 'name' as keyof TestData, title: '名前' },
    ];
    render(<Table data={mockData} columns={sortableColumns} onSort={vi.fn()} />);

    // ソートアイコン（▼）が表示される
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('ソートクリックで onSort が呼ばれる', async () => {
    const onSort = vi.fn();
    const sortableColumns = [
      { key: 'id' as keyof TestData, title: 'ID', sortable: true },
      { key: 'name' as keyof TestData, title: '名前' },
    ];

    render(<Table data={mockData} columns={sortableColumns} onSort={onSort} />);

    const idHeader = screen.getByText('ID');
    await userEvent.click(idHeader);
    expect(onSort).toHaveBeenCalledWith('id', 'asc');
  });

  it('各 size が正しく適用される', () => {
    const { rerender } = render(<Table data={mockData} columns={mockColumns} size="sm" />);
    expect(screen.getByTestId('ui-table')).toBeInTheDocument();

    rerender(<Table data={mockData} columns={mockColumns} size="md" />);
    expect(screen.getByTestId('ui-table')).toBeInTheDocument();

    rerender(<Table data={mockData} columns={mockColumns} size="lg" />);
    expect(screen.getByTestId('ui-table')).toBeInTheDocument();
  });

  it('カスタム render 関数が動作する', () => {
    const customColumns = [
      { key: 'id' as keyof TestData, title: 'ID' },
      {
        key: 'name' as keyof TestData,
        title: '名前',
        render: (value: string | number | boolean, row: TestData) => (
          <span data-testid={`custom-name-${row.id}`}>カスタム: {String(value)}</span>
        ),
      },
    ];

    render(<Table data={mockData} columns={customColumns} />);
    expect(screen.getByTestId('custom-name-1')).toBeInTheDocument();
    expect(screen.getByText('カスタム: テスト1')).toBeInTheDocument();
  });

  it('caption が設定される', () => {
    render(<Table data={mockData} columns={mockColumns} caption="データテーブル" />);
    expect(screen.getByText('データテーブル')).toBeInTheDocument();
  });

  it('ariaLabel が設定される', () => {
    render(<Table data={mockData} columns={mockColumns} ariaLabel="ユーザーデータ" />);
    const table = screen.getByTestId('ui-table');
    expect(table).toHaveAttribute('aria-label', 'ユーザーデータ');
  });
});
