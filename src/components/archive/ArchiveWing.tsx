import type React from 'react';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { useArchiveStore } from '../../stores/useArchiveStore';
import type { ArchiveNote } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── NoteForm ─────────────────────────────────────────────────────────────────

function NoteForm({
  initial,
  onClose,
}: {
  initial?: ArchiveNote;
  onClose: () => void;
}): React.ReactElement {
  const { saveNote } = useArchiveStore();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [tagsRaw, setTagsRaw] = useState(initial?.tags.join(', ') ?? '');
  const [linksRaw, setLinksRaw] = useState(initial?.links.join('\n') ?? '');

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!title) return;
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const links = linksRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    await saveNote(initial?.id ?? '', title, content, tags, links);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '5px 8px',
    background: 'var(--color-base-700)',
    border: '1px solid var(--color-border-subtle)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <form
      onSubmit={submit}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: 'rgba(0,0,0,0.15)',
      }}
    >
      <input
        style={inputStyle}
        placeholder="title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
        placeholder="content (markdown)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <input
        style={inputStyle}
        placeholder="tags (comma separated)"
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
      />
      <textarea
        style={{ ...inputStyle, minHeight: '40px', resize: 'vertical' }}
        placeholder="links (one per line)"
        value={linksRaw}
        onChange={(e) => setLinksRaw(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="submit"
          disabled={!title}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '3px 10px',
            background: 'transparent',
            border: '1px solid var(--color-accent-500)',
            color: 'var(--color-accent-500)',
            cursor: !title ? 'default' : 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          SAVE
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '3px 10px',
            background: 'transparent',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────

function NoteCard({
  note,
  isExpanded,
  onToggle,
}: {
  note: ArchiveNote;
  isExpanded: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const { deleteNote } = useArchiveStore();
  const [editing, setEditing] = useState(false);

  if (editing) return <NoteForm initial={note} onClose={() => setEditing(false)} />;

  return (
    <div
      style={{
        borderBottom: '1px solid var(--color-border-subtle)',
        background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
      }}
    >
      {/* Card header — toggle area and action buttons are siblings, not nested */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '8px' }}>
        {/* Clickable toggle area */}
        <button
          type="button"
          onClick={onToggle}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textAlign: 'left',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-accent-500)',
              flexShrink: 0,
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
          <span
            style={{
              flex: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {note.title}
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flexShrink: 0 }}>
            {note.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '1px 5px',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {formatDate(note.updatedAt)}
          </span>
        </button>
        {/* Action buttons — siblings to toggle button */}
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '1px 5px',
            background: 'transparent',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          EDIT
        </button>
        <button
          type="button"
          onClick={() => void deleteNote(note.id)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '1px 5px',
            background: 'transparent',
            border: '1px solid var(--color-danger-600)',
            color: 'var(--color-danger-500)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          DEL
        </button>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div
          style={{
            padding: '0 12px 12px 28px',
          }}
        >
          {note.content && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                margin: '0 0 8px 0',
              }}
            >
              <Markdown
                components={{
                  p: ({ children }) => <p style={{ margin: '0 0 6px 0' }}>{children}</p>,
                  h1: ({ children }) => (
                    <h1
                      style={{
                        fontSize: '14px',
                        color: 'var(--color-text-primary)',
                        margin: '8px 0 4px',
                        fontWeight: 700,
                      }}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text-primary)',
                        margin: '6px 0 4px',
                        fontWeight: 700,
                      }}
                    >
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text-primary)',
                        margin: '4px 0 4px',
                        fontWeight: 700,
                      }}
                    >
                      {children}
                    </h3>
                  ),
                  code: ({ children }) => (
                    <code
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                      }}
                    >
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px',
                        overflow: 'auto',
                        borderRadius: '2px',
                        margin: '4px 0',
                      }}
                    >
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ paddingLeft: '16px', margin: '4px 0' }}>{children}</ol>
                  ),
                  li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                  strong: ({ children }) => (
                    <strong style={{ color: 'var(--color-accent-400)' }}>{children}</strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote
                      style={{
                        borderLeft: '2px solid var(--color-border-subtle)',
                        paddingLeft: '8px',
                        color: 'var(--color-text-muted)',
                        margin: '4px 0',
                      }}
                    >
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {note.content}
              </Markdown>
            </div>
          )}
          {note.links.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {note.links.map((link) => (
                <span
                  key={link}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--color-cyan-500)',
                  }}
                >
                  → {link}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ArchiveWing ──────────────────────────────────────────────────────────────

export default function ArchiveWing(): React.ReactElement {
  const { notes, isLoading, error, fetchNotes } = useArchiveStore();
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void fetchNotes();
  }, [fetchNotes]);

  const filtered = query
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())),
      )
    : notes;

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
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-accent-500)',
            letterSpacing: '0.15em',
          }}
        >
          ▶ ARCHIVE / NOTES
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="search"
            placeholder="filter..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '2px 8px',
              background: 'var(--color-base-700)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              width: '120px',
            }}
          />
          <button
            type="button"
            onClick={() => setShowAdd((s) => !s)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 10px',
              background: 'transparent',
              border: '1px solid var(--color-accent-500)',
              color: 'var(--color-accent-500)',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            {showAdd ? 'CANCEL' : '+ NOTE'}
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

      {showAdd && <NoteForm onClose={() => setShowAdd(false)} />}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            LOADING...
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
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
              {query ? 'NO MATCHES' : 'NO NOTES YET'}
            </span>
            {!query && (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  padding: '4px 16px',
                  background: 'transparent',
                  border: '1px solid var(--color-accent-500)',
                  color: 'var(--color-accent-500)',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                }}
              >
                + NOTE
              </button>
            )}
          </div>
        )}

        {filtered.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            isExpanded={expandedId === note.id}
            onToggle={() => setExpandedId((id) => (id === note.id ? null : note.id))}
          />
        ))}
      </div>

      <div
        style={{
          padding: '6px 16px',
          borderTop: '1px solid var(--color-border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          flexShrink: 0,
        }}
      >
        {filtered.length} / {notes.length} NOTES
      </div>
    </div>
  );
}
