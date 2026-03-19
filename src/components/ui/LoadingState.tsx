import type React from 'react';

interface LoadingStateProps {
  message?: string; // デフォルト: 'LOADING...'
  height?: string; // デフォルト: 'h-[120px]'
}

export default function LoadingState({
  message = 'LOADING...',
  height = 'h-[120px]',
}: LoadingStateProps): React.ReactElement {
  return (
    <div className={`flex items-center justify-center ${height} text-[11px] text-text-muted`}>
      {message}
    </div>
  );
}
