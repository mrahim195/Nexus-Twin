import { z } from "zod";

const nullableNumber = z.number().finite().nullable();
const nullableString = z.string().nullable();

export const cpuMetricsSchema = z.object({
  model: nullableString,
  architecture: nullableString,
  logicalCores: z.number().int().positive().nullable(),
  physicalCores: z.number().int().positive().nullable(),
  utilizationPercent: z.number().min(0).max(100).nullable(),
  perCorePercent: z.array(z.number().min(0).max(100)).nullable(),
  frequencyMhz: z.number().positive().nullable(),
  loadAverage: z.array(z.number()).nullable(),
  temperatureC: z.number().nullable(),
});

export const memoryMetricsSchema = z.object({
  totalBytes: z.number().nonnegative().nullable(),
  usedBytes: z.number().nonnegative().nullable(),
  freeBytes: z.number().nonnegative().nullable(),
  availableBytes: z.number().nonnegative().nullable(),
  usedPercent: z.number().min(0).max(100).nullable(),
  swapTotalBytes: z.number().nonnegative().nullable(),
  swapUsedBytes: z.number().nonnegative().nullable(),
});

export const diskPartitionSchema = z.object({
  mount: z.string().min(1),
  filesystem: nullableString,
  totalBytes: z.number().nonnegative().nullable(),
  usedBytes: z.number().nonnegative().nullable(),
  freeBytes: z.number().nonnegative().nullable(),
  usedPercent: z.number().min(0).max(100).nullable(),
  readBytesPerSec: nullableNumber,
  writeBytesPerSec: nullableNumber,
  temperatureC: nullableNumber,
  health: nullableString,
});

export const gpuMetricsSchema = z.object({
  name: nullableString,
  utilizationPercent: z.number().min(0).max(100).nullable(),
  vramTotalBytes: z.number().nonnegative().nullable(),
  vramUsedBytes: z.number().nonnegative().nullable(),
  temperatureC: nullableNumber,
  powerWatts: nullableNumber,
});

export const networkInterfaceSchema = z.object({
  name: z.string().min(1),
  connected: z.boolean().nullable(),
  ipv4: z.array(z.string()).nullable(),
  bytesSent: z.number().nonnegative().nullable(),
  bytesReceived: z.number().nonnegative().nullable(),
  uploadBytesPerSec: z.number().nonnegative().nullable(),
  downloadBytesPerSec: z.number().nonnegative().nullable(),
  latencyMs: z.number().nonnegative().nullable(),
});

export const networkMetricsSchema = z.object({
  internetConnected: z.boolean().nullable(),
  interfaces: z.array(networkInterfaceSchema),
});

export const metricSnapshotSchema = z.object({
  deviceId: z.string().min(1),
  collectedAt: z.string().datetime(),
  cpu: cpuMetricsSchema,
  memory: memoryMetricsSchema,
  disks: z.array(diskPartitionSchema),
  gpu: gpuMetricsSchema.nullable(),
  network: networkMetricsSchema,
});

export const telemetryBatchSchema = z.object({
  snapshots: z.array(metricSnapshotSchema).min(1).max(100),
});

export type MetricSnapshotInput = z.infer<typeof metricSnapshotSchema>;
export type TelemetryBatchInput = z.infer<typeof telemetryBatchSchema>;
