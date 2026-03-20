import type React from 'react';
import { memo } from 'react';

interface SkeletonCardProps {
  className?: string;
  children?: React.ReactNode;
}

export const SkeletonCard = memo(function SkeletonCard({
  className = '',
  children,
}: SkeletonCardProps): React.ReactElement {
  return (
    <div className={`piano-surface p-4 animate-pulse ${className}`}>
      {children || (
        <>
          <div className="flex justify-between items-start mb-3">
            <div className="h-3 w-20 bg-base-600 rounded" />
            <div className="h-4 w-4 bg-base-600 rounded-full" />
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <div className="h-10 w-16 bg-base-600 rounded" />
            <div className="h-6 w-4 bg-base-600 rounded" />
          </div>
          <div className="h-0.5 bg-base-600 w-full mb-2">
            <div className="h-full w-3/4 bg-base-500 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-base-600 rounded" />
            <div className="h-3 w-16 bg-base-600 rounded" />
          </div>
        </>
      )}
    </div>
  );
});

export const SkeletonBadge = memo(function SkeletonBadge({
  className = '',
}: {
  className?: string;
}): React.ReactElement {
  return (
    <span className={`inline-block h-5 w-16 bg-base-600 rounded animate-pulse ${className}`} />
  );
});

export const SkeletonButton = memo(function SkeletonButton({
  className = '',
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}): React.ReactElement {
  const sizeClasses = { sm: 'h-8 w-20', md: 'h-10 w-24', lg: 'h-12 w-32' };
  return <div className={`${sizeClasses[size]} bg-base-600 rounded animate-pulse ${className}`} />;
});
