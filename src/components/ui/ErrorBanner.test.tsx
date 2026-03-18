import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorBanner from './ErrorBanner';

describe('ErrorBanner', () => {
  it('renders error message correctly', () => {
    render(<ErrorBanner message="Test error message" />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<ErrorBanner message="Test" variant="error" />);
    expect(screen.getByRole('alert')).toHaveClass('border-danger-600', 'text-danger-500');

    rerender(<ErrorBanner message="Test" variant="warning" />);
    expect(screen.getByRole('alert')).toHaveClass(
      'border-(--color-accent-500)',
      'text-(--color-accent-500)',
    );

    rerender(<ErrorBanner message="Test" variant="info" />);
    expect(screen.getByRole('alert')).toHaveClass('border-cyan-500', 'text-cyan-500');

    rerender(<ErrorBanner message="Test" variant="success" />);
    expect(screen.getByRole('alert')).toHaveClass(
      'border-[var(--color-success-500)]',
      'text-[var(--color-success-500)]',
    );
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Test" onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss');
    expect(dismissButton).toBeInTheDocument();
    expect(dismissButton).toHaveTextContent('✕');
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="Test" onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss');
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button when onDismiss is not provided', () => {
    render(<ErrorBanner message="Test" />);

    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });

  it('has correct base classes', () => {
    render(<ErrorBanner message="Test" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass(
      'px-4',
      'py-2',
      'font-[var(--font-mono)]',
      'text-[11px]',
      'flex-shrink-0',
      'flex',
      'items-center',
      'justify-between',
    );
  });
});
