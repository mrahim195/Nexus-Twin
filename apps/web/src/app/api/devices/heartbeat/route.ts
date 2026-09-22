import { NextResponse } from "next/server";
import { heartbeatSchema } from "@nexus-twin/validation";
import { AgentStatusModel, DeviceModel } from "@nexus-twin/database";
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
    const body = heartbeatSchema.parse(await req.json());
    if (body.deviceId !== String(auth.device._id)) {
      return NextResponse.json({ error: "Device mismatch" }, { status: 403 });
    }
    await db();
    const now = new Date(body.timestamp);
    auth.device.lastHeartbeatAt = now;
    auth.device.lastSeenAt = now;
    auth.device.agentVersion = body.agentVersion;
    auth.device.status = body.statusHint || "ONLINE";
    auth.device.lastKnownReason = null;
    await auth.device.save();

    await AgentStatusModel.findOneAndUpdate(
      { deviceId: auth.device._id },
      {
        deviceId: auth.device._id,
        agentVersion: body.agentVersion,
        connected: true,
        lastHeartbeatAt: now,
        telemetryActive: true,
        lastSyncAt: now,
      },
      { upsert: true }
    );

    // Touch updatedAt via dummy find for offline detectors
    await DeviceModel.updateOne(
      { _id: auth.device._id },
      { $set: { updatedAt: now } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid heartbeat" }, { status: 400 });
  }
}
