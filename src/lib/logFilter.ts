import type { LogLevel } from '../types';

export const getLogLevelColor = (level: LogLevel): string => {
  switch (level) {
    case 'Error':
      return 'var(--color-danger-500)';
    case 'Warn':
      return 'var(--color-accent-500)';
    case 'Info':
      return 'var(--color-accent-500)';
    case 'Debug':
      return 'var(--color-text-muted)';
    default:
      return 'var(--color-text-primary)';
  }
};

export const getLogLevelBgColor = (level: LogLevel): string => {
  switch (level) {
    case 'Error':
      return 'var(--color-danger-500)';
    case 'Warn':
      return 'var(--color-accent-500)';
    case 'Info':
      return 'var(--color-accent-500)';
    case 'Debug':
      return 'var(--color-base-600)';
    default:
      return 'var(--color-base-600)';
  }
};

export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (_err) {
    return timestamp;
  }
};

export const truncateMessage = (message: string, maxLength: number = 100): string => {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.substring(0, maxLength)}...`;
};
