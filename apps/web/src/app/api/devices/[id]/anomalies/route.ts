import { NextResponse } from "next/server";
import { AnomalyModel, MetricSnapshotModel, ProcessSnapshotModel } from "@nexus-twin/database";
import { requireOwnedDevice, requireUserSession } from "@/lib/guards";
import { db } from "@/lib/mongo";
import {
  buildHourlyBaselines,
  detectAnomalies,
  expectedForNow,
  type MetricPoint,
} from "@/lib/analysis";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireUserSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await db();
  const device = await requireOwnedDevice(id, auth.userId);
  if (!device) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("scan") === "1") {
    const [recent, week, procs] = await Promise.all([
      MetricSnapshotModel.findOne({ deviceId: device._id })
        .sort({ collectedAt: -1 })
        .lean(),
      MetricSnapshotModel.find({
        deviceId: device._id,
        collectedAt: { $gte: new Date(Date.now() - 7 * 24 * 3600_000) },
      })
        .select({ collectedAt: 1, cpu: 1, memory: 1 })
        .limit(4000)
        .lean(),
      ProcessSnapshotModel.findOne({ deviceId: device._id })
        .sort({ collectedAt: -1 })
        .lean(),
    ]);

    if (recent) {
      const points: MetricPoint[] = week.map((m) => ({
        t: m.collectedAt,
        cpu:
          (m.cpu as { utilizationPercent?: number | null })?.utilizationPercent ??
          null,
        ram: (m.memory as { usedPercent?: number | null })?.usedPercent ?? null,
        gpu: null,
      }));
      const baselines = buildHourlyBaselines(points);
      const expected = expectedForNow(baselines);
      const found = detectAnomalies({
        deviceId: id,
        cpu:
          (recent.cpu as { utilizationPercent?: number | null })
            ?.utilizationPercent ?? null,
        ram:
          (recent.memory as { usedPercent?: number | null })?.usedPercent ?? null,
        disk:
          (
            (recent.disks as Array<{ usedPercent?: number | null }>)?.[0]
              ?.usedPercent
          ) ?? null,
        temperatureC:
          (recent.cpu as { temperatureC?: number | null })?.temperatureC ?? null,
        expectedCpu: expected.cpu,
        expectedRam: expected.ram,
        topProcesses: ((procs?.processes as Array<{
          name: string;
          cpuPercent: number | null;
          memoryBytes: number | null;
        }>) || []).slice(0, 5),
      });

      if (found.length) {
        await AnomalyModel.insertMany(
          found.map((a) => ({
            deviceId: device._id,
            ...a,
            detectedAt: new Date(a.detectedAt),
          }))
        );
      }
    }
  }

  const anomalies = await AnomalyModel.find({ deviceId: device._id })
    .sort({ detectedAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({
    anomalies: anomalies.map((a) => ({
      id: String(a._id),
      metric: a.metric,
      observedValue: a.observedValue,
      expectedValue: a.expectedValue,
      severity: a.severity,
      relatedProcess: a.relatedProcess,
      relatedApplication: a.relatedApplication,
      explanation: a.explanation,
      detectedAt: a.detectedAt,
    })),
  });
}
