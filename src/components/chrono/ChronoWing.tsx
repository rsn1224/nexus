import type React from 'react';
import { useEffect, useState } from 'react';
import { useChronoStore } from '../../stores/useChronoStore';
import type { ChronoTask } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'var(--color-danger-500)';
    case 'medium':
      return 'var(--color-accent-500)';
    default:
      return 'var(--color-text-muted)';
  }
}

/** dueAt (ms epoch) を datetime-local の値文字列に変換 */
function toDatetimeLocal(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── TaskForm ─────────────────────────────────────────────────────────────────

function TaskForm({
  onClose,
  editTask,
}: {
  onClose: () => void;
  editTask?: ChronoTask;
}): React.ReactElement {
  const { saveTask } = useChronoStore();
  const [title, setTitle] = useState(editTask?.title ?? '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    editTask?.priority ?? 'medium',
  );
  const [dueDate, setDueDate] = useState(editTask?.dueAt ? toDatetimeLocal(editTask.dueAt) : '');

  const isEdit = editTask !== undefined;

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!title.trim()) return;
    const dueAt = dueDate ? new Date(dueDate).getTime() : undefined;
    const id = isEdit
      ? editTask.id
      : `task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    void saveTask(id, title.trim(), isEdit ? editTask.done : false, priority, dueAt);
    onClose();
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    backgroundColor: 'var(--color-base-800)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: '4px',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
          padding: '20px',
          width: '400px',
          maxWidth: '90%',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '16px',
            letterSpacing: '0.15em',
          }}
        >
          {isEdit ? 'EDIT TASK' : 'NEW TASK'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label
              htmlFor="task-title"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                marginBottom: '4px',
                letterSpacing: '0.1em',
              }}
            >
              TITLE
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              // biome-ignore lint/a11y/noAutofocus: modal auto-focus is intentional UX
              autoFocus
              style={fieldStyle}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label
              htmlFor="task-priority"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                marginBottom: '4px',
                letterSpacing: '0.1em',
              }}
            >
              PRIORITY
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              style={fieldStyle}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="task-due"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-text-muted)',
                marginBottom: '4px',
                letterSpacing: '0.1em',
              }}
            >
              DUE DATE (OPTIONAL)
            </label>
            <input
              id="task-due"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '5px 12px',
                background: 'transparent',
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
              disabled={!title.trim()}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '5px 12px',
                background: 'var(--color-cyan-500)',
                border: 'none',
                color: 'var(--color-base-900)',
                cursor: title.trim() ? 'pointer' : 'default',
                letterSpacing: '0.1em',
                opacity: title.trim() ? 1 : 0.5,
              }}
            >
              {isEdit ? 'SAVE' : 'CREATE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ChronoWing ───────────────────────────────────────────────────────────────

export default function ChronoWing(): React.ReactElement {
  const {
    tasks,
    isLoading,
    error,
    pomodoroSeconds,
    isPomodoro,
    fetchTasks,
    toggleDone,
    deleteTask,
    startPomodoro,
    stopPomodoro,
  } = useChronoStore();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<ChronoTask | null>(null);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const handleCloseForm = (): void => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

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
            ▶ CHRONO / TASKS
          </span>
          <button
            type="button"
            onClick={() => setShowTaskForm(true)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 8px',
              background: 'var(--color-cyan-500)',
              border: 'none',
              color: 'var(--color-base-900)',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            + TASK
          </button>
        </div>

        {/* Pomodoro Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
          }}
        >
          <span
            style={{
              color: isPomodoro ? 'var(--color-cyan-500)' : 'var(--color-text-muted)',
              minWidth: '50px',
              textAlign: 'center',
            }}
          >
            {formatTime(pomodoroSeconds)}
          </span>
          <button
            type="button"
            onClick={isPomodoro ? stopPomodoro : () => startPomodoro()}
            disabled={!isPomodoro && tasks.length === 0}
            title={!isPomodoro && tasks.length === 0 ? 'Add a task to start Pomodoro' : undefined}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 8px',
              background: isPomodoro
                ? 'var(--color-danger-500)'
                : tasks.length === 0
                  ? 'var(--color-base-700)'
                  : 'var(--color-cyan-500)',
              border: 'none',
              color:
                !isPomodoro && tasks.length === 0
                  ? 'var(--color-text-muted)'
                  : 'var(--color-base-900)',
              cursor: !isPomodoro && tasks.length === 0 ? 'default' : 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            {isPomodoro ? 'STOP' : 'START'}
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

      {/* Task list */}
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
        ) : tasks.length === 0 ? (
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
            NO TASKS — PRESS + TASK
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 0',
                borderBottom: '1px solid var(--color-border-subtle)',
                opacity: task.done ? 0.45 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => void toggleDone(task.id)}
                aria-label={`Mark "${task.title}" as ${task.done ? 'incomplete' : 'complete'}`}
                style={{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--color-text-primary)',
                    textDecoration: task.done ? 'line-through' : 'none',
                    marginBottom: '3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.title}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span
                    style={{
                      padding: '1px 5px',
                      background: getPriorityColor(task.priority),
                      color: 'var(--color-base-900)',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      fontSize: '9px',
                    }}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                  {task.dueAt && <span>DUE: {formatDate(task.dueAt)}</span>}
                </div>
              </div>

              {/* EDIT button */}
              <button
                type="button"
                onClick={() => setEditingTask(task)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '2px 6px',
                  background: 'transparent',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                EDIT
              </button>

              {/* DEL button */}
              <button
                type="button"
                onClick={() => void deleteTask(task.id)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '2px 6px',
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
          ))
        )}
      </div>

      {(showTaskForm || editingTask !== null) && (
        <TaskForm onClose={handleCloseForm} editTask={editingTask ?? undefined} />
      )}
    </div>
  );
}
