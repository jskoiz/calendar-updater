import { createLogger, format, transports } from 'winston';
import { config } from './config';

const { combine, timestamp, printf, colorize } = format;

const customFormat = printf(({ level, message, timestamp, service }) => {
  return `[${timestamp}] ${level.toUpperCase()} [${service}]: ${message}`;
});

export const logger = createLogger({
  level: config.logLevel,
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    customFormat
  ),
  defaultMeta: { service: 'caldav-service' },
  transports: [
    new transports.Console(),
  ],
});
