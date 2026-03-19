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
    <div className={`bg-nexus-surface border border-nexus-border p-4 animate-pulse ${className}`}>
      {children || (
        <>
          {/* Header Skeleton */}
          <div className="flex justify-between items-start mb-3">
            <div className="h-3 w-20 bg-nexus-border rounded" />
            <div className="h-4 w-4 bg-nexus-border rounded-full" />
          </div>

          {/* Value Display Skeleton */}
          <div className="flex items-baseline gap-1 mb-2">
            <div className="h-10 w-16 bg-nexus-border rounded" />
            <div className="h-6 w-4 bg-nexus-border rounded" />
          </div>

          {/* Progress Bar Skeleton */}
          <div className="h-0.5 bg-nexus-border w-full mb-2">
            <div className="h-full w-3/4 bg-nexus-muted rounded" />
          </div>

          {/* Footer Skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-3 w-24 bg-nexus-border rounded" />
            <div className="h-3 w-16 bg-nexus-border rounded" />
          </div>
        </>
      )}
    </div>
  );
});

// Skeleton Badge
interface SkeletonBadgeProps {
  className?: string;
}

export const SkeletonBadge = memo(function SkeletonBadge({
  className = '',
}: SkeletonBadgeProps): React.ReactElement {
  return (
    <span className={`inline-block h-5 w-16 bg-nexus-border rounded animate-pulse ${className}`} />
  );
});

// Skeleton Button
interface SkeletonButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SkeletonButton = memo(function SkeletonButton({
  className = '',
  size = 'md',
}: SkeletonButtonProps): React.ReactElement {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return (
    <div className={`${sizeClasses[size]} bg-nexus-border rounded animate-pulse ${className}`} />
  );
});
