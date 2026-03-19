import type React from 'react';
import { memo } from 'react';

type ViewType = 'grid' | 'list' | 'gamepad';

interface ViewSwitcherProps {
  active: ViewType;
  onChange: (view: ViewType) => void;
  className?: string;
}

// Simple SVG icons
const GridIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    role="img"
    aria-label="grid view"
  >
    <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
    <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
    <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
    <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
  </svg>
);

const ListIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    role="img"
    aria-label="list view"
  >
    <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" />
    <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" />
    <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" />
  </svg>
);

const GamepadIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    role="img"
    aria-label="gamepad view"
  >
    <path
      d="M6 9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V9z"
      strokeWidth="2"
    />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
  </svg>
);

export const ViewSwitcher = memo(function ViewSwitcher({
  active,
  onChange,
  className = '',
}: ViewSwitcherProps): React.ReactElement {
  const views = [
    { type: 'grid' as ViewType, icon: <GridIcon /> },
    { type: 'list' as ViewType, icon: <ListIcon /> },
    { type: 'gamepad' as ViewType, icon: <GamepadIcon /> },
  ];

  return (
    <div className={`flex ${className}`}>
      {views.map((view, index) => (
        <button
          type="button"
          key={view.type}
          onClick={() => onChange(view.type)}
          className={`
            px-3 py-2 transition-colors duration-150
            ${
              active === view.type
                ? 'bg-nexus-green/20 border border-nexus-green/40 text-nexus-green'
                : 'text-nexus-muted hover:text-nexus-text'
            }
            ${index < views.length - 1 ? 'border-r border-nexus-border' : ''}
          `}
        >
          {view.icon}
        </button>
      ))}
    </div>
  );
});
