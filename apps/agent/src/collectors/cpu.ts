import si from "systeminformation";
import type { CpuMetrics } from "@nexus-twin/types";
import { collectorError, collectorOk, collectorUnavailable } from "../logger.js";
import type { CollectorStatus } from "@nexus-twin/types";

export async function collectCpu(): Promise<{
  metrics: CpuMetrics;
  status: CollectorStatus;
}> {
  try {
    const [load, cpu, temp] = await Promise.all([
      si.currentLoad(),
      si.cpu(),
      si.cpuTemperature().catch(() => ({ main: null, cores: [] as number[] })),
    ]);

    const temperature =
      typeof temp.main === "number" && !Number.isNaN(temp.main)
        ? temp.main
        : null;

    return {
      metrics: {
        model: cpu.brand || cpu.manufacturer || null,
        architecture: cpu.vendor || null,
        logicalCores: cpu.cores ?? null,
        physicalCores: cpu.physicalCores ?? null,
        utilizationPercent: Number.isFinite(load.currentLoad)
          ? Math.round(load.currentLoad * 10) / 10
          : null,
        perCorePercent: load.cpus?.map((c) =>
          Math.round(c.load * 10) / 10
        ) ?? null,
        frequencyMhz: cpu.speed ? Math.round(cpu.speed * 1000) : null,
        loadAverage: null,
        temperatureC: temperature,
      },
      status: temperature === null
        ? collectorUnavailable("cpu_temp", "Temperature not exposed on this platform")
        : collectorOk("cpu"),
    };
  } catch (err) {
    return {
      metrics: {
        model: null,
        architecture: null,
        logicalCores: null,
        physicalCores: null,
        utilizationPercent: null,
        perCorePercent: null,
        frequencyMhz: null,
        loadAverage: null,
        temperatureC: null,
      },
      status: collectorError(
        "cpu",
        err instanceof Error ? err.message : "CPU collector failed"
      ),
    };
  }
}
