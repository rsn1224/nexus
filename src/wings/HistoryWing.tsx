import type React from 'react';
import { memo } from 'react';

const HistoryWing = memo(function HistoryWing(): React.ReactElement {
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
      HISTORY — coming soon
    </div>
  );
});

export default HistoryWing;
