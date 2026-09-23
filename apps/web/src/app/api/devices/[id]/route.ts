import { NextResponse } from "next/server";
import { requireOwnedDevice, requireUserSession } from "@/lib/guards";
import { db } from "@/lib/mongo";
import { deriveDeviceStatus, formatLastSeen } from "@/lib/device-utils";

type Ctx = { params: Promise<{ id: string }> };

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

  const status = deriveDeviceStatus(device.lastHeartbeatAt, device.status);
  return NextResponse.json({
    device: {
      id: String(device._id),
      name: device.name,
      hostname: device.hostname,
      platform: device.platform,
      osVersion: device.osVersion,
      architecture: device.architecture,
      agentVersion: device.agentVersion,
      status,
      lastHeartbeatAt: device.lastHeartbeatAt,
      lastSeenAt: device.lastSeenAt,
      lastSeenLabel: formatLastSeen(device.lastSeenAt || device.lastHeartbeatAt),
      lastKnownReason:
        status === "OFFLINE"
          ? device.lastKnownReason ||
            "Connection lost. Exact reason unknown."
          : device.lastKnownReason,
    },
  });
}
