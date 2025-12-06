// utils/logger.ts
import { type InjectionKey } from "vue";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

const createLogger = (name: string): Logger => {
  const log = (level: LogLevel, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${name}] [${level.toUpperCase()}]`, ...args);
  };

  return {
    debug: (...args: any[]) => log("debug", ...args),
    info: (...args: any[]) => log("info", ...args),
    warn: (...args: any[]) => log("warn", ...args),
    error: (...args: any[]) => log("error", ...args),
  };
};

export const LoggerKey: InjectionKey<Logger> = Symbol("Logger");
export default createLogger;
