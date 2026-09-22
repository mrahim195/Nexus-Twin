import si from "systeminformation";
import type { CollectorStatus, DiskPartition } from "@nexus-twin/types";
import { collectorError, collectorOk } from "../logger.js";

export async function collectDisks(): Promise<{
  disks: DiskPartition[];
  status: CollectorStatus;
}> {
  try {
    const fsSize = await si.fsSize();
    const disks: DiskPartition[] = fsSize.map((d) => ({
      mount: d.mount,
      filesystem: d.type || null,
      totalBytes: d.size ?? null,
      usedBytes: d.used ?? null,
      freeBytes: d.available ?? null,
      usedPercent:
        typeof d.use === "number" ? Math.round(d.use * 10) / 10 : null,
      readBytesPerSec: null,
      writeBytesPerSec: null,
      temperatureC: null,
      health: null,
    }));

    return { disks, status: collectorOk("disk") };
  } catch (err) {
    return {
      disks: [],
      status: collectorError(
        "disk",
        err instanceof Error ? err.message : "Disk collector failed"
      ),
    };
  }
}
