import type React from 'react';
import { useLauncherStore } from '../../stores/useLauncherStore';
import { Card } from '../ui';

export default function LauncherCard(): React.ReactElement {
  const games = useLauncherStore((s) => s.games);

  return (
    <Card title="ゲーム起動">
      <div className="font-[var(--font-mono)] text-xs text-[var(--color-text-secondary)]">
        <div className="mb-1">
          ゲーム数: <span className="text-[var(--color-accent-500)]">{games.length}</span>
        </div>
        {games.length > 0 && (
          <div className="text-[10px] text-[var(--color-text-muted)]">
            Recent:{' '}
            {games
              .slice(0, 4)
              .map((g) => g.name)
              .join(', ')}
          </div>
        )}
      </div>
    </Card>
  );
}
