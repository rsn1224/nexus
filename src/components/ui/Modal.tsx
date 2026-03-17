import type React from 'react';
import { useEffect } from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  footer,
  className = '',
}: ModalProps): React.ReactElement | null {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      data-testid="ui-modal-overlay"
      role="none"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {closeOnBackdropClick && (
        <button
          type="button"
          aria-label="モーダルを閉じる"
          className="absolute inset-0 w-full h-full bg-black bg-opacity-50 cursor-default"
          onClick={onClose}
          tabIndex={-1}
        />
      )}
      {!closeOnBackdropClick && (
        <div role="none" className="absolute inset-0 bg-black bg-opacity-50" />
      )}
      <div
        data-testid="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl w-full ${sizeClasses[size]} ${className}`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
            {title && (
              <h2
                id="modal-title"
                className="font-[var(--font-mono)] text-[12px] font-semibold text-[var(--color-text-primary)] uppercase"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ✕
              </Button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-4 py-4 max-h-[70vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--color-border-subtle)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Modalコンポーネントのヘルパー関数
export const ModalActions = {
  Close: ({
    onClose,
    children = '閉じる',
  }: {
    onClose: () => void;
    children?: React.ReactNode;
  }) => (
    <Button variant="secondary" onClick={onClose}>
      {children}
    </Button>
  ),

  Confirm: ({
    onConfirm,
    children = '確認',
    disabled = false,
  }: {
    onConfirm: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <Button variant="primary" onClick={onConfirm} disabled={disabled}>
      {children}
    </Button>
  ),

  Danger: ({
    onConfirm,
    children = '削除',
    disabled = false,
  }: {
    onConfirm: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <Button variant="danger" onClick={onConfirm} disabled={disabled}>
      {children}
    </Button>
  ),
};
