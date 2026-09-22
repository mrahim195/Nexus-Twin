import { z } from "zod";

export const eventTypeSchema = z.enum([
  "boot",
  "shutdown",
  "startup",
  "sleep",
  "wake",
  "application_started",
  "application_stopped",
  "application_crash",
  "network_connected",
  "network_disconnected",
  "high_cpu",
  "high_memory",
  "low_disk",
  "temperature_warning",
  "unusual_network",
  "agent_error",
  "agent_update",
  "heartbeat_lost",
  "custom",
]);

export const eventSeveritySchema = z.enum([
  "info",
  "warning",
  "error",
  "critical",
]);

export const systemEventSchema = z.object({
  deviceId: z.string().min(1),
  type: eventTypeSchema,
  severity: eventSeveritySchema,
  title: z.string().min(1).max(256),
  message: z.string().min(1).max(4000),
  occurredAt: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
  reportedByAgent: z.boolean(),
});

export const eventsBatchSchema = z.object({
  events: z.array(systemEventSchema).min(1).max(100),
});

export type SystemEventInput = z.infer<typeof systemEventSchema>;
