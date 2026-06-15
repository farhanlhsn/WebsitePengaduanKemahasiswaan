const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logsDirectory = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory, { recursive: true });
}

const logLevel = process.env.LOG_LEVEL || 'info';

const baseFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, module, ...meta }) => {
    const metaWithoutLevel = { ...meta };
    delete metaWithoutLevel.level;
    const base = {
      timestamp,
      level,
      module: module || 'app',
      message,
      ...metaWithoutLevel,
    };
    return JSON.stringify(base);
  })
);

const logger = createLogger({
  level: logLevel,
  format: baseFormat,
  transports: [
    new transports.Console({
      level: logLevel,
    }),
    new DailyRotateFile({
      filename: path.join(logsDirectory, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: logLevel,
    }),
    new DailyRotateFile({
      filename: path.join(logsDirectory, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    }),
  ],
});

function getLogger(moduleName) {
  // Winston v3 supports child loggers
  return logger.child({ module: moduleName || 'app' });
}

module.exports = { logger, getLogger };


