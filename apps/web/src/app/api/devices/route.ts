import { NextResponse } from "next/server";
import { DeviceModel } from "@nexus-twin/database";
import { requireUserSession } from "@/lib/guards";
import { db } from "@/lib/mongo";
import { deriveDeviceStatus, formatLastSeen } from "@/lib/device-utils";

export async function GET() {
  const auth = await requireUserSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await db();
  const devices = await DeviceModel.find({
    ownerId: auth.userId,
    revokedAt: null,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({
    devices: devices.map((d) => {
      const status = deriveDeviceStatus(d.lastHeartbeatAt);
      return {
        id: String(d._id),
        name: d.name,
        hostname: d.hostname,
        platform: d.platform,
        osVersion: d.osVersion,
        architecture: d.architecture,
        agentVersion: d.agentVersion,
        status,
        lastHeartbeatAt: d.lastHeartbeatAt,
        lastSeenAt: d.lastSeenAt,
        lastSeenLabel: formatLastSeen(d.lastSeenAt || d.lastHeartbeatAt),
        lastKnownReason:
          status === "OFFLINE"
            ? d.lastKnownReason ||
              "Connection lost — exact reason unknown."
            : d.lastKnownReason,
      };
    }),
  });
}
