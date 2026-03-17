import pino from 'pino';

const logger = pino({
  level: import.meta.env.DEV ? 'debug' : 'info',
  browser: {
    asObject: true,
    write: (_obj: unknown) => {
      // pino ブラウザモード: 出力先は Rust 側の tracing に委ねる
    },
  },
});

export default logger;
