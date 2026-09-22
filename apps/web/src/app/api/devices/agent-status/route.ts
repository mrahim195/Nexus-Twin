import { NextResponse } from "next/server";
import { z } from "zod";
import { AgentStatusModel } from "@nexus-twin/database";
import { requireDeviceAuth } from "@/lib/guards";
import { db } from "@/lib/mongo";

const schema = z.object({
  deviceId: z.string().min(1),
  agentVersion: z.string().min(1),
  connected: z.boolean(),
  telemetryActive: z.boolean(),
  queueSize: z.number().int().nonnegative(),
  failedUploads: z.number().int().nonnegative().optional(),
  collectors: z.array(
    z.object({
      name: z.string(),
      health: z.enum(["OK", "UNAVAILABLE", "ERROR"]),
      reason: z.string().nullable(),
    })
  ),
});

export async function POST(req: Request) {
  const auth = await requireDeviceAuth(
    req.headers.get("authorization"),
    req.headers.get("x-device-id")
  );
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    if (body.deviceId !== String(auth.device._id)) {
      return NextResponse.json({ error: "Device mismatch" }, { status: 403 });
    }
    await db();
    const now = new Date();
    await AgentStatusModel.findOneAndUpdate(
      { deviceId: auth.device._id },
      {
        deviceId: auth.device._id,
        agentVersion: body.agentVersion,
        connected: body.connected,
        lastHeartbeatAt: now,
        telemetryActive: body.telemetryActive,
        queueSize: body.queueSize,
        failedUploads: body.failedUploads ?? 0,
        lastSyncAt: now,
        collectors: body.collectors,
      },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid agent status" }, { status: 400 });
  }
}
