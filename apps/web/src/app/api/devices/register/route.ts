import { NextResponse } from "next/server";
import { registerDeviceSchema } from "@nexus-twin/validation";
import {
  DeviceCredentialModel,
  DeviceModel,
  EventModel,
  PairingCodeModel,
} from "@nexus-twin/database";
import { db } from "@/lib/mongo";
import { generateDeviceToken, hashToken } from "@/lib/device-utils";

export async function POST(req: Request) {
  try {
    const body = registerDeviceSchema.parse(await req.json());
    await db();

    const pairing = await PairingCodeModel.findOne({
      code: body.pairingCode.toUpperCase(),
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!pairing) {
      return NextResponse.json(
        { error: "Invalid or expired pairing code" },
        { status: 400 }
      );
    }

    const device = await DeviceModel.create({
      ownerId: pairing.ownerId,
      name: body.name || body.hostname,
      hostname: body.hostname,
      platform: body.platform,
      osVersion: body.osVersion,
      architecture: body.architecture,
      agentVersion: body.agentVersion,
      status: "ONLINE",
      lastHeartbeatAt: new Date(),
      lastSeenAt: new Date(),
      lastKnownReason: null,
    });

    const deviceToken = generateDeviceToken();
    await DeviceCredentialModel.create({
      deviceId: device._id,
      tokenHash: hashToken(deviceToken),
      label: "initial",
    });

    pairing.consumedAt = new Date();
    await pairing.save();

    await EventModel.create({
      deviceId: device._id,
      type: "startup",
      severity: "info",
      title: "Device paired",
      message: `${device.name} connected to NEXUS//TWIN`,
      occurredAt: new Date(),
      reportedByAgent: true,
    });

    return NextResponse.json({
      deviceId: String(device._id),
      deviceToken,
      name: device.name,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 400 });
  }
}
