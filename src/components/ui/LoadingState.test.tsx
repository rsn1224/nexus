import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingState from './LoadingState';

describe('LoadingState', () => {
  it('renders default message and height', () => {
    render(<LoadingState />);

    expect(screen.getByText('LOADING...')).toBeInTheDocument();
    expect(screen.getByText('LOADING...')).toHaveClass('h-[120px]');
  });

  it('renders custom message', () => {
    render(<LoadingState message="Custom loading message" />);

    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('renders custom height', () => {
    render(<LoadingState height="h-[200px]" />);

    expect(screen.getByText('LOADING...')).toHaveClass('h-[200px]');
  });

  it('renders both custom message and height', () => {
    render(<LoadingState message="Processing..." height="h-[300px]" />);

    const element = screen.getByText('Processing...');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('h-[300px]');
  });

  it('has correct base classes', () => {
    render(<LoadingState />);

    const element = screen.getByText('LOADING...');
    expect(element).toHaveClass(
      'flex',
      'items-center',
      'justify-center',
      'font-(--font-mono)',
      'text-[11px]',
      'text-text-muted',
      'tracking-[0.1em]',
    );
  });
});
