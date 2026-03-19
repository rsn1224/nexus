import type React from 'react';
import { memo } from 'react';

const GamingWing = memo(function GamingWing(): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
      }}
    >
      GAMING — coming soon
    </div>
  );
});

export default GamingWing;
