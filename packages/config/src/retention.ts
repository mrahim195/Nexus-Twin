/** Telemetry retention policy constants (MongoDB TTL / downsampling jobs) */

export const RETENTION = {
  rawSnapshotsHours: 24,
  oneMinuteAggregateDays: 7,
  fiveMinuteAggregateDays: 30,
  eventsDays: 90,
  aiDiagnosticsDays: 90,
} as const;
