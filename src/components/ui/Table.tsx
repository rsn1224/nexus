import type React from 'react';
import { LoadingState } from './index';

interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  empty?: string;
  className?: string;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (selectedRows: T[]) => void;
  size?: 'sm' | 'md' | 'lg';
  striped?: boolean;
  hoverable?: boolean;
  rowKey?: (row: T, index: number) => string;
  ariaLabel?: string;
  caption?: string;
  stickyHeader?: boolean;
  maxHeight?: string;
}

export default function Table<T>({
  data,
  columns,
  loading = false,
  empty = 'データがありません',
  className = '',
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  size = 'md',
  striped = true,
  hoverable = true,
  rowKey,
  ariaLabel,
  caption,
  stickyHeader: _stickyHeader = false,
  maxHeight,
}: TableProps<T>): React.ReactElement {
  const sizeClasses = {
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-[12px]',
  };

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return;

    const newDirection = sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    onSelectionChange(checked ? [...data] : []);
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedRows, row]);
    } else {
      onSelectionChange(selectedRows.filter((r) => r !== row));
    }
  };

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isRowSelected = (row: T) => selectedRows.includes(row);

  const renderCell = (column: TableColumn<T>, row: T) => {
    const value = row[column.key];

    if (column.render) {
      return column.render(value, row);
    }

    // デフォルトレンダリング
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }

    if (value === null || value === undefined) {
      return '-';
    }

    return String(value);
  };

  const getSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;

    if (sortKey !== column.key) {
      return <span className="text-text-muted">▼</span>;
    }

    return sortDirection === 'asc' ? (
      <span className="text-accent-500">▲</span>
    ) : (
      <span className="text-accent-500">▼</span>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingState message="読み込み中..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-text-muted">{empty}</div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${maxHeight ? 'overflow-y-auto' : ''}`} style={{ maxHeight }}>
      <table
        data-testid="ui-table"
        className={`w-full border-collapse font-mono ${sizeClasses[size]} ${className}`}
        aria-label={ariaLabel}
        aria-busy={loading ? 'true' : undefined}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border-subtle">
            {selectable && (
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-border-subtle bg-base-700 text-accent-500 focus:ring-accent-500 focus:ring-opacity-50"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-3 py-2 font-semibold text-text-primary uppercase ${
                  column.align === 'center'
                    ? 'text-center'
                    : column.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                } ${column.sortable && onSort ? 'cursor-pointer hover:bg-base-700' : ''}`}
                style={{ width: column.width }}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-1">
                  {column.title}
                  {getSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={rowKey ? rowKey(row, index) : String(index)}
              className={`border-b border-border-subtle ${
                striped && index % 2 === 1 ? 'bg-base-800' : ''
              } ${hoverable ? 'hover:bg-base-700' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {selectable && (
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={isRowSelected(row)}
                    onChange={(e) => handleSelectRow(row, e.target.checked)}
                    className="rounded border-border-subtle bg-base-700 text-accent-500 focus:ring-accent-500 focus:ring-opacity-50"
                  />
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={`px-3 py-2 text-text-secondary ${
                    column.align === 'center'
                      ? 'text-center'
                      : column.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                  }`}
                >
                  {renderCell(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
