import type { CollectorStatus, MetricSnapshot, ProcessSnapshot } from "@nexus-twin/types";
import { collectCpu } from "./cpu.js";
import { collectMemory } from "./memory.js";
import { collectDisks } from "./disk.js";
import { collectNetwork } from "./network.js";
import { collectGpu } from "./gpu.js";
import { collectProcesses } from "./process.js";

export async function collectMetricSnapshot(
  deviceId: string
): Promise<{ snapshot: MetricSnapshot; collectors: CollectorStatus[] }> {
  const [cpu, memory, disk, network, gpu] = await Promise.all([
    collectCpu(),
    collectMemory(),
    collectDisks(),
    collectNetwork(),
    collectGpu(),
  ]);

  const collectors = [
    cpu.status.name === "cpu_temp" ? { name: "cpu", health: "OK" as const, reason: null } : cpu.status,
    memory.status,
    disk.status,
    network.status,
    gpu.status,
  ];

  if (cpu.status.name === "cpu_temp") {
    collectors.push(cpu.status);
  }

  return {
    snapshot: {
      deviceId,
      collectedAt: new Date().toISOString(),
      cpu: cpu.metrics,
      memory: memory.metrics,
      disks: disk.disks,
      gpu: gpu.metrics,
      network: network.metrics,
    },
    collectors,
  };
}

export async function collectProcessSnapshot(
  deviceId: string
): Promise<{ snapshot: ProcessSnapshot; status: CollectorStatus }> {
  const result = await collectProcesses();
  return {
    snapshot: {
      deviceId,
      collectedAt: new Date().toISOString(),
      processes: result.processes,
    },
    status: result.status,
  };
}

export { collectOsInfo, aggregateApplications } from "./os-info.js";
