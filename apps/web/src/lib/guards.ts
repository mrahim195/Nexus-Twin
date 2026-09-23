import { getServerSession } from "next-auth";
import {
  DeviceCredentialModel,
  DeviceModel,
  type DeviceCredentialDoc,
  type DeviceDoc,
} from "@nexus-twin/database";
import type { HydratedDocument } from "mongoose";
import { authOptions } from "./auth";
import { hashToken } from "./device-utils";
import { db } from "./mongo";

export async function requireUserSession(): Promise<{
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
  userId: string;
} | null> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!session || !userId) {
    return null;
  }
  return { session, userId };
}

export async function requireOwnedDevice(
  deviceId: string,
  userId: string
): Promise<HydratedDocument<DeviceDoc> | null> {
  await db();
  return DeviceModel.findOne({
    _id: deviceId,
    ownerId: userId,
    revokedAt: null,
  });
}

export async function requireDeviceAuth(
  authHeader: string | null,
  deviceIdHeader: string | null
): Promise<{
  device: HydratedDocument<DeviceDoc>;
  cred: HydratedDocument<DeviceCredentialDoc>;
} | null> {
  if (!authHeader?.startsWith("Bearer ") || !deviceIdHeader) {
    return null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  await db();

  const [cred, device] = await Promise.all([
    DeviceCredentialModel.findOne({
      deviceId: deviceIdHeader,
      tokenHash: hashToken(token),
      revokedAt: null,
    }),
    DeviceModel.findOne({
      _id: deviceIdHeader,
      revokedAt: null,
    }),
  ]);

  if (!cred || !device) return null;
  return { device, cred };
}
