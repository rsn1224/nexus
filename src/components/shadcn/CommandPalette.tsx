/**
 * CommandPalette (shadcn PoC 実画面組込)
 *
 * - Ctrl/Cmd+K で開閉する Command Palette
 * - 既存 useUiStore のタブ切替・パネル開閉アクションへマッピング
 * - 自己完結（外部 state 不要）
 *
 * 呼び出し: Main.tsx に <CommandPalette /> を 1 行追加するだけ。
 */
import { Gauge, History, Rocket, Settings, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useUiStore } from '@/stores/useUiStore';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const setActiveTab = useUiStore((s) => s.setActiveTab);
  const openSettings = useUiStore((s) => s.openSettings);
  const openHistory = useUiStore((s) => s.openHistory);

  // Ctrl/Cmd+K で toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []);

  const runCommand = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="コマンドを検索... (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>該当するコマンドがありません</CommandEmpty>
        <CommandGroup heading="タブ切替">
          <CommandItem onSelect={() => runCommand(() => setActiveTab('optimize'))}>
            <Zap />
            <span>Optimize タブへ</span>
            <CommandShortcut>1</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setActiveTab('monitor'))}>
            <Gauge />
            <span>Monitor タブへ</span>
            <CommandShortcut>2</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setActiveTab('boost'))}>
            <Rocket />
            <span>Boost タブへ</span>
            <CommandShortcut>3</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="パネル">
          <CommandItem onSelect={() => runCommand(openSettings)}>
            <Settings />
            <span>設定を開く</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(openHistory)}>
            <History />
            <span>履歴を開く</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
