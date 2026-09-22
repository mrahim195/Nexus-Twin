import si from "systeminformation";
import type { CollectorStatus, ProcessInfo } from "@nexus-twin/types";
import { collectorError, collectorOk } from "../logger.js";

export async function collectProcesses(limit = 40): Promise<{
  processes: ProcessInfo[];
  status: CollectorStatus;
}> {
  try {
    const list = await si.processes();
    const sorted = [...list.list].sort(
      (a, b) => (b.memRss || 0) - (a.memRss || 0)
    );

    const processes: ProcessInfo[] = sorted.slice(0, limit).map((p) => ({
      name: p.name || p.command || "unknown",
      pid: p.pid,
      cpuPercent: typeof p.cpu === "number" ? Math.round(p.cpu * 10) / 10 : null,
      memoryBytes:
        typeof p.memRss === "number" ? Math.round(p.memRss * 1024) : null,
      threadCount: typeof p.mem === "number" ? null : null,
      parentPid: typeof p.parentPid === "number" ? p.parentPid : null,
      startedAt: p.started ? new Date(p.started).toISOString() : null,
      executablePath: p.path || null,
    }));

    return { processes, status: collectorOk("process") };
  } catch (err) {
    return {
      processes: [],
      status: collectorError(
        "process",
        err instanceof Error ? err.message : "Process collector failed"
      ),
    };
  }
}
