import type React from 'react';

interface ErrorBannerProps {
  message: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  onDismiss?: () => void;
}

export default function ErrorBanner({
  message,
  variant = 'error',
  onDismiss,
}: ErrorBannerProps): React.ReactElement {
  const variantClasses = {
    error: 'bg-base-800 border-b border-danger-600 text-danger-500',
    warning: 'bg-base-800 border-b border-accent-500 text-accent-500',
    info: 'bg-base-800 border-b border-accent-500 text-accent-500',
    success: 'bg-base-800 border-b border-success-500 text-success-500',
  };

  return (
    <div
      role="alert"
      className={`px-4 py-2 font-mono text-[11px] flex-shrink-0 flex items-center justify-between ${variantClasses[variant]}`}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-4 text-current hover:opacity-70 transition-opacity"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
