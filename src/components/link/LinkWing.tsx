import type React from 'react';
import { useEffect, useState } from 'react';
import { useLinkStore } from '../../stores/useLinkStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'code':
      return 'var(--color-cyan-500)';
    case 'url':
      return 'var(--color-accent-500)';
    default:
      return 'var(--color-text-muted)';
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

// ─── SnippetForm ───────────────────────────────────────────────────────────────

function SnippetForm({ onClose }: { onClose: () => void }): React.ReactElement {
  const { saveSnippet } = useLinkStore();
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'text' | 'code' | 'url'>('text');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !content.trim()) return;

    const id = `snippet-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    void saveSnippet(id, label.trim(), content.trim(), category);
    onClose();
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
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '8px',
          padding: '20px',
          width: '500px',
          maxWidth: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '16px',
            letterSpacing: '0.1em',
          }}
        >
          NEW SNIPPET
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label
              htmlFor="snippet-label"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginBottom: '4px',
              }}
            >
              LABEL
            </label>
            <input
              id="snippet-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter snippet label..."
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'var(--color-base-800)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '4px',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label
              htmlFor="snippet-category"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginBottom: '4px',
              }}
            >
              CATEGORY
            </label>
            <select
              id="snippet-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'text' | 'code' | 'url')}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'var(--color-base-800)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '4px',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              <option value="text">Text</option>
              <option value="code">Code</option>
              <option value="url">URL</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="snippet-content"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginBottom: '4px',
              }}
            >
              CONTENT
            </label>
            <textarea
              id="snippet-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter snippet content..."
              rows={6}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'var(--color-base-800)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '4px',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                resize: 'vertical',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '6px 12px',
                backgroundColor: 'var(--color-cyan-500)',
                border: 'none',
                color: 'var(--color-base-900)',
                cursor: 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              CREATE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── LinkWing Component ─────────────────────────────────────────────────────────

export default function LinkWing(): React.ReactElement {
  const {
    history,
    snippets,
    isLoading,
    error,
    isWatching,
    startWatching,
    stopWatching,
    copyToClipboard,
    fetchSnippets,
    deleteSnippet,
  } = useLinkStore();

  const [activeTab, setActiveTab] = useState<'history' | 'snippets'>('history');
  const [showSnippetForm, setShowSnippetForm] = useState(false);

  useEffect(() => {
    void fetchSnippets();
    startWatching();

    return () => {
      stopWatching();
    };
  }, [fetchSnippets, startWatching, stopWatching]);

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
              color: 'var(--color-cyan-500)',
              letterSpacing: '0.15em',
            }}
          >
            ▶ LINK / CLIPBOARD
          </span>
          <button
            type="button"
            onClick={isWatching ? stopWatching : startWatching}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 8px',
              backgroundColor: isWatching ? 'var(--color-cyan-500)' : 'var(--color-base-800)',
              border: '1px solid var(--color-cyan-500)',
              color: isWatching ? 'var(--color-base-900)' : 'var(--color-cyan-500)',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            WATCH: {isWatching ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

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

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            padding: '8px 16px',
            backgroundColor: activeTab === 'history' ? 'var(--color-base-800)' : 'transparent',
            border: 'none',
            color:
              activeTab === 'history' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            borderBottom: activeTab === 'history' ? '2px solid var(--color-cyan-500)' : 'none',
            letterSpacing: '0.1em',
          }}
        >
          HISTORY ({history.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('snippets')}
          style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            padding: '8px 16px',
            backgroundColor: activeTab === 'snippets' ? 'var(--color-base-800)' : 'transparent',
            border: 'none',
            color:
              activeTab === 'snippets' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            borderBottom: activeTab === 'snippets' ? '2px solid var(--color-cyan-500)' : 'none',
            letterSpacing: '0.1em',
          }}
        >
          SNIPPETS ({snippets.length})
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
            }}
          >
            LOADING...
          </div>
        ) : activeTab === 'history' ? (
          history.length === 0 ? (
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
                NO CLIPBOARD HISTORY YET
              </span>
              {!isWatching && (
                <button
                  type="button"
                  onClick={startWatching}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    padding: '4px 16px',
                    background: 'var(--color-cyan-500)',
                    border: 'none',
                    color: 'var(--color-base-900)',
                    cursor: 'pointer',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                  }}
                >
                  ENABLE WATCH
                </button>
              )}
            </div>
          ) : (
            <div>
              {history.map((item) => (
                <button
                  key={`history-${item.slice(0, 50)}-${item.length}`}
                  type="button"
                  onClick={() => void copyToClipboard(item)}
                  title="Click to copy"
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      color: 'var(--color-text-primary)',
                      marginBottom: '4px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {truncateText(item, 200)}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Click to copy
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          // Snippets tab
          <div>
            <div style={{ marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setShowSnippetForm(true)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '6px 12px',
                  backgroundColor: 'var(--color-cyan-500)',
                  border: 'none',
                  color: 'var(--color-base-900)',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                }}
              >
                + SNIPPET
              </button>
            </div>

            {snippets.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.1em',
                }}
              >
                NO SNIPPETS YET
              </div>
            ) : (
              snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '6px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {snippet.label}
                      </span>
                      <span
                        style={{
                          padding: '2px 6px',
                          backgroundColor: getCategoryColor(snippet.category),
                          color: 'var(--color-base-900)',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {snippet.category.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => void copyToClipboard(snippet.content)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          padding: '4px 8px',
                          backgroundColor: 'var(--color-cyan-500)',
                          border: 'none',
                          color: 'var(--color-base-900)',
                          cursor: 'pointer',
                          letterSpacing: '0.1em',
                        }}
                      >
                        COPY
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSnippet(snippet.id)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          padding: '4px 8px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-danger-500)',
                          color: 'var(--color-danger-500)',
                          cursor: 'pointer',
                          letterSpacing: '0.1em',
                        }}
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                      marginBottom: '8px',
                      wordBreak: 'break-all',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '100px',
                      overflowY: 'auto',
                    }}
                  >
                    {truncateText(snippet.content, 300)}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Created: {formatDate(snippet.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showSnippetForm && <SnippetForm onClose={() => setShowSnippetForm(false)} />}
    </div>
  );
}
