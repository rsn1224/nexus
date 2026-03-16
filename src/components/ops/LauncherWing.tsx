import { useEffect } from 'react';
import { useLauncherStore } from '../../stores/useLauncherStore';

export default function LauncherWing() {
  const { games, isScanning, autoBoostEnabled, error, scanGames, launchGame, toggleAutoBoost } =
    useLauncherStore();

  useEffect(() => {
    if (games.length === 0 && !isScanning) {
      scanGames();
    }
  }, [games.length, isScanning, scanGames]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-base-900)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-accent-500)',
              letterSpacing: '0.15em',
            }}
          >
            ▶ OPS / LAUNCHER
          </span>
          <button
            type="button"
            onClick={scanGames}
            disabled={isScanning}
            style={{
              padding: '2px 10px',
              background: 'transparent',
              border: `1px solid ${isScanning ? 'var(--color-border-subtle)' : 'var(--color-accent-500)'}`,
              color: isScanning ? 'var(--color-text-muted)' : 'var(--color-accent-500)',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
            }}
          >
            {isScanning ? 'SCANNING...' : 'SCAN STEAM LIBRARY'}
          </button>
        </div>

        {/* Auto Boost トグル */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.05em',
          }}
        >
          <input
            type="checkbox"
            checked={autoBoostEnabled}
            onChange={toggleAutoBoost}
            style={{ cursor: 'pointer' }}
          />
          AUTO-REFRESH OPS ON GAME LAUNCH
        </label>
      </div>

      {/* エラー表示 */}
      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid var(--color-danger-600)',
            fontSize: '11px',
            color: 'var(--color-danger-500)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ERROR: {error}
        </div>
      )}

      {/* ゲームリスト */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {games.length === 0 && !isScanning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '120px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            NO STEAM GAMES FOUND
          </div>
        )}

        {isScanning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '120px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-cyan-500)',
              letterSpacing: '0.1em',
            }}
          >
            SCANNING STEAM LIBRARY...
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {games.length > 0 && (
            <thead>
              <tr
                style={{
                  position: 'sticky',
                  top: 0,
                  background: 'var(--color-base-800)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                {(['NAME', 'APP ID', 'SIZE', ''] as const).map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '5px 12px',
                      textAlign: col === 'SIZE' ? 'right' : 'left',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {games.map((game, i) => (
              <tr
                key={game.appId}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                <td
                  style={{
                    padding: '6px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--color-text-primary)',
                    maxWidth: '240px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {game.name}
                </td>
                <td
                  style={{
                    padding: '6px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    width: '80px',
                  }}
                >
                  {game.appId}
                </td>
                <td
                  style={{
                    padding: '6px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    textAlign: 'right',
                    width: '70px',
                  }}
                >
                  {game.sizeGb > 0 ? `${game.sizeGb.toFixed(1)} GB` : '—'}
                </td>
                <td style={{ padding: '6px 8px', width: '80px' }}>
                  <button
                    type="button"
                    onClick={() => launchGame(game.appId)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      padding: '2px 8px',
                      background: 'transparent',
                      border: '1px solid var(--color-accent-500)',
                      color: 'var(--color-accent-500)',
                      cursor: 'pointer',
                      letterSpacing: '0.08em',
                    }}
                  >
                    ▶ LAUNCH
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
