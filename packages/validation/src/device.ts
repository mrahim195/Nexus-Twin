import { z } from "zod";

export const deviceStatusSchema = z.enum([
  "ONLINE",
  "IDLE",
  "SLEEPING",
  "OFFLINE",
  "UNKNOWN",
]);

export const platformOsSchema = z.enum([
  "windows",
  "macos",
  "linux",
  "unknown",
]);

export const heartbeatSchema = z.object({
  deviceId: z.string().min(1),
  agentVersion: z.string().min(1),
  timestamp: z.string().datetime(),
  statusHint: z.enum(["ONLINE", "IDLE", "SLEEPING"]).optional(),
});

export const registerDeviceSchema = z.object({
  pairingCode: z.string().min(4).max(32),
  hostname: z.string().min(1).max(256),
  name: z.string().min(1).max(128).optional(),
  platform: platformOsSchema,
  osVersion: z.string().min(1).max(128),
  architecture: z.string().min(1).max(64),
  agentVersion: z.string().min(1).max(32),
});

export const createPairingCodeSchema = z.object({
  label: z.string().min(1).max(128).optional(),
});

export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
