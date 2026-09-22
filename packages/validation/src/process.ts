import { z } from "zod";

export const processInfoSchema = z.object({
  name: z.string().min(1).max(512),
  pid: z.number().int().nonnegative(),
  cpuPercent: z.number().min(0).nullable(),
  memoryBytes: z.number().nonnegative().nullable(),
  threadCount: z.number().int().nonnegative().nullable(),
  parentPid: z.number().int().nonnegative().nullable(),
  startedAt: z.string().datetime().nullable(),
  executablePath: z.string().max(1024).nullable(),
});

export const processSnapshotSchema = z.object({
  deviceId: z.string().min(1),
  collectedAt: z.string().datetime(),
  processes: z.array(processInfoSchema).max(500),
});

export type ProcessSnapshotInput = z.infer<typeof processSnapshotSchema>;
