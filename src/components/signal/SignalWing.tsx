import type React from 'react';
import { useEffect, useState } from 'react';
import { useSignalStore } from '../../stores/useSignalStore';
import type { SignalFeed } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_INTERVAL = 300; // 5 minutes

// ─── AddFeedForm ─────────────────────────────────────────────────────────────

function AddFeedForm({ onClose }: { onClose: () => void }): React.ReactElement {
  const { addFeed } = useSignalStore();
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<'rss' | 'http'>('rss');
  const [intervalSecs, setIntervalSecs] = useState(DEFAULT_INTERVAL);
  const [isAdding, setIsAdding] = useState(false);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!label || !url) return;

    setIsAdding(true);
    try {
      await addFeed(label, url, kind, intervalSecs);
      onClose();
    } finally {
      setIsAdding(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '5px 8px',
    background: 'var(--color-base-700)',
    border: '1px solid var(--color-border-subtle)',
    color: 'var(--color-text-primary)',
    borderRadius: '3px',
  };

  return (
    <form
      onSubmit={submit}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          style={{ ...fieldStyle, flex: 1 }}
          placeholder="ラベル"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={isAdding}
        />
        <input
          type="text"
          style={{ ...fieldStyle, flex: 2 }}
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isAdding}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          style={{ ...fieldStyle, flex: 1 }}
          value={kind}
          onChange={(e) => setKind(e.target.value as 'rss' | 'http')}
          disabled={isAdding}
        >
          <option value="rss">RSS</option>
          <option value="http">HTTP</option>
        </select>

        <input
          type="number"
          style={{ ...fieldStyle, width: '100px' }}
          placeholder="間隔(秒)"
          value={intervalSecs}
          onChange={(e) => setIntervalSecs(Number(e.target.value))}
          disabled={isAdding}
          min={60}
        />
      </div>

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={isAdding}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '2px 8px',
            background: 'transparent',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          CANCEL
        </button>
        <button
          type="submit"
          disabled={!label || !url || isAdding}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '2px 8px',
            background: 'var(--color-accent-600)',
            border: '1px solid var(--color-accent-500)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            opacity: !label || !url || isAdding ? 0.6 : 1,
          }}
        >
          {isAdding ? 'ADDING...' : 'ADD'}
        </button>
      </div>
    </form>
  );
}

// ─── FeedRow ───────────────────────────────────────────────────────────────────

function FeedRow({ feed, index }: { feed: SignalFeed; index: number }): React.ReactElement {
  const { toggleFeed, removeFeed, checkFeedNow } = useSignalStore();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckNow = async (): Promise<void> => {
    setIsChecking(true);
    try {
      await checkFeedNow(feed.id);
    } finally {
      setIsChecking(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <tr
      style={{
        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <td style={{ padding: '8px 12px', width: '80px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '2px 6px',
            border: `1px solid ${feed.kind === 'rss' ? 'var(--color-success-500)' : 'var(--color-accent-500)'}`,
            color: feed.kind === 'rss' ? 'var(--color-success-500)' : 'var(--color-accent-500)',
            letterSpacing: '0.08em',
            borderRadius: '3px',
          }}
        >
          {feed.kind.toUpperCase()}
        </span>
      </td>
      <td
        style={{
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-text-primary)',
        }}
      >
        {feed.label}
      </td>
      <td
        style={{
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-secondary)',
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={feed.url}
      >
        {feed.url}
      </td>
      <td
        style={{
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: feed.isActive ? 'var(--color-success-500)' : 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        {feed.isActive ? 'ACTIVE' : 'PAUSED'}
      </td>
      <td
        style={{
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        {feed.lastChecked > 0 ? formatTime(feed.lastChecked) : 'NEVER'}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {feed.lastResult ? (
          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
              {feed.lastResult.title}
            </div>
            {feed.lastResult.published && (
              <div style={{ fontSize: '9px', marginTop: '2px' }}>
                {formatTime(feed.lastResult.published)}
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>NO DATA</span>
        )}
      </td>
      <td style={{ padding: '8px 12px', width: '120px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={handleCheckNow}
            disabled={isChecking}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              padding: '2px 4px',
              background: 'transparent',
              border: '1px solid var(--color-cyan-500)',
              color: 'var(--color-cyan-500)',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              opacity: isChecking ? 0.6 : 1,
            }}
          >
            {isChecking ? 'CHECKING...' : 'CHECK'}
          </button>
          <button
            type="button"
            onClick={() => void toggleFeed(feed.id)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              padding: '2px 4px',
              background: feed.isActive ? 'transparent' : 'var(--color-success-600)',
              border: '1px solid var(--color-success-500)',
              color: feed.isActive ? 'var(--color-success-500)' : 'var(--color-text-primary)',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            {feed.isActive ? 'PAUSE' : 'START'}
          </button>
          <button
            type="button"
            onClick={() => void removeFeed(feed.id)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              padding: '2px 4px',
              background: 'transparent',
              border: '1px solid var(--color-danger-600)',
              color: 'var(--color-danger-500)',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            DEL
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── SignalWing ─────────────────────────────────────────────────────────────────

export default function SignalWing(): React.ReactElement {
  const { feeds, isLoading, error, fetchFeeds } = useSignalStore();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    void fetchFeeds();
  }, [fetchFeeds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-accent-500)',
              letterSpacing: '0.15em',
            }}
          >
            ▶ SIGNAL / FEEDS
          </span>
          {isLoading && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-cyan-500)',
              }}
            >
              LOADING...
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 10px',
              background: 'transparent',
              border: '1px solid var(--color-cyan-500)',
              color: 'var(--color-cyan-500)',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              borderRadius: '3px',
            }}
          >
            + ADD
          </button>
          <button
            type="button"
            onClick={() => void fetchFeeds()}
            disabled={isLoading}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 10px',
              background: 'transparent',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              borderRadius: '3px',
            }}
          >
            REFRESH
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid var(--color-danger-600)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-danger-500)',
          }}
        >
          ERROR: {error}
        </div>
      )}

      {/* Add Feed Form */}
      {showAdd && <AddFeedForm onClose={() => setShowAdd(false)} />}

      {/* Feed Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                position: 'sticky',
                top: 0,
                background: 'var(--color-base-800)',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              {(['TYPE', 'LABEL', 'URL', 'STATUS', 'LAST CHECK', 'LATEST', 'ACTIONS'] as const).map(
                (col) => (
                  <th
                    key={col}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      letterSpacing: '0.12em',
                      textAlign: 'left',
                      padding: '6px 12px',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {feeds.map((feed, i) => (
              <FeedRow key={feed.id} feed={feed} index={i} />
            ))}
          </tbody>
        </table>

        {!isLoading && feeds.length === 0 && !error && (
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
            NO FEEDS — PRESS + ADD
          </div>
        )}
      </div>
    </div>
  );
}
