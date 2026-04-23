/**
 * shadcn-style Command palette for nexus (PoC)
 *
 * - cmdk + Radix Dialog の統合
 * - Ctrl/Cmd+K で開く「クイックコマンド」パターン
 * - nexus デザイントークンへマッピング
 *
 * 使用例:
 *   const [open, setOpen] = useState(false);
 *   // Ctrl+K で open を切り替えるフックを別途用意
 *   <CommandDialog open={open} onOpenChange={setOpen}>
 *     <CommandInput placeholder="検索..." />
 *     <CommandList>
 *       <CommandEmpty>該当なし</CommandEmpty>
 *       <CommandGroup heading="アクション">
 *         <CommandItem onSelect={() => {}}>最適化実行</CommandItem>
 *       </CommandGroup>
 *     </CommandList>
 *   </CommandDialog>
 */
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';

function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-base-800 text-text-primary',
        className,
      )}
      {...props}
    />
  );
}

type CommandDialogProps = ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
};

function CommandDialog({
  title = 'Command Palette',
  description = 'コマンドを検索',
  children,
  className,
  ...props
}: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className={cn('overflow-hidden p-0 max-w-xl', className)}>
        <Command
          className={cn(
            '[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.12em] [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2',
            '[&_[cmdk-input-wrapper]_svg]:size-4 [&_[cmdk-input-wrapper]_svg]:text-text-muted',
            '[&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2',
          )}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex items-center gap-2 border-b border-border-subtle px-3"
      cmdk-input-wrapper=""
    >
      <Search className="size-4 shrink-0 text-text-muted" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'flex h-10 w-full rounded-md bg-transparent py-2 text-xs text-text-primary outline-none',
          'placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn('max-h-[320px] overflow-x-hidden overflow-y-auto', className)}
      {...props}
    />
  );
}

function CommandEmpty(props: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-xs text-text-muted"
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn('overflow-hidden p-1 text-text-primary', className)}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('-mx-1 h-px bg-border-subtle', className)}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm text-xs outline-none',
        'data-[selected=true]:bg-base-700 data-[selected=true]:text-text-primary',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        '[&_svg]:size-3.5 [&_svg]:text-text-muted',
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn('ml-auto text-[10px] tracking-[0.1em] text-text-muted', className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
