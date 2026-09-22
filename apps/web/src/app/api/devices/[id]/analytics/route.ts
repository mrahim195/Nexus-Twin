import { NextResponse } from "next/server";
import { MetricSnapshotModel } from "@nexus-twin/database";
import { requireOwnedDevice, requireUserSession } from "@/lib/guards";
import { db } from "@/lib/mongo";
import {
  buildHourlyBaselines,
  compareWindows,
  expectedForNow,
  summarizeSeries,
  type MetricPoint,
} from "@/lib/analysis";

type Ctx = { params: Promise<{ id: string }> };

function toPoints(
  rows: Array<{
    collectedAt: Date;
    cpu?: unknown;
    memory?: unknown;
    gpu?: unknown;
  }>
): MetricPoint[] {
  return rows.map((m) => ({
    t: m.collectedAt,
    cpu: (m.cpu as { utilizationPercent?: number | null })?.utilizationPercent ?? null,
    ram: (m.memory as { usedPercent?: number | null })?.usedPercent ?? null,
    gpu:
      (m.gpu as { utilizationPercent?: number | null } | null)?.utilizationPercent ??
      null,
  }));
}

export async function GET(_req: Request, ctx: Ctx) {
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

  const now = Date.now();
  const day = 24 * 3600_000;
  const [todayRows, yesterdayRows, weekRows, latest] = await Promise.all([
    MetricSnapshotModel.find({
      deviceId: device._id,
      collectedAt: { $gte: new Date(now - day) },
    })
      .sort({ collectedAt: 1 })
      .limit(3000)
      .lean(),
    MetricSnapshotModel.find({
      deviceId: device._id,
      collectedAt: { $gte: new Date(now - 2 * day), $lt: new Date(now - day) },
    })
      .sort({ collectedAt: 1 })
      .limit(3000)
      .lean(),
    MetricSnapshotModel.find({
      deviceId: device._id,
      collectedAt: { $gte: new Date(now - 7 * day) },
    })
      .select({ collectedAt: 1, cpu: 1, memory: 1 })
      .limit(5000)
      .lean(),
    MetricSnapshotModel.findOne({ deviceId: device._id })
      .sort({ collectedAt: -1 })
      .lean(),
  ]);

  const today = summarizeSeries(toPoints(todayRows));
  const yesterday = summarizeSeries(toPoints(yesterdayRows));
  const comparison = compareWindows(today, yesterday, null);
  const baselines = buildHourlyBaselines(toPoints(weekRows));
  const expected = expectedForNow(baselines);

  const currentRam =
    (latest?.memory as { usedPercent?: number | null })?.usedPercent ?? null;
  const currentCpu =
    (latest?.cpu as { utilizationPercent?: number | null })?.utilizationPercent ??
    null;

  return NextResponse.json({
    comparison,
    baselines,
    current: {
      cpu: currentCpu,
      ram: currentRam,
      expectedCpu: expected.cpu,
      expectedRam: expected.ram,
      cpuDeviation:
        currentCpu != null && expected.cpu != null
          ? Math.round((currentCpu - expected.cpu) * 10) / 10
          : null,
      ramDeviation:
        currentRam != null && expected.ram != null
          ? Math.round((currentRam - expected.ram) * 10) / 10
          : null,
    },
    today,
    yesterday,
  });
}
