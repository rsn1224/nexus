import type React from 'react';
import { useEffect, useState } from 'react';
import { useLauncherStore } from '../../stores/useLauncherStore';
import type { GameInfo } from '../../types';

// ─── LauncherWing ──────────────────────────────────────────────────────────────

export default function LauncherWing(): React.ReactElement {
  const games = useLauncherStore((s) => s.games);
  const isScanning = useLauncherStore((s) => s.isScanning);
  const error = useLauncherStore((s) => s.error);
  const scanGames = useLauncherStore((s) => s.scanGames);
  const launchGame = useLauncherStore((s) => s.launchGame);

  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  useEffect(() => {
    void scanGames();
  }, [scanGames]);

  useEffect(() => {
    if (games.length > 0 && lastScanTime === null) {
      setLastScanTime(new Date());
    }
  }, [games, lastScanTime]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const buttonStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    padding: '2px 8px',
    background: 'var(--color-accent-500)',
    color: 'var(--color-base-900)',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    letterSpacing: '0.05em',
  };

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-cyan-500)',
            letterSpacing: '0.15em',
            marginBottom: '4px',
          }}
        >
          ▶ LAUNCHER / GAMES
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            marginBottom: '8px',
          }}
        >
          {games.length} GAMES
          {lastScanTime && (
            <span style={{ marginLeft: '16px' }}>LAST SCAN {formatTime(lastScanTime)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void scanGames()}
          disabled={isScanning}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '4px 12px',
            background: 'transparent',
            color: isScanning ? 'var(--color-text-muted)' : 'var(--color-cyan-500)',
            border: `1px solid ${isScanning ? 'var(--color-border-subtle)' : 'var(--color-cyan-500)'}`,
            borderRadius: '3px',
            cursor: isScanning ? 'default' : 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          {isScanning ? 'SCANNING...' : 'SCAN'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            borderBottom: '1px solid var(--color-danger-600)',
            background: 'var(--color-base-800)',
            padding: '8px 12px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-danger-500)',
            }}
          >
            ERROR: {error}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isScanning ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            SCANNING STEAM LIBRARY...
          </div>
        ) : games.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            NO GAMES — PRESS SCAN TO DETECT STEAM LIBRARY
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    padding: '4px 8px',
                    textAlign: 'left',
                    fontWeight: 'normal',
                  }}
                >
                  NAME
                </th>
                <th
                  scope="col"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    padding: '4px 8px',
                    textAlign: 'left',
                    fontWeight: 'normal',
                    width: '100px',
                  }}
                >
                  APP ID
                </th>
                <th
                  scope="col"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    padding: '4px 8px',
                    textAlign: 'left',
                    fontWeight: 'normal',
                    width: '80px',
                  }}
                >
                  SIZE
                </th>
                <th
                  scope="col"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    padding: '4px 8px',
                    textAlign: 'left',
                    fontWeight: 'normal',
                    width: '80px',
                  }}
                >
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {games.map((game: GameInfo, index: number) => (
                <tr
                  key={game.appId}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    background: hoveredRow === index ? 'var(--color-base-800)' : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={{ padding: '6px 8px' }}>{game.name}</td>
                  <td style={{ padding: '6px 8px', width: '100px' }}>{game.appId}</td>
                  <td style={{ padding: '6px 8px', width: '80px' }}>
                    {game.sizeGb === 0 ? '--' : `${game.sizeGb.toFixed(1)} GB`}
                  </td>
                  <td style={{ padding: '6px 8px', width: '80px' }}>
                    <button
                      type="button"
                      onClick={() => void launchGame(game.appId)}
                      style={buttonStyle}
                    >
                      ▶ LAUNCH
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
