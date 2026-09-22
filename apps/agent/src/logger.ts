import type { CollectorStatus } from "@nexus-twin/types";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export function log(level: LogLevel, message: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const line = `[${level}] ${message}`;
  if (meta !== undefined) {
    console.log(`${ts} ${line}`, meta);
  } else {
    console.log(`${ts} ${line}`);
  }
}

export function collectorOk(name: string): CollectorStatus {
  return { name, health: "OK", reason: null };
}

export function collectorUnavailable(name: string, reason: string): CollectorStatus {
  return { name, health: "UNAVAILABLE", reason };
}

export function collectorError(name: string, reason: string): CollectorStatus {
  return { name, health: "ERROR", reason };
}
