import { NextResponse } from "next/server";
import { heartbeatSchema } from "@nexus-twin/validation";
import { AgentStatusModel } from "@nexus-twin/database";
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

    // One device write — no redundant updateOne
    await auth.device.updateOne({
      $set: {
        lastHeartbeatAt: now,
        lastSeenAt: now,
        agentVersion: body.agentVersion,
        status: body.statusHint || "ONLINE",
        lastKnownReason: null,
      },
    });

    // Lightweight agent presence (no collectors payload)
    await AgentStatusModel.updateOne(
      { deviceId: auth.device._id },
      {
        $set: {
          agentVersion: body.agentVersion,
          connected: true,
          lastHeartbeatAt: now,
          telemetryActive: true,
          lastSyncAt: now,
        },
        $setOnInsert: { deviceId: auth.device._id, queueSize: 0, collectors: [] },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid heartbeat" }, { status: 400 });
  }
}
