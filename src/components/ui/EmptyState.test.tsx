import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders message only', () => {
    render(<EmptyState message="NO GAMES FOUND" />);

    expect(screen.getByText('NO GAMES FOUND')).toBeInTheDocument();
    expect(screen.queryByText('PRESS + ADD')).not.toBeInTheDocument();
  });

  it('renders message with action', () => {
    render(<EmptyState message="NO GAMES FOUND" action="PRESS + ADD" />);

    expect(screen.getByText('NO GAMES FOUND')).toBeInTheDocument();
    expect(screen.getByText('PRESS + ADD')).toBeInTheDocument();
  });

  it('renders custom height', () => {
    render(<EmptyState message="TEST" height="h-[200px]" />);

    const container = screen.getByText('TEST').parentElement;
    expect(container).toHaveClass('h-[200px]');
  });

  it('renders all props together', () => {
    render(<EmptyState message="NO DATA AVAILABLE" action="CLICK TO REFRESH" height="h-[300px]" />);

    const message = screen.getByText('NO DATA AVAILABLE');
    const action = screen.getByText('CLICK TO REFRESH');

    expect(message).toBeInTheDocument();
    expect(action).toBeInTheDocument();

    const container = message.parentElement;
    expect(container).toHaveClass('h-[300px]');
  });

  it('has correct base classes for container', () => {
    render(<EmptyState message="TEST" />);

    const container = screen.getByText('TEST').parentElement;
    expect(container).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'font-(--font-mono)',
      'text-[11px]',
      'text-text-muted',
    );
  });

  it('has correct classes for message', () => {
    render(<EmptyState message="TEST" />);

    const message = screen.getByText('TEST');
    expect(message).toHaveClass('tracking-[0.1em]');
  });

  it('has correct classes for action', () => {
    render(<EmptyState message="TEST" action="ACTION" />);

    const action = screen.getByText('ACTION');
    expect(action).toHaveClass('mt-1', 'text-[10px]', 'tracking-wider', 'opacity-70');
  });
});
