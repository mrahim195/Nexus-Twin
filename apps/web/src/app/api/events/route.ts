import { NextResponse } from "next/server";
import { eventsBatchSchema } from "@nexus-twin/validation";
import { EventModel } from "@nexus-twin/database";
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
    const body = eventsBatchSchema.parse(await req.json());
    await db();
    const docs = body.events
      .filter((e) => e.deviceId === String(auth.device._id))
      .map((e) => ({
        deviceId: auth.device._id,
        type: e.type,
        severity: e.severity,
        title: e.title,
        message: e.message,
        occurredAt: new Date(e.occurredAt),
        metadata: e.metadata,
        reportedByAgent: e.reportedByAgent,
      }));

    if (docs.length) {
      await EventModel.insertMany(docs);
      const last = docs[docs.length - 1]!;
      if (last.type === "sleep" || last.type === "shutdown") {
        auth.device.status = last.type === "sleep" ? "SLEEPING" : "OFFLINE";
        auth.device.lastKnownReason = last.message;
        await auth.device.save();
      }
    }

    return NextResponse.json({ ok: true, inserted: docs.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid events" }, { status: 400 });
  }
}
