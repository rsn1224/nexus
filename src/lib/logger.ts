import pino from 'pino';

const log = pino({
  level: import.meta.env.DEV ? 'debug' : 'info',
  browser: {
    asObject: true,
  },
});

export default log;
