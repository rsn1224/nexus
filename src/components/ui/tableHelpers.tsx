import type React from 'react';

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export function renderCell<T>(column: TableColumn<T>, row: T): React.ReactNode {
  const value = row[column.key];

  if (column.render) {
    return column.render(value, row);
  }

  if (typeof value === 'boolean') {
    return value ? '✓' : '✗';
  }

  if (value === null || value === undefined) {
    return '-';
  }

  return String(value);
}

export function getSortIcon<T>(
  column: TableColumn<T>,
  sortKey: keyof T | undefined,
  sortDirection: 'asc' | 'desc' | undefined,
): React.ReactNode {
  if (!column.sortable) return null;

  if (sortKey !== column.key) {
    return <span className="text-text-muted">▼</span>;
  }

  return sortDirection === 'asc' ? (
    <span className="text-accent-500">▲</span>
  ) : (
    <span className="text-accent-500">▼</span>
  );
}
