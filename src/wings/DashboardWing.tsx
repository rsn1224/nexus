import type React from 'react';
import { memo } from 'react';

const DashboardWing = memo(function DashboardWing(): React.ReactElement {
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
      DASHBOARD — coming soon
    </div>
  );
});

export default DashboardWing;
