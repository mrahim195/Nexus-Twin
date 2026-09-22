import { NextResponse } from "next/server";
import { telemetryBatchSchema } from "@nexus-twin/validation";
import { MetricSnapshotModel } from "@nexus-twin/database";
import { requireDeviceAuth } from "@/lib/guards";
import { db } from "@/lib/mongo";

export async function POST(req: Request) {
  const auth = await requireDeviceAuth(
    req.headers.get("authorization"),
    req.headers.get("x-device-id")
  );
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = telemetryBatchSchema.parse(await req.json());
    await db();
    const docs = body.snapshots
      .filter((s) => s.deviceId === String(auth.device._id))
      .map((s) => ({
        deviceId: auth.device._id,
        collectedAt: new Date(s.collectedAt),
        cpu: s.cpu,
        memory: s.memory,
        disks: s.disks,
        gpu: s.gpu,
        network: s.network,
      }));

    if (docs.length === 0) {
      return NextResponse.json({ error: "No valid snapshots" }, { status: 400 });
    }

    await MetricSnapshotModel.insertMany(docs, { ordered: false });
    auth.device.lastSeenAt = new Date();
    await auth.device.save();

    return NextResponse.json({ ok: true, inserted: docs.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid telemetry" }, { status: 400 });
  }
}
