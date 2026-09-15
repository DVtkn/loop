import winston from "winston";

const isProd = process.env.NODE_ENV === "production";

export type LogLevel = 'info' | 'warn' | 'error' | 'security';

export interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

const customLevels = {
  levels: {
    error: 0,
    security: 1,
    warn: 2,
    info: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    security: "magenta",
    warn: "yellow",
    info: "green",
    debug: "blue",
  },
};

winston.addColors(customLevels.colors);

const formatError = (err: unknown): { message: string; stack?: string; name?: string } | undefined => {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  } else if (err && typeof err === "object") {
    return { message: JSON.stringify(err) };
  } else if (err) {
    return { message: String(err) };
  }
  return undefined;
};

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json() // Cloud Logging automatically parses this
);

const devFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, context, error }) => {
    const details = context || error ? `\n  ${JSON.stringify({ ...(context as object || {}), ...(error ? { error } : {}) }, null, 2)}` : "";
    return `[${timestamp}] ${level}: ${message}${details}`;
  })
);

const winstonLogger = winston.createLogger({
  levels: customLevels.levels,
  level: isProd ? "info" : "debug",
  transports: [
    new winston.transports.Console({
      format: isProd ? prodFormat : devFormat,
    }),
  ],
});

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    winstonLogger.info(message, { context });
  },
  warn: (message: string, context?: Record<string, unknown>, err?: unknown) => {
    winstonLogger.warn(message, { context, error: formatError(err) });
  },
  error: (message: string, err?: unknown, context?: Record<string, unknown>) => {
    winstonLogger.error(message, { context, error: formatError(err) });
  },
  security: (message: string, context?: Record<string, unknown>) => {
    winstonLogger.log("security", message, { context });
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    winstonLogger.log("debug", message, { context });
  },
};
