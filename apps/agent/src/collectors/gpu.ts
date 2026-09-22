import si from "systeminformation";
import type { CollectorStatus, GpuMetrics } from "@nexus-twin/types";
import {
  collectorError,
  collectorOk,
  collectorUnavailable,
} from "../logger.js";

export async function collectGpu(): Promise<{
  metrics: GpuMetrics | null;
  status: CollectorStatus;
}> {
  try {
    const gpus = await si.graphics();
    const ctrl = gpus.controllers?.[0];
    if (!ctrl) {
      return {
        metrics: null,
        status: collectorUnavailable(
          "gpu",
          "No GPU controller reported by platform"
        ),
      };
    }

    const memTotal =
      typeof ctrl.memoryTotal === "number"
        ? ctrl.memoryTotal * 1024 * 1024
        : null;
    const memUsed =
      typeof ctrl.memoryUsed === "number"
        ? ctrl.memoryUsed * 1024 * 1024
        : null;

    return {
      metrics: {
        name: ctrl.model || ctrl.vendor || null,
        utilizationPercent:
          typeof ctrl.utilizationGpu === "number" ? ctrl.utilizationGpu : null,
        vramTotalBytes: memTotal,
        vramUsedBytes: memUsed,
        temperatureC:
          typeof ctrl.temperatureGpu === "number" ? ctrl.temperatureGpu : null,
        powerWatts: typeof ctrl.powerDraw === "number" ? ctrl.powerDraw : null,
      },
      status: collectorOk("gpu"),
    };
  } catch (err) {
    return {
      metrics: null,
      status: collectorError(
        "gpu",
        err instanceof Error ? err.message : "GPU collector failed"
      ),
    };
  }
}
