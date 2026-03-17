import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TabBar from './TabBar';

describe('TabBar', () => {
  const defaultTabs = [
    { id: 'tab1', label: 'タブ1' },
    { id: 'tab2', label: 'タブ2' },
    { id: 'tab3', label: 'タブ3' },
  ];

  it('タブ一覧が表示される', () => {
    render(<TabBar tabs={defaultTabs} active="tab1" onChange={vi.fn()} />);
    expect(screen.getByText('タブ1')).toBeInTheDocument();
    expect(screen.getByText('タブ2')).toBeInTheDocument();
    expect(screen.getByText('タブ3')).toBeInTheDocument();
  });

  it('アクティブタブが強調表示される', () => {
    render(<TabBar tabs={defaultTabs} active="tab2" onChange={vi.fn()} />);
    const activeTab = screen.getByTestId('ui-tab-tab2');
    expect(activeTab).toBeInTheDocument();
  });

  it('タブクリックで onChange が呼ばれる', async () => {
    const onChange = vi.fn();
    render(<TabBar tabs={defaultTabs} active="tab1" onChange={onChange} />);

    await userEvent.click(screen.getByTestId('ui-tab-tab3'));
    expect(onChange).toHaveBeenCalledWith('tab3');
  });

  it('data-testid が正しく設定される', () => {
    render(<TabBar tabs={defaultTabs} active="tab1" onChange={vi.fn()} />);
    expect(screen.getByTestId('ui-tab-bar')).toBeInTheDocument();
    expect(screen.getByTestId('ui-tab-tab1')).toBeInTheDocument();
    expect(screen.getByTestId('ui-tab-tab2')).toBeInTheDocument();
    expect(screen.getByTestId('ui-tab-tab3')).toBeInTheDocument();
  });

  it('単一タブでも表示される', () => {
    const singleTab = [{ id: 'single', label: '単一タブ' }];
    render(<TabBar tabs={singleTab} active="single" onChange={vi.fn()} />);
    expect(screen.getByText('単一タブ')).toBeInTheDocument();
    expect(screen.getByTestId('ui-tab-single')).toBeInTheDocument();
  });

  it('空のタブリストで何も表示されない', () => {
    render(<TabBar tabs={[]} active="" onChange={vi.fn()} />);
    expect(screen.queryByTestId('ui-tab-bar')).toBeInTheDocument();
  });

  it('アクティブタブの変更でスタイルが更新される', () => {
    const { rerender } = render(<TabBar tabs={defaultTabs} active="tab1" onChange={vi.fn()} />);
    const tab1 = screen.getByTestId('ui-tab-tab1');
    const tab2 = screen.getByTestId('ui-tab-tab2');

    expect(tab1).toBeInTheDocument();
    expect(tab2).toBeInTheDocument();

    rerender(<TabBar tabs={defaultTabs} active="tab2" onChange={vi.fn()} />);
    expect(screen.getByTestId('ui-tab-tab2')).toBeInTheDocument();
  });

  it('カスタムクラス名が適用される', () => {
    render(<TabBar tabs={defaultTabs} active="tab1" onChange={vi.fn()} className="custom-class" />);
    const tabBar = screen.getByTestId('ui-tab-bar');
    expect(tabBar).toHaveClass('custom-class');
  });

  it('各タブがクリック可能である', async () => {
    const onChange = vi.fn();
    render(<TabBar tabs={defaultTabs} active="tab1" onChange={onChange} />);

    await userEvent.click(screen.getByTestId('ui-tab-tab1'));
    expect(onChange).toHaveBeenCalledWith('tab1');

    await userEvent.click(screen.getByTestId('ui-tab-tab2'));
    expect(onChange).toHaveBeenCalledWith('tab2');

    await userEvent.click(screen.getByTestId('ui-tab-tab3'));
    expect(onChange).toHaveBeenCalledWith('tab3');
  });

  it('日本語ラベルで表示される', () => {
    const japaneseTabs = [
      { id: 'home', label: 'ホーム' },
      { id: 'settings', label: '設定' },
      { id: 'about', label: 'について' },
    ];
    render(<TabBar tabs={japaneseTabs} active="home" onChange={vi.fn()} />);
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
    expect(screen.getByText('について')).toBeInTheDocument();
  });
});
