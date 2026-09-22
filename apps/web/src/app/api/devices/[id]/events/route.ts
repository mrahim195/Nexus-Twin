import { NextResponse } from "next/server";
import { EventModel } from "@nexus-twin/database";
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

  const limit = Math.min(
    200,
    Number(new URL(req.url).searchParams.get("limit")) || 50
  );

  const events = await EventModel.find({ deviceId: device._id })
    .sort({ occurredAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    events: events.map((e) => ({
      id: String(e._id),
      type: e.type,
      severity: e.severity,
      title: e.title,
      message: e.message,
      occurredAt: e.occurredAt,
      reportedByAgent: e.reportedByAgent,
    })),
  });
}
