import pino from 'pino';
import pretty from 'pino-pretty';

export const createLogger = (name: string) => {
  return pino(
    {
      name,
      timestamp: true,
    },
    pretty({
      colorize: true,
      ignore: 'pid,hostname',
    })
  );
};
