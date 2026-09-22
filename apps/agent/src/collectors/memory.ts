import si from "systeminformation";
import type { CollectorStatus, MemoryMetrics } from "@nexus-twin/types";
import { collectorError, collectorOk } from "../logger.js";

export async function collectMemory(): Promise<{
  metrics: MemoryMetrics;
  status: CollectorStatus;
}> {
  try {
    const mem = await si.mem();
    const usedPercent =
      mem.total > 0
        ? Math.round(((mem.total - mem.available) / mem.total) * 1000) / 10
        : null;

    return {
      metrics: {
        totalBytes: mem.total ?? null,
        usedBytes: mem.used ?? null,
        freeBytes: mem.free ?? null,
        availableBytes: mem.available ?? null,
        usedPercent,
        swapTotalBytes: mem.swaptotal ?? null,
        swapUsedBytes: mem.swapused ?? null,
      },
      status: collectorOk("memory"),
    };
  } catch (err) {
    return {
      metrics: {
        totalBytes: null,
        usedBytes: null,
        freeBytes: null,
        availableBytes: null,
        usedPercent: null,
        swapTotalBytes: null,
        swapUsedBytes: null,
      },
      status: collectorError(
        "memory",
        err instanceof Error ? err.message : "Memory collector failed"
      ),
    };
  }
}
