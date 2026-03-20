import { Send } from 'lucide-react';
import type React from 'react';
import { memo, useState } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  title: string;
  message: string;
}

const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: '08:42:12',
    title: 'GPU ドライバー最適化を検出',
    message: 'STITCH // NVIDIA driver 551.86 optimized for gaming performance',
  },
  {
    id: '2',
    timestamp: '08:41:45',
    title: 'メモリ解放プロセス完了',
    message: 'STITCH // Freed 2.1GB RAM, system responsiveness improved by 12%',
  },
  {
    id: '3',
    timestamp: '08:40:33',
    title: 'ネットワーク遅延を最適化',
    message: 'STITCH // TCP_NODELAY enabled, latency reduced by 4.2ms',
  },
];

export const StitchLogPanel = memo(function StitchLogPanel(): React.ReactElement {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="w-80 border-l border-border-subtle bg-base-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <div className="text-sm text-text-primary font-bold mb-1">AI アドバイザー</div>
        <div className="text-xs text-text-secondary font-mono uppercase tracking-widest">
          STITCH_INTERACTION_LOG
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {MOCK_LOGS.map((log) => (
          <div key={log.id} className="bg-base-600 rounded p-3">
            {/* Timestamp */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-accent-500 rounded-full pulse-node" />
              <div className="text-accent-500 font-mono text-xs">
                STITCH {/* */}
                {log.timestamp}
              </div>
            </div>

            {/* Title */}
            <div className="text-sm text-text-primary font-medium mb-1">{log.title}</div>

            {/* Message */}
            <div className="text-xs text-text-muted">{log.message}</div>
          </div>
        ))}
      </div>

      {/* Input section */}
      <div className="p-4 border-t border-border-subtle">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs text-accent-500 font-mono">REPLY_LINK_ACTIVE</div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="> INPUT_SYSTEM_COMMAND_"
            className="flex-1 bg-base-600 border border-border-subtle rounded px-3 py-2 text-xs text-text-primary font-mono placeholder-text-muted focus:outline-none focus:border-info-500"
          />
          <button
            type="button"
            title="コマンドを送信"
            className="p-2 bg-info-500 text-black rounded hover:bg-accent-500 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});
