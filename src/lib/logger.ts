import pino from 'pino';
import type { LogLevel } from '../stores/useLogStore';
import { useLogStore } from '../stores/useLogStore';

const LEVELS: Record<number, LogLevel> = {
  10: 'debug',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'error',
};

const log = pino({
  level: import.meta.env.DEV ? 'debug' : 'info',
  browser: {
    asObject: true,
    write: (obj: unknown) => {
      // pino の browser モードでは obj は { level: number, msg: string, ... }
      const o = obj as Record<string, unknown>;
      const level: LogLevel = LEVELS[o.level as number] ?? 'info';
      const message = typeof o.msg === 'string' ? o.msg : '';
      const { level: _l, msg: _m, time: _t, ...data } = o;
      useLogStore
        .getState()
        .addEntry(level, message, Object.keys(data).length > 0 ? data : undefined);
    },
  },
});

export default log;
