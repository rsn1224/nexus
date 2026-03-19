import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import log from '../../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error({ err: error, componentStack: info.componentStack }, '[ErrorBoundary]');
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const sectionName = this.props.name ?? 'セクション';
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
          <div className="text-xs text-text-muted">{sectionName.toUpperCase()}</div>
          <div className="text-[12px] text-danger-500">⚠ エラーが発生しました</div>
          <div className="text-xs text-text-secondary max-w-xs wrap-break-word">
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            type="button"
            aria-label={`${sectionName}を再読み込み`}
            className="text-xs px-3 py-1 border border-accent-500 text-accent-500 hover:bg-accent-500 hover:text-base-900 transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            ↺ 再試行
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
