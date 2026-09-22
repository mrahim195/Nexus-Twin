import { NextResponse } from "next/server";
import { MetricSnapshotModel } from "@nexus-twin/database";
import { requireOwnedDevice, requireUserSession } from "@/lib/guards";
import { db } from "@/lib/mongo";

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
  const range = url.searchParams.get("range") || "1h";
  const now = Date.now();
  const ms =
    range === "24h" || range === "today"
      ? 24 * 3600_000
      : range === "7d"
        ? 7 * 24 * 3600_000
        : range === "30d"
          ? 30 * 24 * 3600_000
          : 3600_000;

  const from = new Date(now - ms);
  const rows = await MetricSnapshotModel.find({
    deviceId: device._id,
    collectedAt: { $gte: from },
  })
    .sort({ collectedAt: 1 })
    .select({ collectedAt: 1, cpu: 1, memory: 1, gpu: 1, network: 1 })
    .limit(2000)
    .lean();

  // Simple downsample if too dense
  const step = Math.max(1, Math.ceil(rows.length / 300));
  const points = rows.filter((_, i) => i % step === 0).map((r) => ({
    t: r.collectedAt,
    cpu: (r.cpu as { utilizationPercent?: number | null })?.utilizationPercent ?? null,
    ram: (r.memory as { usedPercent?: number | null })?.usedPercent ?? null,
    gpu: (r.gpu as { utilizationPercent?: number | null } | null)?.utilizationPercent ?? null,
  }));

  return NextResponse.json({ range, points });
}
