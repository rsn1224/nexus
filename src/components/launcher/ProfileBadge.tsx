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
      <span
        data-testid="profile-badge"
        className={`font-(--font-mono) text-[8px] text-text-muted tracking-[0.05em] ${className}`}
      >
        PROFILE: {profileName}
      </span>
    );
  }

  return (
    <span
      data-testid="profile-badge-active"
      className={`font-(--font-mono) text-[8px] text-cyan-500 tracking-[0.05em] ${className}`}
    >
      ● PROFILE: {profileName}
    </span>
  );
}
