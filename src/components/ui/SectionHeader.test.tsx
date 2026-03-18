import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SectionHeader from './SectionHeader';

describe('SectionHeader', () => {
  it('renders title with default accent color', () => {
    render(<SectionHeader title="▶ HOME / OVERVIEW" />);

    const title = screen.getByText('▶ HOME / OVERVIEW');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-accent-500');
  });

  it('renders title with accent color explicitly', () => {
    render(<SectionHeader title="▶ SETTINGS" color="accent" />);

    const title = screen.getByText('▶ SETTINGS');
    expect(title).toHaveClass('text-accent-500');
  });

  it('renders title with muted color', () => {
    render(<SectionHeader title="▶ INFO" color="muted" />);

    const title = screen.getByText('▶ INFO');
    expect(title).toHaveClass('text-text-muted');
  });

  it('renders children when provided', () => {
    render(
      <SectionHeader title="▶ HOME">
        <button type="button">Save</button>
        <button type="button">Cancel</button>
      </SectionHeader>,
    );

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render children section when not provided', () => {
    render(<SectionHeader title="▶ HOME" />);

    // Should not have a div with flex items gap-2
    const childrenContainer = screen.queryByRole('button');
    expect(childrenContainer).not.toBeInTheDocument();
  });

  it('has correct base classes for container', () => {
    render(<SectionHeader title="TEST" />);

    const container = screen.getByText('TEST').parentElement;
    expect(container).toHaveClass(
      'px-4',
      'py-[10px]',
      'border-b',
      'border-border-subtle',
      'flex-shrink-0',
      'flex',
      'items-center',
      'justify-between',
    );
  });

  it('has correct classes for title', () => {
    render(<SectionHeader title="TEST" />);

    const title = screen.getByText('TEST');
    expect(title).toHaveClass('font-mono', 'text-[11px]', 'font-bold', 'tracking-[0.15em]');
  });

  it('children container has correct classes', () => {
    render(
      <SectionHeader title="TEST">
        <button type="button">Child</button>
      </SectionHeader>,
    );

    const childrenContainer = screen.getByText('Child').parentElement;
    expect(childrenContainer).toHaveClass('flex', 'items-center', 'gap-2');
  });
});
