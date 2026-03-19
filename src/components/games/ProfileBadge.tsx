import type React from 'react';

interface ProfileBadgeProps {
  profileName: string;
  isActive: boolean;
  className?: string;
}

export default function ProfileBadge({
  profileName,
  isActive,
  className = '',
}: ProfileBadgeProps): React.ReactElement {
  if (!isActive) {
    return (
      <span data-testid="profile-badge" className={`text-xs text-text-muted ${className}`}>
        PROFILE: {profileName}
      </span>
    );
  }

  return (
    <span data-testid="profile-badge-active" className={`text-xs text-accent-500 ${className}`}>
      ● PROFILE: {profileName}
    </span>
  );
}
