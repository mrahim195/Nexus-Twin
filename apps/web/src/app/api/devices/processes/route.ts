import { NextResponse } from "next/server";
import { processSnapshotSchema } from "@nexus-twin/validation";
import { ProcessSnapshotModel } from "@nexus-twin/database";
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
    const body = processSnapshotSchema.parse(await req.json());
    if (body.deviceId !== String(auth.device._id)) {
      return NextResponse.json({ error: "Device mismatch" }, { status: 403 });
    }
    await db();
    await ProcessSnapshotModel.create({
      deviceId: auth.device._id,
      collectedAt: new Date(body.collectedAt),
      processes: body.processes,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid process snapshot" }, { status: 400 });
  }
}
