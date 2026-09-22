import { THRESHOLDS } from "@nexus-twin/config";
import type { AiEvidencePackage } from "@nexus-twin/types";

export interface MetricPoint {
  t: Date | string;
  cpu: number | null;
  ram: number | null;
  gpu: number | null;
}

export interface ProcessRow {
  name: string;
  pid?: number;
  cpuPercent: number | null;
  memoryBytes: number | null;
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function peak(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(Math.max(...nums) * 10) / 10;
}

export function summarizeSeries(points: MetricPoint[]) {
  const cpu = points.map((p) => p.cpu).filter((n): n is number => n != null);
  const ram = points.map((p) => p.ram).filter((n): n is number => n != null);
  const gpu = points.map((p) => p.gpu).filter((n): n is number => n != null);
  return {
    cpu: { average: avg(cpu), peak: peak(cpu), samples: cpu.length },
    ram: { average: avg(ram), peak: peak(ram), samples: ram.length },
    gpu: { average: avg(gpu), peak: peak(gpu), samples: gpu.length },
  };
}

/** Hour-of-day baselines from historical points (local time). */
export function buildHourlyBaselines(points: MetricPoint[]) {
  const buckets = new Map<number, { cpu: number[]; ram: number[] }>();
  for (const p of points) {
    const hour = new Date(p.t).getHours();
    const b = buckets.get(hour) ?? { cpu: [], ram: [] };
    if (p.cpu != null) b.cpu.push(p.cpu);
    if (p.ram != null) b.ram.push(p.ram);
    buckets.set(hour, b);
  }
  const out: Record<string, { cpu: number | null; ram: number | null }> = {};
  for (const [hour, b] of buckets) {
    out[String(hour)] = { cpu: avg(b.cpu), ram: avg(b.ram) };
  }
  return out;
}

export function expectedForNow(
  baselines: Record<string, { cpu: number | null; ram: number | null }>
) {
  const hour = String(new Date().getHours());
  return baselines[hour] ?? { cpu: null, ram: null };
}

export function detectAnomalies(input: {
  deviceId: string;
  cpu: number | null;
  ram: number | null;
  disk: number | null;
  temperatureC: number | null;
  expectedCpu: number | null;
  expectedRam: number | null;
  topProcesses: ProcessRow[];
  now?: Date;
}) {
  const detectedAt = (input.now ?? new Date()).toISOString();
  const anomalies: Array<{
    metric: string;
    observedValue: number;
    expectedValue: number | null;
    severity: "low" | "medium" | "high" | "critical";
    relatedProcess: string | null;
    relatedApplication: string | null;
    explanation: string;
    detectedAt: string;
  }> = [];

  const top = input.topProcesses[0]?.name ?? null;

  if (input.cpu != null && input.cpu >= THRESHOLDS.cpuHighPercent) {
    const expected = input.expectedCpu;
    const deviation =
      expected != null ? Math.round((input.cpu - expected) * 10) / 10 : null;
    anomalies.push({
      metric: "cpu",
      observedValue: input.cpu,
      expectedValue: expected,
      severity: input.cpu >= 95 ? "critical" : "high",
      relatedProcess: top,
      relatedApplication: top,
      explanation:
        expected != null && deviation != null
          ? `CPU reached ${input.cpu}% (typical for this hour ~${expected}%, deviation ${deviation > 0 ? "+" : ""}${deviation}%).`
          : `CPU reached ${input.cpu}% (above ${THRESHOLDS.cpuHighPercent}% threshold).`,
      detectedAt,
    });
  }

  if (input.ram != null && input.ram >= THRESHOLDS.ramHighPercent) {
    const expected = input.expectedRam;
    const deviation =
      expected != null ? Math.round((input.ram - expected) * 10) / 10 : null;
    anomalies.push({
      metric: "memory",
      observedValue: input.ram,
      expectedValue: expected,
      severity: input.ram >= 95 ? "critical" : "high",
      relatedProcess: top,
      relatedApplication: top,
      explanation:
        expected != null && deviation != null
          ? `RAM reached ${input.ram}% (typical ~${expected}%, deviation ${deviation > 0 ? "+" : ""}${deviation}%). Primary contributor candidate: ${top ?? "unknown"}.`
          : `RAM reached ${input.ram}% (above ${THRESHOLDS.ramHighPercent}% threshold).`,
      detectedAt,
    });
  }

  if (input.disk != null && input.disk >= THRESHOLDS.diskHighPercent) {
    anomalies.push({
      metric: "disk",
      observedValue: input.disk,
      expectedValue: null,
      severity: "high",
      relatedProcess: null,
      relatedApplication: null,
      explanation: `Disk usage reached ${input.disk}% (above ${THRESHOLDS.diskHighPercent}% threshold).`,
      detectedAt,
    });
  }

  if (
    input.temperatureC != null &&
    input.temperatureC >= THRESHOLDS.temperatureWarnC
  ) {
    anomalies.push({
      metric: "temperature",
      observedValue: input.temperatureC,
      expectedValue: null,
      severity: "high",
      relatedProcess: null,
      relatedApplication: null,
      explanation: `CPU temperature ${input.temperatureC}°C exceeds warning threshold ${THRESHOLDS.temperatureWarnC}°C.`,
      detectedAt,
    });
  }

  // Baseline deviation without hard threshold
  if (
    input.ram != null &&
    input.expectedRam != null &&
    input.ram < THRESHOLDS.ramHighPercent &&
    input.ram - input.expectedRam >= 20
  ) {
    anomalies.push({
      metric: "memory_baseline",
      observedValue: input.ram,
      expectedValue: input.expectedRam,
      severity: "medium",
      relatedProcess: top,
      relatedApplication: top,
      explanation: `RAM ${input.ram}% is +${Math.round(input.ram - input.expectedRam)}% above typical usage for this hour (${input.expectedRam}%).`,
      detectedAt,
    });
  }

  return anomalies;
}

export function compareWindows(
  current: ReturnType<typeof summarizeSeries>,
  previous: ReturnType<typeof summarizeSeries>,
  storageDeltaGb: number | null
) {
  const changes: string[] = [];
  const pct = (a: number | null, b: number | null) => {
    if (a == null || b == null || b === 0) return null;
    return Math.round(((a - b) / Math.abs(b)) * 1000) / 10;
  };

  const ramDelta = pct(current.ram.average, previous.ram.average);
  const cpuDelta = pct(current.cpu.average, previous.cpu.average);

  if (ramDelta != null && Math.abs(ramDelta) >= 10) {
    changes.push(
      `${ramDelta > 0 ? "+" : ""}RAM average changed ${ramDelta}% vs previous window`
    );
  } else {
    changes.push("Memory behavior: no significant change");
  }

  if (cpuDelta != null && Math.abs(cpuDelta) >= 10) {
    changes.push(
      `${cpuDelta > 0 ? "+" : ""}CPU average changed ${cpuDelta}% vs previous window`
    );
  } else {
    changes.push("CPU behavior: no significant change");
  }

  if (storageDeltaGb != null && Math.abs(storageDeltaGb) >= 1) {
    changes.push(
      `${storageDeltaGb > 0 ? "+" : ""}${storageDeltaGb.toFixed(1)} GB storage used vs previous`
    );
  }

  return {
    changes,
    current,
    previous,
    deltas: { cpuPercent: cpuDelta, ramPercent: ramDelta, storageGb: storageDeltaGb },
  };
}

export function buildEvidencePackage(input: {
  deviceId: string;
  question: string;
  windowStart: string;
  windowEnd: string;
  series: MetricPoint[];
  disks: Array<{ mount: string; usedPercent: number | null; freeBytes: number | null }>;
  network: Record<string, unknown>;
  topProcesses: ProcessRow[];
  recentEvents: Array<Record<string, unknown>>;
  baselines: Record<string, unknown> | null;
  limitations?: string[];
}): AiEvidencePackage {
  const summary = summarizeSeries(input.series);
  const limitations = [
    ...(input.limitations ?? []),
    "AI output is interpretive; observations are facts from telemetry.",
    "Unavailable metrics were not invented.",
  ];

  return {
    deviceId: input.deviceId,
    question: input.question,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    cpuSummary: summary.cpu,
    memorySummary: summary.ram,
    diskSummary: {
      partitions: input.disks,
    },
    gpuSummary: summary.gpu.samples ? summary.gpu : null,
    networkSummary: input.network,
    topProcesses: input.topProcesses.slice(0, 15).map((p) => ({
      name: p.name,
      cpuPercent: p.cpuPercent,
      memoryBytes: p.memoryBytes,
    })),
    recentEvents: input.recentEvents.slice(0, 30),
    baselines: input.baselines,
    limitations,
  };
}
