import type React from 'react';
import { useEffect, useState } from 'react';
import log from '../../lib/logger';
import { startFileWatcher, stopFileWatcher, useBeaconStore } from '../../stores/useBeaconStore';

function AddPathForm({ onClose }: { onClose: () => void }): React.ReactElement {
  const [path, setPath] = useState('');
  const [isRecursive, setIsRecursive] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { startWatching, validatePath } = useBeaconStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim()) return;

    setIsValidating(true);
    setIsValid(null);

    try {
      const valid = await validatePath(path.trim());
      setIsValid(valid);

      if (valid) {
        await startWatching(path.trim(), isRecursive);
        onClose();
      }
    } catch (err) {
      log.error({ err }, 'beacon: failed to add path');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-base-900)',
          padding: '24px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--color-text-primary)',
          }}
        >
          Add Watch Path
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="path-input"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
              }}
            >
              PATH
            </label>
            <input
              id="path-input"
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/path/to/watch"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'var(--color-base-800)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '4px',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
              }}
            />
            {isValid !== null && (
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  color: isValid ? 'var(--color-success-500)' : 'var(--color-danger-500)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {isValid ? '✓ Path exists and is accessible' : '✗ Path not found or inaccessible'}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isRecursive}
                onChange={(e) => setIsRecursive(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              RECURSIVE (watch subdirectories)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '4px',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isValidating || !path.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--color-accent-500)',
                border: 'none',
                borderRadius: '4px',
                color: 'var(--color-text-primary)',
                cursor: isValidating || !path.trim() ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.1em',
                opacity: isValidating || !path.trim() ? 0.5 : 1,
              }}
            >
              {isValidating ? 'VALIDATING...' : 'ADD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getEventColor(kind: string): string {
  switch (kind) {
    case 'Create':
      return 'var(--color-success-500)';
    case 'Remove':
      return 'var(--color-danger-500)';
    case 'Modify':
      return 'var(--color-accent-500)';
    default:
      return 'var(--color-text-secondary)';
  }
}

export default function BeaconWing(): React.ReactElement {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'paths' | 'events'>('paths');
  const {
    watchedPaths,
    events,
    isLoading,
    error,
    fetchWatchedPaths,
    fetchEvents,
    clearEvents,
    stopWatching,
    removeWatchedPath,
    setError,
  } = useBeaconStore();

  useEffect(() => {
    // Start file watcher when component mounts
    startFileWatcher();

    // Load initial data
    void fetchWatchedPaths();
    void fetchEvents(50);

    return () => {
      // Cleanup when component unmounts
      stopFileWatcher();
    };
  }, [fetchWatchedPaths, fetchEvents]);

  const handleStopWatching = async (id: string) => {
    try {
      await stopWatching(id);
    } catch (err) {
      log.error({ err }, 'beacon: failed to stop watching');
    }
  };

  const handleRemovePath = async (id: string) => {
    try {
      await removeWatchedPath(id);
    } catch (err) {
      log.error({ err }, 'beacon: failed to remove path');
    }
  };

  const handleClearEvents = async () => {
    try {
      await clearEvents();
    } catch (err) {
      log.error({ err }, 'beacon: failed to clear events');
    }
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-base-900)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
            }}
          >
            ▶
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              color: 'var(--color-text-primary)',
              letterSpacing: '0.1em',
            }}
          >
            BEACON / FILESYSTEM
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '6px 12px',
            backgroundColor: 'var(--color-accent-500)',
            border: 'none',
            borderRadius: '4px',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
          }}
        >
          + ADD PATH
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderBottom: '1px solid var(--color-border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-danger-500)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>ERROR: {error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-danger-500)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('paths')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'paths' ? 'var(--color-base-800)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'paths' ? '2px solid var(--color-accent-500)' : 'none',
            color:
              activeTab === 'paths' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
          }}
        >
          PATHS ({watchedPaths.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('events')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'events' ? 'var(--color-base-800)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'events' ? '2px solid var(--color-accent-500)' : 'none',
            color:
              activeTab === 'events' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
          }}
        >
          EVENTS ({events.length})
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {isLoading ? (
          <div
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.1em',
            }}
          >
            LOADING...
          </div>
        ) : activeTab === 'paths' ? (
          watchedPaths.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '160px',
                gap: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.1em',
                }}
              >
                NO WATCHED PATHS YET
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  padding: '4px 16px',
                  background: 'var(--color-accent-500)',
                  border: 'none',
                  color: '#000',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}
              >
                + ADD PATH
              </button>
            </div>
          ) : (
            <div>
              {watchedPaths.map((watchedPath) => (
                <div
                  key={watchedPath.id}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: 'var(--color-base-800)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--color-text-primary)',
                        wordBreak: 'break-all',
                      }}
                    >
                      {watchedPath.path}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                      }}
                    >
                      {watchedPath.isActive ? (
                        <button
                          type="button"
                          onClick={() => void handleStopWatching(watchedPath.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--color-accent-500)',
                            border: 'none',
                            borderRadius: '3px',
                            color: 'var(--color-text-primary)',
                            cursor: 'pointer',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          STOP
                        </button>
                      ) : (
                        <div
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'var(--color-text-muted)',
                            border: 'none',
                            borderRadius: '3px',
                            color: 'var(--color-text-primary)',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          STOPPED
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleRemovePath(watchedPath.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--color-danger-500)',
                          border: 'none',
                          borderRadius: '3px',
                          color: 'var(--color-text-primary)',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '10px',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span>{watchedPath.isRecursive ? 'RECURSIVE' : 'NON-RECURSIVE'}</span>
                    <span>CREATED: {formatTimestamp(watchedPath.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : // Events tab
        events.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.1em',
            }}
          >
            NO EVENTS YET
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => void handleClearEvents()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--color-danger-500)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                }}
              >
                CLEAR ALL
              </button>
            </div>
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  padding: '8px 12px',
                  marginBottom: '4px',
                  backgroundColor: 'var(--color-base-800)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${getEventColor(event.kind)}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: getEventColor(event.kind),
                      fontWeight: '600',
                    }}
                  >
                    {event.kind}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    wordBreak: 'break-all',
                  }}
                >
                  {event.path}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Path Form Modal */}
      {showAddForm && <AddPathForm onClose={() => setShowAddForm(false)} />}
    </div>
  );
}
