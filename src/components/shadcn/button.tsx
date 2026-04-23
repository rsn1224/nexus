/**
 * shadcn-style Button for nexus (PoC)
 *
 * - React 19 ref-as-prop（no forwardRef）
 * - cva でバリアント管理
 * - Radix Slot で asChild パターン対応
 * - nexus デザイントークン（accent/base/danger）へマッピング
 *
 * 既存 <Button> (src/components/ui/Button.tsx) と並行配置。移行時に段階置換する。
 */
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1 cursor-pointer border transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-accent-600 to-accent-500 text-base-900 border-accent-500 font-bold uppercase tracking-wide hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] focus-visible:ring-accent-500/50',
        secondary:
          'bg-base-700 text-text-primary border-border-subtle hover:bg-base-600 focus-visible:ring-border-subtle',
        ghost:
          'bg-transparent text-text-secondary border-border-subtle hover:bg-base-700 focus-visible:ring-border-subtle',
        danger:
          'bg-danger-500 text-base-900 border-danger-500 hover:bg-danger-500/90 focus-visible:ring-danger-500/50',
        outline:
          'bg-transparent text-text-primary border-border-active hover:bg-base-700 focus-visible:ring-border-active',
      },
      size: {
        sm: 'text-[11px] px-2 py-1 [&_svg]:size-3',
        md: 'text-[11px] px-3 py-2 [&_svg]:size-3.5',
        lg: 'text-[11px] px-4 py-3 [&_svg]:size-4',
        icon: 'size-8 [&_svg]:size-4',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

export type { ButtonProps };
export { buttonVariants };
