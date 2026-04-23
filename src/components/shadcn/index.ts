/**
 * shadcn-style components (PoC) — バレルエクスポート
 *
 * 使用: `import { Button, Dialog } from '@/components/shadcn';`
 * 既存 src/components/ui/* と並行配置。既存実装を破壊しない。
 */
export { Button, type ButtonProps, buttonVariants } from './button';
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
} from './command';
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog';
